const express = require('express');
const router = express.Router();
const apiClient = require('../config/api.config');

/**
 * @route GET /api/bff/status
 * @desc Verificar el estado del BFF
 * @access Público
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'BFF running',
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || '1.0.0'
  });
});

/**
 * @route GET /api/bff/diagnostic/backend-status
 * @desc Verificar el estado de la conexión con el backend
 * @access Público
 */
router.get('/diagnostic/backend-status', async (req, res) => {
  try {
    // Crear una promesa que se resuelva o rechace según un timeout
    const backendCheck = Promise.race([
      apiClient.get('/api/status', { timeout: 3000 }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al conectar con backend')), 3000)
      )
    ]);
    
    // Intentar hacer una petición simple al backend con timeout propio
    const response = await backendCheck;
    
    res.json({
      status: 'online',
      message: 'Backend connection OK',
      details: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al verificar conexión con backend:', error);
    
    // Asegurar que siempre devolvemos una respuesta estructurada
    // incluso si hay errores inesperados
    let errorDetails = {
      message: error.message || 'Error desconocido',
      code: error.code || 'UNKNOWN_ERROR',
    };
    
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.data = error.response.data;
    }
    
    // Siempre devolver código 200 con estado "offline" para evitar errores 500
    res.status(200).json({
      status: 'offline',
      message: 'No se puede conectar con el backend',
      error: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/bff/diagnostic/full
 * @desc Realizar un diagnóstico completo del sistema
 * @access Público
 */
router.get('/diagnostic/full', async (req, res) => {
  try {
    // Verificar la conexión con el backend
    let backendStatus;
    try {
      const backendResponse = await apiClient.get('/api/status', { timeout: 2000 });
      backendStatus = {
        status: 'online',
        message: 'Backend connection OK',
        details: backendResponse.data
      };
    } catch (error) {
      backendStatus = {
        status: 'offline',
        message: 'No se puede conectar con el backend',
        error: {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data
        }
      };
    }
    
    // Verificar la base de datos (a través del backend)
    let databaseStatus;
    if (backendStatus.status === 'online') {
      try {
        const dbResponse = await apiClient.get('/api/status/database', { timeout: 2000 });
        databaseStatus = {
          status: dbResponse.data.status || 'unknown',
          message: dbResponse.data.message || 'Estado de la base de datos desconocido',
          details: dbResponse.data
        };
      } catch (error) {
        databaseStatus = {
          status: 'unknown',
          message: 'No se pudo determinar el estado de la base de datos',
          error: {
            message: error.message,
            code: error.code
          }
        };
      }
    } else {
      databaseStatus = {
        status: 'unknown',
        message: 'No se puede verificar la base de datos porque el backend está offline'
      };
    }
    
    // Devolver diagnóstico completo
    res.json({
      timestamp: new Date().toISOString(),
      bff: {
        status: 'online',
        message: 'BFF running',
        version: process.env.VERSION || '1.0.0',
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime())
      },
      backend: backendStatus,
      database: databaseStatus
    });
  } catch (error) {
    console.error('Error al realizar diagnóstico completo:', error);
    res.status(500).json({
      error: 'Error interno al realizar diagnóstico',
      message: error.message
    });
  }
});

module.exports = router;
