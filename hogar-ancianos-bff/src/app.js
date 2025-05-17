const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Limitar tasa de solicitudes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 solicitudes por ventana
});

app.use(limiter);

// Rutas de estado/health
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'BFF - La Misericordia' });
});

// Cargar rutas específicas del BFF
app.use('/api/bff/auth', require('./routes/auth.routes'));
app.use('/api/bff/dashboard', require('./routes/dashboard.routes'));
app.use('/api/bff/residentes', require('./routes/residentes.routes'));

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

module.exports = app; // Para pruebas
