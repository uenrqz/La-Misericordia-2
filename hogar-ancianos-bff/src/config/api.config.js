const axios = require('axios');
const http = require('http');
const https = require('https');
require('dotenv').config();

// Configurar agentes HTTP/HTTPS con keep-alive para conexiones persistentes
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000, // 30 segundos
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000
});

// Configuración de Axios para el backend
const apiClient = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  timeout: parseInt(process.env.API_TIMEOUT) || 10000, // 10 segundos por defecto
  headers: {
    'Content-Type': 'application/json',
  },
  maxContentLength: 10 * 1024 * 1024, // 10MB
  maxRedirects: 5,
  httpAgent: httpAgent,
  httpsAgent: httpsAgent
});

// Interceptor para agregar el token recibido en la petición original (si existe)
apiClient.interceptors.request.use(
  config => {
    // Si la petición original tiene un token (por ejemplo, desde req.headers.authorization), reenviarlo
    if (config.headers && config.headers._originalAuthorization) {
      config.headers.Authorization = config.headers._originalAuthorization;
      // Eliminar el encabezado temporal para evitar confusiones
      delete config.headers._originalAuthorization;
    }
    
    console.log(`[BFF API] Enviando petición ${config.method.toUpperCase()} a ${config.baseURL}${config.url}`, {
      params: config.params,
      // No logear contraseñas
      data: config.data ? (
        typeof config.data === 'object' && config.data.password ? 
          {...config.data, password: '********'} : 
          config.data
      ) : undefined
    });
    
    return config;
  },
  error => {
    console.error('[BFF API] Error en la configuración de la petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  response => {
    console.log(`[BFF API] Respuesta exitosa de ${response.config.method.toUpperCase()} ${response.config.url}: ${response.status}`);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`[BFF API] Error ${error.response.status} en petición a ${error.config?.url}:`, {
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error('[BFF API] No se recibió respuesta del backend:', {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      });
    } else {
      console.error('[BFF API] Error al configurar la petición:', error.message);
    }
    return Promise.reject(error);
  }
);

module.exports = apiClient;
