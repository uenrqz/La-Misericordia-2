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
  response => {
    // Devolver solo los datos de la respuesta para simplificar el manejo
    return response.data;
  },
  async error => {
    if (error.response?.status === 401) {
      // Intentar refresh automático antes de redirigir al login
      const token = localStorage.getItem('token');
      if (token && !error.config._retry) {
        try {
          error.config._retry = true;
          // Llamar al endpoint de refresh del BFF
          const refreshResponse = await apiClient.post('/auth/refresh');
          if (refreshResponse && refreshResponse.token) {
            localStorage.setItem('token', refreshResponse.token);
            // Reintentar la petición original con el nuevo token
            error.config.headers['Authorization'] = `Bearer ${refreshResponse.token}`;
            return apiClient.request(error.config);
          }
        } catch (refreshError) {
          // Si falla el refresh, limpiar y redirigir
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;