import React, { useState, useEffect, useRef } from 'react';

import styles from './App.module.css';

function App() {
  const [eps, setEps] = useState(45);
  const [minPts, setMinPts] = useState(3);
  const [showRadius, setShowRadius] = useState(true);

  const [points, setPoints] = useState([]);

  const canvasRef = useRef(null);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  // Обработчик клика по холсту для добавления точек
  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect(); // Получаем координаты холста относительно окна
    const x = event.clientX - rect.left; // Вычисляем координату X клика относительно холста
    const y = event.clientY - rect.top; // Вычисляем координату Y клика относительно холста
    setPoints([...points, { x, y }]); // Добавляем новую точку в массив точек
  };

  // Поиск расстояния от одной точки до другой
  const distance = (p1, p2) => {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  };

  // Функция для поиска всех точек в пределах заданного радиуса от данной точки
  const regionQuery = (points, point, eps) => {
    return points.filter((p) => distance(point, p) <= eps);
  };

  // Функция для расширения кластера, начиная с данной точки
  const expandCluster = (
    points, // Массив всех точек
    pointIndex, // Индекс текущей точки, с которой начинается расширение кластера
    clusterId, // Идентификатор текущего кластера
    eps, // Радиус для поиска соседних точек
    minPts, // Минимальное количество точек для формирования кластера
    clusterLabels, // Объект для хранения меток кластеров
  ) => {
    // Находим все точки в пределах радиуса eps от текущей точки
    let seeds = regionQuery(points, points[pointIndex], eps);

    // Если количество соседних точек меньше minPts, точка считается шумом
    if (seeds.length < minPts) {
      clusterLabels[pointIndex] = -1; // Помечаем точку как шум
      return false; // Возвращаем false, так как кластер не расширен
    } else {
      // Если количество соседних точек достаточно, точка становится частью кластера
      clusterLabels[pointIndex] = clusterId;

      // Проходим по всем соседним точкам
      for (let i = 0; i < seeds.length; i++) {
        // Находим индекс соседней точки в массиве points
        let seedIndex = points.indexOf(seeds[i]);

        // Если соседняя точка еще не была обработана
        if (clusterLabels[seedIndex] === undefined) {
          // Помечаем соседнюю точку как часть текущего кластера
          clusterLabels[seedIndex] = clusterId;

          // Добавляем соседние точки соседней точки в список seeds
          seeds = seeds.concat(regionQuery(points, seeds[i], eps));
        }

        // Если соседняя точка была помечена как шум, перемещаем ее в текущий кластер
        if (clusterLabels[seedIndex] === -1) {
          clusterLabels[seedIndex] = clusterId;
        }
      }

      // Возвращаем true, так как кластер успешно расширен
      return true;
    }
  };

  const dbscan = (points, eps, minPts) => {
    const clusterLabels = {}; // Создаем объект для хранения меток кластеров
    let clusterId = 0; // Инициализируем счетчик идентификаторов кластеров

    // Проходим по каждой точке
    for (let i = 0; i < points.length; i++) {
      // Если точка еще не была обработана (не имеет метки кластера)
      if (clusterLabels[i] === undefined) {
        // Пытаемся расширить кластер, начиная с этой точки
        if (expandCluster(points, i, clusterId, eps, minPts, clusterLabels)) {
          // Если успешно расширили кластер, увеличиваем счетчик идентификаторов кластеров
          clusterId++;
        }
      }
    }

    // Возвращаем объект с метками кластеров для всех точек
    return clusterLabels;
  };

  const drawPoints = (points, clusterLabels, showRadius, eps) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаем холст
    const colors = [
      'red',
      'blue',
      'green',
      'orange',
      'purple',
      'pink',
      'brown',
      'cyan',
      'magenta',
      'yellow',
    ];
    points.forEach((point, index) => {
      const clusterId = clusterLabels[index];
      const color =
        clusterId === -1 ? 'gray' : colors[clusterId % colors.length]; // Выбираем цвет для точки
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI); // Рисуем точку
      ctx.fill();
      if (showRadius) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, eps, 0, 2 * Math.PI); // Рисуем радиус вокруг точки
        ctx.stroke();
      }
    });
  };

  // Основная функция
  const runDBSCAN = () => {
    const clusterLabels = dbscan(points, eps, minPts);
    drawPoints(points, clusterLabels, showRadius, eps);
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    runDBSCAN();
  }, [points, eps, minPts, showRadius]);

  return (
    <div className={styles.App}>
      <div className={styles.controls}>
        <div className={styles.controlsBlock}>
          <p className={styles.inputLabel}>Eps:</p>
          <input
            className={styles.numberInput}
            type="number"
            id="eps"
            value={eps}
            onChange={(e) => setEps(parseInt(e.target.value))}
            onClick={(e) => e.target.select()}
          />
        </div>
        <div className={styles.controlsBlock}>
          <p className={styles.inputLabel}>MinPts:</p>
          <input
            className={styles.numberInput}
            type="number"
            id="minPts"
            value={minPts}
            onChange={(e) => setMinPts(parseInt(e.target.value))}
            onClick={(e) => e.target.select()}
          />
        </div>
        <div className={styles.controlsBlock}>
          <p className={styles.inputLabel}>Show Radius:</p>
          <input
            type="checkbox"
            id="showRadius"
            checked={showRadius}
            onChange={(e) => setShowRadius(e.target.checked)}
          />
        </div>
      </div>
      <canvas
        className={styles.canvas}
        ref={canvasRef}
        onClick={handleCanvasClick}
      ></canvas>
    </div>
  );
}

export default App;
