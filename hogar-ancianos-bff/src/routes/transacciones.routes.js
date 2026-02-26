const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth.middleware');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Middleware de autenticación para todas las rutas
router.use(authenticate());

/**
 * @route GET /api/bff/transacciones
 * @desc Obtener todas las transacciones con filtros
 * @access Admin
 */
router.get('/', async (req, res) => {
  try {
    console.log('[BFF Transacciones] Obteniendo transacciones con filtros:', req.query);
    
    const response = await axios.get(`${BACKEND_URL}/api/transacciones`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Transacciones] Error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al obtener transacciones',
      error: error.message
    });
  }
});

/**
 * @route GET /api/bff/transacciones/resumen
 * @desc Obtener resumen financiero
 * @access Admin
 */
router.get('/resumen', async (req, res) => {
  try {
    console.log('[BFF Transacciones] Obteniendo resumen financiero:', req.query);
    
    const response = await axios.get(`${BACKEND_URL}/api/transacciones/resumen`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Transacciones] Error al obtener resumen:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al obtener resumen financiero',
      error: error.message
    });
  }
});

/**
 * @route GET /api/bff/transacciones/predicciones
 * @desc Obtener predicciones y sugerencias inteligentes
 * @access Admin
 */
router.get('/predicciones', async (req, res) => {
  try {
    console.log('[BFF Transacciones] Obteniendo predicciones');
    
    const response = await axios.get(`${BACKEND_URL}/api/transacciones/predicciones`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Transacciones] Error al obtener predicciones:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al obtener predicciones',
      error: error.message
    });
  }
});

/**
 * @route GET /api/bff/transacciones/estadisticas-hoy
 * @desc Obtener estadísticas del día actual
 * @access Admin
 */
router.get('/estadisticas-hoy', async (req, res) => {
  try {
    console.log('[BFF Transacciones] Obteniendo estadísticas del día');
    
    const response = await axios.get(`${BACKEND_URL}/api/transacciones/estadisticas-hoy`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Transacciones] Error al obtener estadísticas:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

/**
 * @route GET /api/bff/transacciones/categorias
 * @desc Obtener categorías de transacciones
 * @access Admin
 */
router.get('/categorias', async (req, res) => {
  try {
    console.log('[BFF Transacciones] Obteniendo categorías');
    
    const response = await axios.get(`${BACKEND_URL}/api/transacciones/categorias`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Transacciones] Error al obtener categorías:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al obtener categorías',
      error: error.message
    });
  }
});

/**
 * @route GET /api/bff/transacciones/exportar
 * @desc Exportar transacciones
 * @access Admin
 */
router.get('/exportar', async (req, res) => {
  try {
    console.log('[BFF Transacciones] Exportando transacciones:', req.query);
    
    const response = await axios.get(`${BACKEND_URL}/api/transacciones/exportar`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Transacciones] Error al exportar:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al exportar transacciones',
      error: error.message
    });
  }
});

/**
 * @route GET /api/bff/transacciones/:id
 * @desc Obtener una transacción por ID
 * @access Admin
 */
router.get('/:id', async (req, res) => {
  try {
    console.log('[BFF Transacciones] Obteniendo transacción:', req.params.id);
    
    const response = await axios.get(`${BACKEND_URL}/api/transacciones/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Transacciones] Error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al obtener transacción',
      error: error.message
    });
  }
});

/**
 * @route POST /api/bff/transacciones
 * @desc Crear nueva transacción
 * @access Admin
 */
router.post('/', async (req, res) => {
  try {
    console.log('[BFF Transacciones] Creando transacción:', req.body.concepto);
    
    const response = await axios.post(`${BACKEND_URL}/api/transacciones`, req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    console.error('[BFF Transacciones] Error al crear:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al crear transacción',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/bff/transacciones/:id
 * @desc Actualizar transacción
 * @access Admin
 */
router.put('/:id', async (req, res) => {
  try {
    console.log('[BFF Transacciones] Actualizando transacción:', req.params.id);
    
    const response = await axios.put(
      `${BACKEND_URL}/api/transacciones/${req.params.id}`,
      req.body,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Transacciones] Error al actualizar:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al actualizar transacción',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/bff/transacciones/:id
 * @desc Eliminar transacción
 * @access Admin
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log('[BFF Transacciones] Eliminando transacción:', req.params.id);
    
    const response = await axios.delete(`${BACKEND_URL}/api/transacciones/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Transacciones] Error al eliminar:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al eliminar transacción',
      error: error.message
    });
  }
});

module.exports = router;
