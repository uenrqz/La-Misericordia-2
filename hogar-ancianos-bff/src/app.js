const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();

// Configuración CORS para entorno de producción
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL || 'https://lamisericordia2.com',
      process.env.FRONTEND_DOMAIN || 'https://app.lamisericordia2.com',
      'http://localhost:5174', // Añadido para pruebas locales en producción
      'http://127.0.0.1:5174'
    ]
  : ['http://localhost:5174', 'http://127.0.0.1:5174'];

console.log(`[BFF] Iniciando en modo ${process.env.NODE_ENV || 'development'}`);
console.log(`[BFF] Orígenes CORS permitidos: ${allowedOrigins.join(', ')}`);

// Middlewares básicos - Configuración CORS más permisiva para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  // En modo desarrollo, permitir cualquier origen
  console.log('[BFF] Usando configuración CORS permisiva para desarrollo');
  app.use(cors({ 
    origin: true,
    credentials: true 
  }));
} else {
  // En producción, usar configuración estricta pero con localhost incluido para pruebas
  app.use(cors({
    origin: function(origin, callback) {
      // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
      if (!origin) return callback(null, true);
      
      // Permitir orígenes específicos
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Registrar origen bloqueado para diagnóstico
      console.warn(`[BFF] Origen bloqueado por CORS: ${origin}`);
      callback(new Error('Origen no permitido por política CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));
}

// Middleware para manejar solicitudes OPTIONS que son parte del flujo CORS preflight
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar Helmet para permitir comunicación entre el frontend y el BFF
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rutas de estado/health
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'BFF - La Misericordia' });
});

// Ruta de prueba accesible a todos sin autenticación
// Eliminada ruta pública de prueba para entorno de producción

// Ruta de estado simple para verificación de cliente (pública, sin autenticación)
// Esta ruta responde a cualquier origen para evitar problemas de CORS durante el diagnóstico
app.get('/api/bff/status', (req, res) => {
  // Log para debug
  console.log('Solicitud recibida en /api/bff/status desde', req.get('origin') || 'origen desconocido');
  
  // Permitir cualquier origen para esta ruta específica
  res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(200).json({ 
    status: 'online', 
    message: 'BFF - La Misericordia en funcionamiento',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    origin: req.get('origin') || 'unknown'
  });
});

// Cargar rutas específicas del BFF
app.use('/api/bff/auth', require('./routes/auth.routes'));
app.use('/api/bff/dashboard', require('./routes/dashboard.routes'));
app.use('/api/bff/residentes', require('./routes/residentes.routes'));
app.use('/api/bff/usuarios', require('./routes/usuarios.routes'));
// Rutas de diagnóstico eliminadas para entorno de producción

// Middleware para capturar errores en las promesas no manejadas
app.use((req, res, next) => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa no manejada:', promise, 'razón:', reason);
    // No dejar caer el servidor, simplemente registrar
  });
  next();
});

// Proxy para APIs del backend no cubiertas por el BFF
const apiProxy = createProxyMiddleware({
  target: process.env.API_URL || 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // no cambiar la ruta
  },
  timeout: parseInt(process.env.PROXY_TIMEOUT) || 30000,
  proxyTimeout: parseInt(process.env.PROXY_TIMEOUT) || 30000,
  onProxyReq: (proxyReq, req, res) => {
    // Si hay un token en la solicitud, pasarlo al backend
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    
    // Log de solicitudes proxeadas
    if (process.env.DEBUG === 'true') {
      console.log(`[BFF Proxy] ${req.method} ${req.path} -> ${process.env.API_URL || 'http://localhost:3000'}`);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log de respuestas
    if (process.env.DEBUG === 'true') {
      console.log(`[BFF Proxy] Response: ${proxyRes.statusCode} - ${req.method} ${req.path}`);
    }
  },
  onError: (err, req, res) => {
    console.error('[BFF Proxy] Error:', err.message);
    
    // Determinar el tipo de error para enviar un mensaje apropiado
    let statusCode = 502; // Bad Gateway por defecto
    let message = 'Error al comunicarse con el backend';
    
    if (err.code === 'ECONNREFUSED') {
      message = 'No se pudo conectar al servidor backend. Por favor, verifique que esté en ejecución.';
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
      statusCode = 504; // Gateway Timeout
      message = 'Tiempo de espera agotado al comunicarse con el backend';
    }
    
    res.status(statusCode).json({ 
      message, 
      code: err.code, 
      path: req.path 
    });
  }
});

// Rutas no específicas se envían al backend
app.use('/api', apiProxy);

// Gestión global de errores
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';
  
  console.error(`[BFF Error] ${statusCode} - ${message}`, {
    path: req.path,
    method: req.method,
    body: req.body,
    error: err
  });
  
  res.status(statusCode).json({
    message,
    path: req.path,
    timestamp: new Date().toISOString(),
    type: err.type || 'server_error'
  });
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    message: 'La ruta solicitada no existe en el BFF',
    path: req.originalUrl,
    type: 'not_found'
  });
});

// Puerto
const PORT = process.env.PORT || 4000;

// Iniciar el servidor con manejo de errores
const server = app.listen(PORT, () => {
  console.log(`BFF ejecutándose en el puerto ${PORT}`);
  console.log(`Conectado al backend en: ${process.env.API_URL || 'http://localhost:3000'}`);
}).on('error', (err) => {
  console.error('Error al iniciar el servidor BFF:', err);
  process.exit(1);
});

// Middleware global para manejar errores 500
app.use((err, req, res, next) => {
  console.error('Error interno del servidor:', err);
  
  // Asegurar que no se envíe un error 500 al cliente
  res.status(200).json({
    success: false,
    error: {
      message: 'Se produjo un error en el servidor',
      code: 'SERVER_ERROR',
      timestamp: new Date().toISOString()
    },
    // En desarrollo podemos enviar más detalles
    ...(process.env.NODE_ENV === 'development' ? {
      errorDetails: {
        message: err.message,
        stack: err.stack,
        path: req.path
      }
    } : {})
  });
});

// Middleware para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Ruta no encontrada: ${req.originalUrl}`,
      code: 'NOT_FOUND',
      statusCode: 404
    }
  });
});

// Manejar señales de terminación para un cierre limpio
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('Cerrando el servidor BFF...');
  server.close(() => {
    console.log('Servidor BFF cerrado.');
    process.exit(0);
  });
  
  // Forzar el cierre si no se completa en 10 segundos
  setTimeout(() => {
    console.error('No se pudo cerrar el servidor correctamente, forzando cierre.');
    process.exit(1);
  }, 10000);
}

// Manejar excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  // Registrar el error pero no dejar caer el servidor en producción
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

module.exports = app; // Para pruebas
