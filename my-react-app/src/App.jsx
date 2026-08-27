import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import ToDoForm from './AddTask';
import ToDo from './Task';
import axios from 'axios';

const TASKS_STORAGE_KEY = 'tasks-list-project-web';
const KRASNODAR = {
  latitude: 45.0355,
  longitude: 38.9753,
};

const getWeatherDescription = (code) => {
  const weatherCodes = {
    0: ['☀️', 'Ясно'],
    1: ['🌤️', 'Преимущественно ясно'],
    2: ['⛅', 'Переменная облачность'],
    3: ['☁️', 'Пасмурно'],
    45: ['🌫️', 'Туман'],
    48: ['🌫️', 'Изморозевый туман'],
    51: ['🌦️', 'Слабая морось'],
    53: ['🌦️', 'Умеренная морось'],
    55: ['🌧️', 'Сильная морось'],
    56: ['🌧️', 'Слабая ледяная морось'],
    57: ['🌧️', 'Сильная ледяная морось'],
    61: ['🌦️', 'Слабый дождь'],
    63: ['🌧️', 'Умеренный дождь'],
    65: ['🌧️', 'Сильный дождь'],
    66: ['🌧️', 'Слабый ледяной дождь'],
    67: ['🌧️', 'Сильный ледяной дождь'],
    71: ['🌨️', 'Слабый снег'],
    73: ['🌨️', 'Умеренный снег'],
    75: ['❄️', 'Сильный снег'],
    77: ['❄️', 'Снежные зёрна'],
    80: ['🌦️', 'Слабые ливни'],
    81: ['🌧️', 'Умеренные ливни'],
    82: ['⛈️', 'Сильные ливни'],
    85: ['🌨️', 'Слабый снегопад'],
    86: ['❄️', 'Сильный снегопад'],
    95: ['⛈️', 'Гроза'],
    96: ['⛈️', 'Гроза со слабым градом'],
    99: ['⛈️', 'Гроза с сильным градом'],
  };

  return weatherCodes[code] || ['🌡️', 'Нет описания'];
};

function App() {
  const [todos, setTodos] = useState(() => {
    const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [rates, setRates] = useState({});
  const [weatherData, setWeatherData] = useState(null);
  const [issData, setIssData] = useState(null);

  const [currencyError, setCurrencyError] = useState('');
  const [weatherError, setWeatherError] = useState('');
  const [issError, setIssError] = useState('');

  const [currencyLoading, setCurrencyLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [issLoading, setIssLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    async function fetchCurrency() {
      try {
        const currencyResponse = await axios.get(
          'https://www.cbr-xml-daily.ru/daily_json.js'
        );

        const USDrate = currencyResponse.data.Valute.USD.Value
          .toFixed(2)
          .replace('.', ',');

        const EURrate = currencyResponse.data.Valute.EUR.Value
          .toFixed(2)
          .replace('.', ',');

        setRates({ USDrate, EURrate });
      } catch (err) {
        console.error(err);
        setCurrencyError('Не удалось загрузить курс валют.');
      } finally {
        setCurrencyLoading(false);
      }
    }

    async function fetchWeather() {
      try {
        const weatherResponse = await axios.get(
          'https://api.open-meteo.com/v1/forecast',
          {
            params: {
              latitude: KRASNODAR.latitude,
              longitude: KRASNODAR.longitude,
              current: [
                'temperature_2m',
                'apparent_temperature',
                'relative_humidity_2m',
                'wind_speed_10m',
                'cloud_cover',
                'weather_code',
              ].join(','),
              wind_speed_unit: 'ms',
              timezone: 'Europe/Moscow',
            },
          }
        );

        setWeatherData(weatherResponse.data.current);
      } catch (err) {
        console.error(err);
        setWeatherError('Погода временно недоступна.');
      } finally {
        setWeatherLoading(false);
      }
    }

    fetchCurrency();
    fetchWeather();
  }, []);

  const fetchIssPosition = useCallback(async () => {
    setIssLoading(true);
    setIssError('');

    try {
      const issResponse = await axios.get(
        'https://api.wheretheiss.at/v1/satellites/25544'
      );

      setIssData(issResponse.data);
    } catch (err) {
      console.error(err);
      setIssData(null);
      setIssError(
        err.response?.status === 429
          ? 'Слишком много запросов к ISS API. Попробуйте немного позже.'
          : 'Не удалось получить текущее положение МКС.'
      );
    } finally {
      setIssLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssPosition();
  }, [fetchIssPosition]);

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
        task.id === id ? { ...task, complete: !task.complete } : task
      )
    );
  };

  const totalTasks = todos.length;
  const completedTasks = todos.filter((todo) => todo.complete).length;
  const activeTasks = totalTasks - completedTasks;

  const [weatherIcon, weatherDescription] = weatherData
    ? getWeatherDescription(weatherData.weather_code)
    : ['🌡️', ''];

  return (
    <main className="App">
      <header className="page-header">
        <div>
          <p className="eyebrow">WEB APPLICATION · REST API</p>
          <h1>Информационная панель</h1>
          <p className="page-description">
            Курсы валют, текущая погода, положение МКС и список задач в одном приложении.
          </p>
        </div>
        <div className="status-chip">3 API подключено</div>
      </header>

      <section className="dashboard-grid" aria-label="Данные внешних API">
        <article className="panel currency-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">ЦБ РФ</p>
              <h2>Курсы валют</h2>
            </div>
            <span className="panel-index">01</span>
          </div>

          {currencyError ? (
            <p className="api-error">{currencyError}</p>
          ) : (
            <div className="currency-list">
              <div className="currency-row">
                <span className="currency-code">USD</span>
                <span className="currency-name">Доллар США</span>
                <strong>{currencyLoading ? '—' : `${rates.USDrate || '—'} ₽`}</strong>
              </div>
              <div className="currency-row">
                <span className="currency-code">EUR</span>
                <span className="currency-name">Евро</span>
                <strong>{currencyLoading ? '—' : `${rates.EURrate || '—'} ₽`}</strong>
              </div>
            </div>
          )}
        </article>

        <article className="panel weather-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">OPEN-METEO</p>
              <h2>Краснодар</h2>
            </div>
            <span className="panel-index">02</span>
          </div>

          {weatherLoading ? (
            <p className="panel-status">Загрузка погоды...</p>
          ) : weatherData ? (
            <div className="weather-layout">
              <div>
                <div className="weather-temperature">
                  {weatherData.temperature_2m.toFixed(1)}°
                </div>
                <p className="weather-description">{weatherDescription}</p>
                <p className="weather-feels">
                  Ощущается как {weatherData.apparent_temperature.toFixed(1)}°C
                </p>
              </div>
              <div className="weather-emoji" aria-label={weatherDescription}>
                {weatherIcon}
              </div>
              <div className="weather-metrics">
                <div><span>Влажность</span><strong>{weatherData.relative_humidity_2m}%</strong></div>
                <div><span>Ветер</span><strong>{weatherData.wind_speed_10m.toFixed(1)} м/с</strong></div>
                <div><span>Облачность</span><strong>{weatherData.cloud_cover}%</strong></div>
              </div>
            </div>
          ) : (
            <p className="api-error">{weatherError || 'Погода временно недоступна.'}</p>
          )}
        </article>
      </section>

      <section className="panel iss-card">
        <div className="iss-card-header">
          <div>
            <p className="panel-kicker">WHERE THE ISS AT? · REST API</p>
            <h2>Международная космическая станция</h2>
          </div>

          <button
            className="iss-refresh-button"
            type="button"
            onClick={fetchIssPosition}
            disabled={issLoading}
          >
            {issLoading ? 'Обновление...' : 'Обновить положение'}
          </button>
        </div>

        {issLoading && !issData ? (
          <p className="panel-status">Получаем текущее положение МКС...</p>
        ) : issError ? (
          <p className="api-error">{issError}</p>
        ) : issData ? (
          <div className="iss-content">
            <div className="iss-primary">
              <p className="iss-label">Текущие координаты</p>
              <div className="iss-coordinates">
                <div>
                  <span>Широта</span>
                  <strong>{issData.latitude.toFixed(4)}°</strong>
                </div>
                <div>
                  <span>Долгота</span>
                  <strong>{issData.longitude.toFixed(4)}°</strong>
                </div>
              </div>
              <p className="iss-updated">
                Обновлено: {new Date(issData.timestamp * 1000).toLocaleString('ru-RU')}
              </p>
            </div>

            <div className="iss-metrics">
              <div>
                <span>Высота</span>
                <strong>{issData.altitude.toFixed(1)} км</strong>
              </div>
              <div>
                <span>Скорость</span>
                <strong>{Math.round(issData.velocity).toLocaleString('ru-RU')} км/ч</strong>
              </div>
              <div>
                <span>Видимость</span>
                <strong>{issData.visibility === 'daylight' ? 'Дневная сторона' : issData.visibility === 'eclipsed' ? 'В тени Земли' : issData.visibility}</strong>
              </div>
              <div>
                <span>Зона обзора</span>
                <strong>{Math.round(issData.footprint).toLocaleString('ru-RU')} км</strong>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="tasks-section">
        <div className="tasks-header">
          <div>
            <p className="eyebrow">LOCAL STORAGE</p>
            <h2>Список задач</h2>
          </div>
          <div className="task-stats">
            <span><strong>{totalTasks}</strong> всего</span>
            <span><strong>{activeTasks}</strong> активных</span>
            <span><strong>{completedTasks}</strong> готово</span>
          </div>
        </div>

        <ToDoForm addTask={addTask} />

        <div className="todo-list">
          {todos.length === 0 ? (
            <p className="empty-state">Пока задач нет — добавьте первую выше.</p>
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
      </section>
    </main>
  );
}

export default App;
