# Where The ISS At? API

Официальная документация: https://wheretheiss.at/w/developer

Используемый endpoint:

GET https://api.wheretheiss.at/v1/satellites/25544

`25544` — NORAD catalog ID Международной космической станции (ISS).

В приложении используются поля JSON-ответа:
- `latitude` — широта;
- `longitude` — долгота;
- `altitude` — высота орбиты;
- `velocity` — скорость;
- `visibility` — положение на освещённой/теневой стороне Земли;
- `footprint` — диаметр области земной поверхности, видимой со станции;
- `timestamp` — Unix-время данных;
- `units` — единицы измерения.

Авторизация: не требуется.
Формат ответа: JSON.
Ограничение: примерно 1 запрос в секунду; лимиты также возвращаются в HTTP-заголовках X-Rate-Limit.
