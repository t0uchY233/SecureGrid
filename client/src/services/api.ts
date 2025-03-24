import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Настройка базового URL для API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// Создание экземпляра axios с базовым URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Создание WebSocket соединения
export const createSocketConnection = (): Socket => {
  const token = localStorage.getItem('token');
  const socket = io(SOCKET_URL, {
    auth: {
      token,
    },
  });
  return socket;
};

// Аутентификация
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', response.data.data.token);
  return response.data.data.user;
};

export const register = async (name: string, email: string, password: string) => {
  const response = await api.post('/auth/register', { name, email, password });
  localStorage.setItem('token', response.data.data.token);
  return response.data.data.user;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  } catch (error) {
    return null;
  }
};

// Работа с таблицами
export const getSpreadsheets = async (page = 1, limit = 10) => {
  const response = await api.get(`/spreadsheets?page=${page}&limit=${limit}`);
  return response.data.data;
};

export const getSpreadsheet = async (id: string) => {
  const response = await api.get(`/spreadsheets/${id}`);
  return response.data.data.spreadsheet;
};

export const createSpreadsheet = async (title: string, rows = 20, columns = 10) => {
  const response = await api.post('/spreadsheets', { title, rows, columns });
  return response.data.data.spreadsheet;
};

export const updateCell = async (spreadsheetId: string, cellId: string, value: string) => {
  const response = await api.put(`/spreadsheets/${spreadsheetId}/cells/${cellId}`, { value });
  return response.data.data.cell;
};

// Совместная работа
export const getSpreadsheetPermissions = async (id: string) => {
  const response = await api.get(`/spreadsheets/${id}/permissions`);
  return response.data.data.permissions;
};

export const shareSpreadsheet = async (id: string, email: string, role: string) => {
  const response = await api.post(`/spreadsheets/${id}/share`, { email, role });
  return response.data.data;
};

export default api;