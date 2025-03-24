const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Импорт маршрутов
const sheetRoutes = require('./routes/sheetsRoutes');
const userRoutes = require('./routes/userRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');

// Подключение к базе данных
const db = require('./config/db');

// Импорт служб
const formulaEngine = require('./services/formulaEngine');
const syncEngine = require('./services/syncEngine');

// Загрузка переменных окружения
dotenv.config();

// Инициализация приложения Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Настройка middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка статических файлов для production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, './client/build');
  console.log(`Проверка пути клиентской сборки: ${clientPath}`);
  
  try {
    // Проверка наличия директории client/build
    if (fs.existsSync(clientPath)) {
      app.use(express.static(clientPath));
      console.log('Статические файлы подключены успешно');
    } else {
      console.error(`Директория ${clientPath} не найдена. Статические файлы не будут обслуживаться.`);
    }
  } catch (error) {
    console.error('Ошибка при настройке статических файлов:', error);
  }
}

// Маршруты API
app.use('/api/sheets', sheetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipments', shipmentRoutes);

// Объект для хранения активных соединений и состояний документов
const connectedUsers = {};
const activeDocuments = {};

// WebSocket обработчики
io.on('connection', (socket) => {
  console.log('Новое соединение:', socket.id);
  
  // Аутентификация через токен
  const token = socket.handshake.auth.token;
  let userId = null;
  
  try {
    // Здесь должна быть верификация JWT токена и получение userId
    // Для примера используем простую заглушку
    userId = 'user-' + Math.floor(Math.random() * 1000);
    
    // Сохраняем информацию о пользователе
    connectedUsers[socket.id] = {
      userId,
      activeDocument: null
    };
    
    console.log(`Пользователь ${userId} авторизован`);
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    socket.disconnect();
    return;
  }

  // Обработчик присоединения к документу
  socket.on('join-document', async ({ documentId }, callback) => {
    try {
      // Проверка прав доступа и получение документа из БД (здесь будет реальный код)
      // Для примера используем заглушку
      if (!activeDocuments[documentId]) {
        // Инициализация нового документа
        activeDocuments[documentId] = {
          cells: {},
          users: []
        };
      }
      
      // Добавляем пользователя к документу
      socket.join(documentId);
      connectedUsers[socket.id].activeDocument = documentId;
      activeDocuments[documentId].users.push(userId);
      
      // Отправляем текущее состояние документа
      callback({
        cells: activeDocuments[documentId].cells
      });
      
      // Уведомляем всех пользователей документа о новом участнике
      io.to(documentId).emit('users-update', activeDocuments[documentId].users);
      
      console.log(`Пользователь ${userId} присоединился к документу ${documentId}`);
    } catch (error) {
      console.error('Ошибка при присоединении к документу:', error);
      callback({ error: 'Не удалось загрузить документ' });
    }
  });

  // Обработчик обновления ячейки
  socket.on('update-cell', async ({ documentId, row, col, value }) => {
    try {
      // Проверяем, что пользователь присоединен к документу
      if (connectedUsers[socket.id].activeDocument !== documentId) {
        throw new Error('Пользователь не присоединен к документу');
      }
      
      // Создаем ключ ячейки
      const cellId = `${row}-${col}`;
      
      // Запускаем вычисление формулы (если нужно) и получаем отображаемое значение
      // Здесь будет использоваться модуль formulaEngine
      const displayValue = await formulaEngine.evaluateFormula(value, documentId);
      
      // Обновляем состояние ячейки в памяти
      activeDocuments[documentId].cells[cellId] = {
        id: cellId,
        value,
        displayValue,
        row,
        col
      };
      
      // Синхронизируем изменения с базой данных (в реальной реализации)
      // ...
      
      // Отправляем обновленную ячейку всем пользователям документа
      io.to(documentId).emit('cell-update', activeDocuments[documentId].cells[cellId]);
      
      console.log(`Ячейка ${cellId} обновлена в документе ${documentId}`);
    } catch (error) {
      console.error('Ошибка при обновлении ячейки:', error);
      socket.emit('error', 'Не удалось обновить ячейку');
    }
  });

  // Обработчик покидания документа
  socket.on('leave-document', ({ documentId }) => {
    if (connectedUsers[socket.id].activeDocument === documentId) {
      // Удаляем пользователя из списка активных пользователей документа
      const userIndex = activeDocuments[documentId].users.indexOf(userId);
      if (userIndex !== -1) {
        activeDocuments[documentId].users.splice(userIndex, 1);
      }
      
      // Уведомляем остальных пользователей
      io.to(documentId).emit('users-update', activeDocuments[documentId].users);
      
      // Отписываем сокет от комнаты документа
      socket.leave(documentId);
      connectedUsers[socket.id].activeDocument = null;
      
      console.log(`Пользователь ${userId} покинул документ ${documentId}`);
    }
  });

  // Обработчик отключения
  socket.on('disconnect', () => {
    if (connectedUsers[socket.id]) {
      const documentId = connectedUsers[socket.id].activeDocument;
      
      // Если пользователь был в документе, удаляем его из списка
      if (documentId && activeDocuments[documentId]) {
        const userIndex = activeDocuments[documentId].users.indexOf(userId);
        if (userIndex !== -1) {
          activeDocuments[documentId].users.splice(userIndex, 1);
          io.to(documentId).emit('users-update', activeDocuments[documentId].users);
        }
      }
      
      // Удаляем информацию о пользователе
      delete connectedUsers[socket.id];
      console.log(`Пользователь ${userId} отключился`);
    }
  });
});

// Маршрут для SPA в production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, './client/build/index.html');
    
    try {
      // Проверка наличия файла index.html
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ 
          error: 'Файл index.html не найден. Возможно, клиентская часть не была собрана.' 
        });
      }
    } catch (error) {
      console.error('Ошибка при отправке файла index.html:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });
}

// Запуск сервера
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});