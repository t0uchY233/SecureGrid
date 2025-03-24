# Базовый образ Node.js
FROM node:16-alpine

# Информация о приложении
LABEL maintainer="SecureGrid Team"

# Рабочая директория внутри контейнера
WORKDIR /app

# Установка рабочего пользователя
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Копирование package.json и package-lock.json
COPY server/package*.json ./

# Установка зависимостей
RUN npm install --production

# Копирование исходного кода (может быть изменено для отдельных клиентского и серверного Dockerfile)
COPY server/ ./

# Сборка клиентской части и помещение в папку статики сервера (для production)
# COPY client/build ./public

# Экспорт порта
EXPOSE 5000

# Команда для запуска приложения
CMD ["node", "app.js"]