import React, { useState, useEffect } from 'react';
import './App.css';
import TableEditor from './components/TableEditor.js';
import { createSocketConnection } from './services/api.js';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  
  // Добавим состояние для отслеживания авторизации
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('token') ? true : false);

  useEffect(() => {
    try {
      // Проверяем наличие токена при старте
      const token = localStorage.getItem('token');
      if (!token) {
        // Если токена нет, создаем демо-токен для тестирования
        localStorage.setItem('token', 'demo-token-123');
        setIsAuthenticated(true);
      }
    
      // Создаем подключение к сокету
      const socketConnection = createSocketConnection();
      setSocket(socketConnection);
      
      socketConnection.on('connect', () => {
        console.log('Соединение с сервером установлено');
        setIsLoading(false);
        setIsAuthenticated(true); // Для демонстрации считаем, что соединение = авторизация
      });
      
      socketConnection.on('connect_error', (err) => {
        console.error('Ошибка соединения:', err);
        // При ошибке соединения не блокируем интерфейс
        setIsLoading(false);
      });
      
      return () => {
        socketConnection.disconnect();
      };
    } catch (err) {
      console.error('Ошибка инициализации:', err);
      setError('Произошла ошибка при инициализации приложения.');
      setIsLoading(false);
    }
  }, []);

  // Функция для выхода из приложения
  const handleLogout = (e) => {
    e.preventDefault(); // Предотвращаем действие по умолчанию
    console.log('Выполняется выход из приложения...', e);
    console.log('isAuthenticated до выхода:', isAuthenticated);
    
    // Очищаем локальное состояние
    if (socket) {
      socket.disconnect();
      console.log('Сокет отключен');
    } else {
      console.log('Сокет не был инициализирован');
    }
    
    // Очищаем токен из localStorage
    localStorage.removeItem('token');
    console.log('Токен удален из localStorage');
    
    // Обновляем состояние авторизации
    setIsAuthenticated(false);
    console.log('isAuthenticated после выхода:', false);
    
    // Перезагружаем страницу для сброса состояния приложения
    console.log('Перезагрузка страницы...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Функция для авторизации (заглушка)
  const handleLogin = (e) => {
    e.preventDefault(); // Предотвращаем действие по умолчанию
    console.log('Выполняется вход в приложение...');
    
    // Сохраняем демо-токен в localStorage
    localStorage.setItem('token', 'demo-token-123');
    
    // Обновляем состояние авторизации
    setIsAuthenticated(true);
    
    // Перезагружаем страницу для применения авторизации
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="app loading">
        <h1>SecureGrid</h1>
        <p>Загрузка приложения...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app error">
        <h1>SecureGrid</h1>
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()}>Попробовать снова</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>SecureGrid</h1>
        <div className="header-actions">
          {isAuthenticated ? (
            <button 
              onClick={handleLogout}
              id="logoutButton"
            >
              Выйти
            </button>
          ) : (
            <button onClick={handleLogin}>Войти</button>
          )}
        </div>
      </header>
      
      <main className="app-content">
        <TableEditor 
          socket={socket} 
          documentId="test-document-id" 
          isReadOnly={false} 
        />
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2025 SecureGrid. Все права защищены.</p>
      </footer>
    </div>
  );
}

export default App;