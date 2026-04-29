import React, { useState, useEffect } from 'react';
import './App.css';
import ToDoForm from './AddTask';
import ToDo from './Task';
import axios from 'axios';

const TASKS_STORAGE_KEY = 'tasks-list-project-web';
const weatherApiKey = 'c7616da4b68205c2f3ae73df2c31d177';

function App() {
  const [todos, setTodos] = useState(() => {
    const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [rates, setRates] = useState({});
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);

      try {
        const currencyResponse = await axios.get(
          'https://www.cbr-xml-daily.ru/daily_json.js'
        );

        const USDrate = currencyResponse.data.Valute.USD.Value
          .toFixed(4)
          .replace('.', ',');

        const EURrate = currencyResponse.data.Valute.EUR.Value
          .toFixed(4)
          .replace('.', ',');

        setRates({ USDrate, EURrate });
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить курс валют.');
      }

      try {
        const weatherResponse = await axios.get(
          `/weather/data/2.5/weather?lat=45.0355&lon=38.9753&appid=${weatherApiKey}&units=metric&lang=ru`
        );

        setWeatherData(weatherResponse.data);
      } catch (weatherErr) {
        console.error(weatherErr);
        setWeatherData(null);
      }

      setLoading(false);
    }

    fetchAllData();
  }, []);

  const addTask = (userInput) => {
    if (userInput.trim()) {
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        task: userInput,
        complete: false,
      };

      setTodos([...todos, newItem]);
    }
  };

  const removeTask = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleToggle = (id) => {
    setTodos(
      todos.map((task) =>
        task.id === id
          ? { ...task, complete: !task.complete }
          : task
      )
    );
  };

  const totalTasks = todos.length;
  const completedTasks = todos.filter((todo) => todo.complete).length;
  const activeTasks = totalTasks - completedTasks;

  return (
    <div className="App">
      {loading && <p>Загрузка...</p>}

      {!loading && (
        <div className="info">
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div className="money">
            <div id="USD">
              Доллар США $ — {rates.USDrate || 'нет данных'} руб.
            </div>
            <div id="EUR">
              Евро € — {rates.EURrate || 'нет данных'} руб.
            </div>
          </div>

          {weatherData ? (
            <div className="weather-info">
              <div>
                Погода в Краснодаре сегодня:
                <br />
                🌡️ {weatherData.main.temp.toFixed(1)}°C{' '}
                ༄.° {weatherData.wind.speed} м/с{' '}
                ☁️ {weatherData.clouds.all}%
              </div>

              <img
                className="weather-icon"
                src={`https://openweathermap.org/img/w/${weatherData.weather[0].icon}.png`}
                alt="Иконка погоды"
              />
            </div>
          ) : (
            <p>Погода временно недоступна</p>
          )}
        </div>
      )}

      <header>
        <h1 className="list-header">Список задач</h1>

        <div className="task-stats">
          <p>Всего задач: {totalTasks}</p>
          <p>Активные задачи: {activeTasks}</p>
          <p>Выполненные задачи: {completedTasks}</p>
        </div>
      </header>

      <ToDoForm addTask={addTask} />

      <div className="todo-list">
        {todos.length === 0 ? (
          <p>Пока задач нет</p>
        ) : (
          todos.map((todo) => (
            <ToDo
              key={todo.id}
              todo={todo}
              toggleTask={handleToggle}
              removeTask={removeTask}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default App;