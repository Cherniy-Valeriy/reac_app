import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import ToDoForm from './AddTask';
import ToDo from './Task';
import axios from 'axios';

const TASKS_STORAGE_KEY = 'tasks-list-project-web';
const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY;

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
  const [nasaData, setNasaData] = useState(null);
  const [nasaDate, setNasaDate] = useState('');

  const [currencyError, setCurrencyError] = useState('');
  const [weatherError, setWeatherError] = useState('');
  const [nasaError, setNasaError] = useState('');

  const [currencyLoading, setCurrencyLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [nasaLoading, setNasaLoading] = useState(true);

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

  const fetchNasaApod = useCallback(async (date = '') => {
    if (!NASA_API_KEY) {
      setNasaError(
        'NASA API key не настроен. Добавьте VITE_NASA_API_KEY в файл .env.'
      );
      setNasaLoading(false);
      return;
    }

    setNasaLoading(true);
    setNasaError('');

    try {
      const params = {
        api_key: NASA_API_KEY,
        thumbs: true,
      };

      if (date) {
        params.date = date;
      }

      const nasaResponse = await axios.get(
        'https://api.nasa.gov/planetary/apod',
        { params }
      );

      setNasaData(nasaResponse.data);
    } catch (err) {
      console.error(err);
      setNasaData(null);
      setNasaError(
        err.response?.status === 429
          ? 'Превышен лимит запросов NASA API.'
          : 'Не удалось загрузить данные NASA APOD.'
      );
    } finally {
      setNasaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNasaApod();
  }, [fetchNasaApod]);

  const handleNasaDateSubmit = (event) => {
    event.preventDefault();
    fetchNasaApod(nasaDate);
  };

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
            Курсы валют, текущая погода, NASA APOD и список задач в одном приложении.
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

      <section className="panel nasa-card">
        <div className="nasa-card-header">
          <div>
            <p className="panel-kicker">NASA OPEN API · APOD</p>
            <h2>Astronomy Picture of the Day</h2>
          </div>

          <form className="nasa-date-form" onSubmit={handleNasaDateSubmit}>
            <input
              type="date"
              value={nasaDate}
              min="1995-06-16"
              max={new Date().toISOString().split('T')[0]}
              onChange={(event) => setNasaDate(event.target.value)}
              aria-label="Дата изображения NASA"
            />
            <button type="submit">Показать</button>
          </form>
        </div>

        {nasaLoading ? (
          <p className="panel-status">Загрузка данных NASA...</p>
        ) : nasaError ? (
          <p className="api-error">{nasaError}</p>
        ) : nasaData ? (
          <div className="nasa-content">
            {nasaData.media_type === 'image' ? (
              <a
                className="nasa-media-link"
                href={nasaData.hdurl || nasaData.url}
                target="_blank"
                rel="noreferrer"
              >
                <img className="nasa-image" src={nasaData.url} alt={nasaData.title} />
              </a>
            ) : nasaData.thumbnail_url ? (
              <a
                className="nasa-media-link"
                href={nasaData.url}
                target="_blank"
                rel="noreferrer"
              >
                <img className="nasa-image" src={nasaData.thumbnail_url} alt={nasaData.title} />
              </a>
            ) : (
              <a className="nasa-video-link" href={nasaData.url} target="_blank" rel="noreferrer">
                Открыть видео NASA
              </a>
            )}

            <div className="nasa-text">
              <p className="nasa-date">{nasaData.date}</p>
              <h3>{nasaData.title}</h3>
              <p className="nasa-explanation">{nasaData.explanation}</p>
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
