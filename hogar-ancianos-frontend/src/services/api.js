import axios from 'axios';
import { getBffApiRootUrl } from './bff.config';
const api = axios.create({
  baseURL: getBffApiRootUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('🔧 API Client - URL configurada:', getBffApiRootUrl());

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar errores de autenticación (401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
