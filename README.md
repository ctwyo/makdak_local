# Makdak

Веб-приложение для автоматизации управления заказами на складе с интеграцией Telegram.

## Описание

Приложение автоматизирует управление заказами на складе. Telegram-бот распознаёт заказы из сообщений по ключевым словам, передаёт их на сервер, который сохраняет данные в MongoDB и уведомляет пользователей через WebSocket. Фронтенд на React предоставляет удобный интерфейс для работы с заказами.

### Основной функционал

- Создание заказов через Telegram-бот.
- Редактирование текста и данных заказа.
- Изменение статуса заказа на «Готов» с уведомлением в Telegram.
- Удаление заказов.
- Печать заказов с использованием библиотеки `docx`.
- Мгновенные обновления через WebSocket.

## Технологический стек

### Фронтенд

- **React**: Интерфейс пользователя.
- **Redux Toolkit**: Управление состоянием.
- **Material-UI**: Компоненты и стилизация.
- **WebSocket (`ws`)**: Мгновенные обновления.
- **docx**: Генерация документов.
- **React Router**: Навигация.
- **date-fns**: Работа с датами.
- **petrovich**: Склонение имён.
- **file-saver**: Сохранение файлов.

### Бэкенд

- **Express**: REST API.
- **MongoDB (Mongoose)**: Хранение данных.
- **WebSocket (`ws`)**: Синхронизация данных.
- **Telegraf**: Telegram-бот.
- **node-cron**: Планировщик задач.
- **dotenv**: Управление конфигурацией.

## Структура проекта

- **/frontend**: React-приложение, Redux, WebSocket, генерация документов.
- **/backend**: Express-сервер, MongoDB, WebSocket, Telegram-бот.

## Установка и запуск

### Требования

- Node.js (>= 18.x)
- MongoDB (локально или MongoDB Atlas)
- Telegram-бот (токен от [BotFather](https://t.me/BotFather))

### Установка

1. Клонируйте репозиторий:

   ```bash
   git clone https://github.com/ctwyo/orders-project.git
   cd orders-project
   ```

2. Установите зависимости фронтенда:

   ```bash
   cd frontend
   npm install
   ```

3. Установите зависимости бэкенда:

   ```bash
   cd ../backend
   npm install
   ```

4. Настройте `.env` в `/backend`:

   ```env
   BOT_TOKEN=<ваш_токен_бота>
   ```

5. Подключение к mongodb происходит по: `mongodb://127.0.0.1:27017`

6. Запустите MongoDB.

### Запуск

1. Запустите бэкенд:

```bash
cd backend
node server.js
```

Сервер: `http://localhost:3000`.

2. Запустите фронтенд:

   ```bash
   cd frontend
   npm run dev
   ```

   Фронтенд: `http://localhost:5173`.

3. Настройте Telegram-бота:

   - Добавьте бота в чат, проверьте распознавание сообщений.

   Чтобы сделать заказ пишем в бот, пример:

   @хочу
   Весы 3
   Монитор 2

   @хочу - ключевое слово (триггер)

## Задачи проекта

- [x] Фронтенд на React с Material-UI.
- [x] Express-сервер с WebSocket.
- [x] Интеграция с MongoDB.
- [x] Telegram-бот для заказов.
- [x] WebSocket-уведомления.
- [x] Печать заказов.
- [ ] Оптимизация API и фронтенда.
- [ ] Аутентификация пользователей.
- [ ] Расширение функционала бота.

## Зависимости

### Фронтенд

- `@emotion/react`, `@emotion/styled`, `@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`
- `@reduxjs/toolkit`, `react-redux`, `react-router`
- `docx`, `file-saver`, `petrovich`, `date-fns`
- `ws`, `uuid`
- Dev: `vite`, `eslint`, `@vitejs/plugin-react`

### Бэкенд

- `express`, `mongoose`, `telegraf`, `ws`
- `cors`, `node-cron`, `dotenv`, `uuid`
- Dev: `eslint`, `prettier`
