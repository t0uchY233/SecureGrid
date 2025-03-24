const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Параметры подключения к базе данных
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'securegrid';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

// Создание экземпляра Sequelize
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Для SQLite (опционально для разработки)
  // storage: './database.sqlite',
  // dialect: 'sqlite',
});

// Функция для инициализации подключения
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Соединение с базой данных установлено успешно.');
    
    // Синхронизация моделей с базой данных
    if (process.env.NODE_ENV === 'development') {
      // В режиме разработки можно использовать force: true для пересоздания таблиц
      // !!! НЕ ИСПОЛЬЗОВАТЬ В PRODUCTION !!!
      await sequelize.sync({ alter: true });
      console.log('Все модели синхронизированы с базой данных.');
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка подключения к базе данных:', error);
    return false;
  }
};

module.exports = sequelize;
module.exports.initializeDatabase = initializeDatabase;