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
  baseURL: process.env.API_URL || process.env.BACKEND_URL || 'https://hogar-ancianos-backend.onrender.com',
  timeout: parseInt(process.env.API_TIMEOUT) || 30000, // 30 segundos (Render puede tardar 30s en despertar)
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

// Función auxiliar: esperar N milisegundos
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Interceptor para manejar respuestas y errores con reintentos automáticos
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 4000; // 4 segundos entre reintentos (Render tarda ~20-30s en despertar)
const RETRY_STATUS_CODES = [502, 503, 504]; // Códigos que indican backend dormido/no disponible

apiClient.interceptors.response.use(
  response => {
    console.log(`[BFF API] Respuesta exitosa de ${response.config.method.toUpperCase()} ${response.config.url}: ${response.status}`);
    return response;
  },
  async error => {
    const config = error.config;

    // Inicializar contador de reintentos
    if (!config) {
      return Promise.reject(error);
    }
    config._retryCount = config._retryCount || 0;

    const status = error.response?.status;
    const isRetryable = RETRY_STATUS_CODES.includes(status) || 
                        error.code === 'ECONNABORTED' || 
                        error.code === 'ECONNRESET' ||
                        error.code === 'ETIMEDOUT';

    if (isRetryable && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      const delay = RETRY_DELAY_MS * config._retryCount; // Backoff: 4s, 8s, 12s
      console.warn(`[BFF API] Backend respondió ${status || error.code} en ${config.url}. Reintento ${config._retryCount}/${MAX_RETRIES} en ${delay/1000}s... (Backend posiblemente despertando en Render)`);
      await sleep(delay);
      return apiClient(config);
    }

    if (error.response) {
      console.error(`[BFF API] Error ${error.response.status} en petición a ${config?.url} (reintentos agotados o error no reintentable):`, {
        status: error.response.status,
        data: typeof error.response.data === 'string' ? error.response.data.substring(0, 200) : error.response.data,
      });
    } else if (error.request) {
      console.error('[BFF API] No se recibió respuesta del backend:', {
        url: config?.url,
        method: config?.method,
        timeout: config?.timeout,
        code: error.code
      });
    } else {
      console.error('[BFF API] Error al configurar la petición:', error.message);
    }
    return Promise.reject(error);
  }
);

module.exports = apiClient;
