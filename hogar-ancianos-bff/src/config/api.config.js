const axios = require('axios');
require('dotenv').config();

// Configuración de Axios para el backend
const apiClient = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  timeout: parseInt(process.env.API_TIMEOUT) || 15000, // Aumentado a 15 segundos por defecto
  headers: {
    'Content-Type': 'application/json',
  },
  maxContentLength: 10 * 1024 * 1024, // 10MB
  maxRedirects: 5
});

// Interceptor para agregar el token recibido en la petición original (si existe)
apiClient.interceptors.request.use(
  config => {
    // Si la petición original tiene un token (por ejemplo, desde req.headers.authorization), reenviarlo
    if (config.headers && config.headers._originalAuthorization) {
      config.headers.Authorization = config.headers._originalAuthorization;
      delete config.headers._originalAuthorization; // Limpiar para evitar problemas
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('Error en comunicación con API:', error.message);
    
    // Error personalizado con formato estandarizado
    const customError = {
      status: error.response ? error.response.status : error.code === 'ECONNABORTED' ? 408 : 500,
      message: error.response ? error.response.data?.message : 
               error.code === 'ECONNABORTED' ? 'Tiempo de espera agotado al comunicarse con el servidor' :
               error.code === 'ECONNREFUSED' ? 'No se pudo conectar al servidor' :
               'Error en la comunicación con el servidor',
      data: error.response ? error.response.data : null,
      originalError: error
    };
    
    console.error('Error en solicitud API:', customError);
    return Promise.reject(customError);
  }
);

module.exports = apiClient;
