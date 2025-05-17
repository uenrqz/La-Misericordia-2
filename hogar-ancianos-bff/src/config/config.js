require('dotenv').config();

module.exports = {
  // Configuración del servidor BFF
  port: process.env.PORT || 4000,
  
  // URL del backend
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  
  // Configuración de JWT
  jwtSecret: process.env.JWT_SECRET || 'bff_secret_key',
  
  // Timeouts
  proxyTimeout: parseInt(process.env.PROXY_TIMEOUT) || 30000,
  
  // Modo debug
  debug: process.env.DEBUG === 'true',
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  }
};