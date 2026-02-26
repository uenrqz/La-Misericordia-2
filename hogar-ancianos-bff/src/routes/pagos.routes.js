const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth.middleware');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/bff/pagos-programados
 * @desc Obtener todos los pagos programados
 * @access Admin
 */
router.get('/', async (req, res) => {
  try {
    console.log('[BFF Pagos] Obteniendo pagos programados');
    
    const response = await axios.get(`${BACKEND_URL}/api/pagos-programados`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Pagos] Error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al obtener pagos programados',
      error: error.message
    });
  }
});

/**
 * @route GET /api/bff/pagos-programados/instancias
 * @desc Obtener instancias de pagos (calendario)
 * @access Admin
 */
router.get('/instancias', async (req, res) => {
  try {
    console.log('[BFF Pagos] Obteniendo instancias de pagos:', req.query);
    
    const response = await axios.get(`${BACKEND_URL}/api/pagos-programados/instancias`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Pagos] Error al obtener instancias:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al obtener instancias de pagos',
      error: error.message
    });
  }
});

/**
 * @route GET /api/bff/pagos-programados/atencion
 * @desc Obtener pagos próximos y atrasados
 * @access Admin
 */
router.get('/atencion', async (req, res) => {
  try {
    console.log('[BFF Pagos] Obteniendo pagos de atención');
    
    const response = await axios.get(`${BACKEND_URL}/api/pagos-programados/atencion`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Pagos] Error al obtener pagos de atención:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al obtener pagos de atención',
      error: error.message
    });
  }
});

/**
 * @route POST /api/bff/pagos-programados/generar-instancias
 * @desc Generar instancias de pagos manualmente
 * @access Admin
 */
router.post('/generar-instancias', async (req, res) => {
  try {
    console.log('[BFF Pagos] Generando instancias de pagos');
    
    const response = await axios.post(
      `${BACKEND_URL}/api/pagos-programados/generar-instancias`,
      {},
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Pagos] Error al generar instancias:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al generar instancias',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/bff/pagos-programados/actualizar-estados
 * @desc Actualizar estados de pagos
 * @access Admin
 */
router.put('/actualizar-estados', async (req, res) => {
  try {
    console.log('[BFF Pagos] Actualizando estados de pagos');
    
    const response = await axios.put(
      `${BACKEND_URL}/api/pagos-programados/actualizar-estados`,
      {},
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Pagos] Error al actualizar estados:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al actualizar estados',
      error: error.message
    });
  }
});

/**
 * @route GET /api/bff/pagos-programados/:id
 * @desc Obtener un pago programado por ID
 * @access Admin
 */
router.get('/:id', async (req, res) => {
  try {
    console.log('[BFF Pagos] Obteniendo pago programado:', req.params.id);
    
    const response = await axios.get(`${BACKEND_URL}/api/pagos-programados/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Pagos] Error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al obtener pago programado',
      error: error.message
    });
  }
});

/**
 * @route POST /api/bff/pagos-programados
 * @desc Crear pago programado
 * @access Admin
 */
router.post('/', async (req, res) => {
  try {
    console.log('[BFF Pagos] Creando pago programado:', req.body.concepto);
    
    const response = await axios.post(`${BACKEND_URL}/api/pagos-programados`, req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    console.error('[BFF Pagos] Error al crear:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al crear pago programado',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/bff/pagos-programados/:id
 * @desc Actualizar pago programado
 * @access Admin
 */
router.put('/:id', async (req, res) => {
  try {
    console.log('[BFF Pagos] Actualizando pago programado:', req.params.id);
    
    const response = await axios.put(
      `${BACKEND_URL}/api/pagos-programados/${req.params.id}`,
      req.body,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Pagos] Error al actualizar:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al actualizar pago programado',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/bff/pagos-programados/:id
 * @desc Eliminar/Desactivar pago programado
 * @access Admin
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log('[BFF Pagos] Eliminando pago programado:', req.params.id);
    
    const response = await axios.delete(`${BACKEND_URL}/api/pagos-programados/${req.params.id}`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Pagos] Error al eliminar:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al eliminar pago programado',
      error: error.message
    });
  }
});

/**
 * @route POST /api/bff/pagos-programados/instancia/:id/pagar
 * @desc Marcar instancia como pagada
 * @access Admin
 */
router.post('/instancia/:id/pagar', async (req, res) => {
  try {
    console.log('[BFF Pagos] Marcando pago como pagado:', req.params.id);
    
    const response = await axios.post(
      `${BACKEND_URL}/api/pagos-programados/instancia/${req.params.id}/pagar`,
      req.body,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Pagos] Error al marcar como pagado:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al marcar pago como pagado',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/bff/pagos-programados/instancia/:id/cancelar
 * @desc Cancelar instancia de pago
 * @access Admin
 */
router.put('/instancia/:id/cancelar', async (req, res) => {
  try {
    console.log('[BFF Pagos] Cancelando instancia de pago:', req.params.id);
    
    const response = await axios.put(
      `${BACKEND_URL}/api/pagos-programados/instancia/${req.params.id}/cancelar`,
      req.body,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[BFF Pagos] Error al cancelar:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al cancelar instancia',
      error: error.message
    });
  }
});

module.exports = router;
