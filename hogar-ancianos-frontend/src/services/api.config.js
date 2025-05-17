import axios from 'axios';

// Configuración base para las peticiones HTTP
const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api/bff',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 segundos
});

// Interceptor para manejar tokens de autenticación
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;