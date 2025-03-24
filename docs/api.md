# API SecureGrid

В данном документе описаны все доступные API-эндпоинты приложения SecureGrid.

## Формат ответа

Все ответы API имеют следующий формат:

**Успешный ответ**
```json
{
  "success": true,
  "data": { ... }
}
```

**Ответ с ошибкой**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Описание ошибки"
  }
}
```

## Аутентификация

Большинство API-эндпоинтов требуют аутентификации. Для этого необходимо передать JWT-токен в заголовке `Authorization` в формате `Bearer {token}`.

### Регистрация

```
POST /api/auth/register
```

**Параметры запроса**

| Параметр  | Тип    | Описание                 |
|-----------|--------|---------------------------|
| name      | string | Имя пользователя          |
| email     | string | Email пользователя        |
| password  | string | Пароль (минимум 8 символов) |

**Пример запроса**

```json
{
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "password": "securepassword123"
}
```

**Пример успешного ответа**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Иван Иванов",
      "email": "ivan@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Авторизация

```
POST /api/auth/login
```

**Параметры запроса**

| Параметр  | Тип    | Описание          |
|-----------|--------|------------------|
| email     | string | Email пользователя |
| password  | string | Пароль           |

**Пример запроса**

```json
{
  "email": "ivan@example.com",
  "password": "securepassword123"
}
```

**Пример успешного ответа**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Иван Иванов",
      "email": "ivan@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Работа с таблицами

### Получение списка таблиц

```
GET /api/spreadsheets
```

**Заголовки запроса**

| Заголовок     | Значение           |
|---------------|--------------------|
| Authorization | Bearer {token}    |

**Параметры запроса**

| Параметр  | Тип    | Описание                        | По умолчанию |
|-----------|--------|--------------------------------|-------------|
| page      | number | Номер страницы                 | 1           |
| limit     | number | Количество записей на странице | 10          |

**Пример успешного ответа**

```json
{
  "success": true,
  "data": {
    "spreadsheets": [
      {
        "id": 1,
        "title": "Бюджет 2024",
        "created_at": "2024-02-01T10:00:00Z",
        "updated_at": "2024-02-10T15:30:00Z",
        "owner": {
          "id": 1,
          "name": "Иван Иванов"
        }
      },
      {
        "id": 2,
        "title": "Маркетинговый план",
        "created_at": "2024-01-15T09:20:00Z",
        "updated_at": "2024-01-15T09:20:00Z",
        "owner": {
          "id": 1,
          "name": "Иван Иванов"
        }
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### Создание новой таблицы

```
POST /api/spreadsheets
```

**Заголовки запроса**

| Заголовок     | Значение           |
|---------------|--------------------|
| Authorization | Bearer {token}    |

**Параметры запроса**

| Параметр  | Тип    | Описание                |
|-----------|--------|--------------------------|
| title     | string | Название таблицы        |
| rows      | number | Количество строк (1-1000) | 
| columns   | number | Количество столбцов (1-100) |

**Пример запроса**

```json
{
  "title": "Новая таблица",
  "rows": 100,
  "columns": 20
}
```

**Пример успешного ответа**

```json
{
  "success": true,
  "data": {
    "spreadsheet": {
      "id": 3,
      "title": "Новая таблица",
      "rows": 100,
      "columns": 20,
      "created_at": "2024-03-01T12:00:00Z",
      "updated_at": "2024-03-01T12:00:00Z",
      "owner": {
        "id": 1,
        "name": "Иван Иванов"
      }
    }
  }
}
```

### Получение таблицы

```
GET /api/spreadsheets/:id
```

**Заголовки запроса**

| Заголовок     | Значение           |
|---------------|--------------------|
| Authorization | Bearer {token}    |

**Параметры пути**

| Параметр  | Тип    | Описание        |
|-----------|--------|----------------|
| id        | number | ID таблицы     |

**Пример успешного ответа**

```json
{
  "success": true,
  "data": {
    "spreadsheet": {
      "id": 1,
      "title": "Бюджет 2024",
      "rows": 100,
      "columns": 20,
      "created_at": "2024-02-01T10:00:00Z",
      "updated_at": "2024-02-10T15:30:00Z",
      "owner": {
        "id": 1,
        "name": "Иван Иванов"
      },
      "cells": [
        {
          "id": "A1",
          "value": "Категория",
          "display_value": "Категория",
          "type": "string"
        },
        {
          "id": "B1",
          "value": "Январь",
          "display_value": "Январь",
          "type": "string"
        },
        {
          "id": "A2",
          "value": "Доходы",
          "display_value": "Доходы",
          "type": "string"
        },
        {
          "id": "B2",
          "value": "10000",
          "display_value": "10,000.00 ₽",
          "type": "number"
        }
      ],
      "permissions": {
        "can_edit": true,
        "can_share": true
      }
    }
  }
}
```

## Работа с ячейками

### Обновление ячейки

```
PUT /api/spreadsheets/:id/cells/:cell_id
```

**Заголовки запроса**

| Заголовок     | Значение           |
|---------------|--------------------|
| Authorization | Bearer {token}    |

**Параметры пути**

| Параметр  | Тип    | Описание        |
|-----------|--------|----------------|
| id        | number | ID таблицы     |
| cell_id   | string | ID ячейки (A1, B2, и т.д.) |

**Параметры запроса**

| Параметр  | Тип    | Описание                     |
|-----------|--------|-----------------------------|
| value     | string | Значение ячейки             |

**Пример запроса**

```json
{
  "value": "=SUM(B2:B5)"
}
```

**Пример успешного ответа**

```json
{
  "success": true,
  "data": {
    "cell": {
      "id": "B6",
      "value": "=SUM(B2:B5)",
      "display_value": "25,000.00 ₽",
      "type": "formula"
    }
  }
}
```

## Совместная работа

### Получение пользователей с доступом к таблице

```
GET /api/spreadsheets/:id/permissions
```

**Заголовки запроса**

| Заголовок     | Значение           |
|---------------|--------------------|
| Authorization | Bearer {token}    |

**Параметры пути**

| Параметр  | Тип    | Описание        |
|-----------|--------|----------------|
| id        | number | ID таблицы     |

**Пример успешного ответа**

```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "user": {
          "id": 1,
          "name": "Иван Иванов",
          "email": "ivan@example.com"
        },
        "role": "owner",
        "can_edit": true,
        "can_share": true
      },
      {
        "user": {
          "id": 2,
          "name": "Петр Петров",
          "email": "petr@example.com"
        },
        "role": "editor",
        "can_edit": true,
        "can_share": false
      },
      {
        "user": {
          "id": 3,
          "name": "Анна Сидорова",
          "email": "anna@example.com"
        },
        "role": "viewer",
        "can_edit": false,
        "can_share": false
      }
    ]
  }
}
```

### Предоставление доступа к таблице

```
POST /api/spreadsheets/:id/share
```

**Заголовки запроса**

| Заголовок     | Значение           |
|---------------|--------------------|
| Authorization | Bearer {token}    |

**Параметры пути**

| Параметр  | Тип    | Описание        |
|-----------|--------|----------------|
| id        | number | ID таблицы     |

**Параметры запроса**

| Параметр  | Тип    | Описание                     |
|-----------|--------|-----------------------------|
| email     | string | Email пользователя          |
| role      | string | Роль (editor, viewer)       |

**Пример запроса**

```json
{
  "email": "new_user@example.com",
  "role": "editor"
}
```

**Пример успешного ответа**

```json
{
  "success": true,
  "data": {
    "message": "Доступ успешно предоставлен"
  }
}
```

## WebSocket API

Для совместного редактирования в реальном времени используется WebSocket соединение.

### Подключение

```
Соединение: /socket
Аутентификация через параметр запроса: ?token=JWT_TOKEN
```

### События

**Вхождение в комнату таблицы**

```json
// Клиент отправляет:
{
  "type": "JOIN_SPREADSHEET",
  "spreadsheet_id": 1
}

// Сервер отвечает:
{
  "type": "SPREADSHEET_JOINED",
  "users": [
    {
      "id": 1,
      "name": "Иван Иванов"
    },
    {
      "id": 2,
      "name": "Петр Петров"
    }
  ]
}
```

**Изменение ячейки**

```json
// Клиент отправляет:
{
  "type": "CELL_UPDATE",
  "spreadsheet_id": 1,
  "cell_id": "A1",
  "value": "Новое значение"
}

// Сервер отправляет всем клиентам в комнате:
{
  "type": "CELL_UPDATED",
  "user_id": 1,
  "cell": {
    "id": "A1",
    "value": "Новое значение",
    "display_value": "Новое значение",
    "type": "string"
  }
}
```

**Подключение нового пользователя**

```json
// Сервер отправляет всем в комнате, кроме подключившегося:
{
  "type": "USER_JOINED",
  "user": {
    "id": 3,
    "name": "Анна Сидорова"
  }
}
```

**Отключение пользователя**

```json
// Сервер отправляет всем в комнате:
{
  "type": "USER_LEFT",
  "user_id": 2
}
```