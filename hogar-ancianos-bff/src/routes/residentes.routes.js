const express = require('express');
const router = express.Router();
const apiClient = require('../config/api.config');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * Función para realizar solicitudes HTTP con reintentos
 * @param {Function} requestFn - Función que realiza la solicitud
 * @param {number} maxRetries - Número máximo de reintentos
 * @param {number} retryDelay - Retraso entre reintentos en ms
 * @returns {Promise<any>} - Resultado de la solicitud
 */
async function withRetry(requestFn, maxRetries = 2, retryDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`Reintentando solicitud (${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw lastError;
}

/**
 * @route GET /api/bff/residentes
 * @desc Obtener todos los residentes con paginación
 * @access Privado
 */
router.get('/', authenticate(['admin', 'medico', 'enfermera', 'cuidador', 'secretaria']), async (req, res) => {
  try {
    const response = await withRetry(() => apiClient.get('/api/residentes', {
      params: req.query,
      headers: { _originalAuthorization: `Bearer ${req.user.originalToken}` }
    }));
    
    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener residentes:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Error al obtener residentes',
      data: error.data,
      path: '/api/residentes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/bff/residentes/:id
 * @desc Obtener detalles de un residente con toda su información
 * @access Privado
 */
router.get('/:id', authenticate(['admin', 'medico', 'enfermera', 'cuidador', 'secretaria']), async (req, res) => {
  try {
    // Usando Promise.allSettled para manejar errores individuales
    const results = await Promise.allSettled([
      withRetry(() => apiClient.get(`/api/residentes/${req.params.id}`, {
        headers: { _originalAuthorization: `Bearer ${req.user.originalToken}` }
      })),
      
      withRetry(() => apiClient.get(`/api/residentes/${req.params.id}/signos-vitales`, {
        headers: { _originalAuthorization: `Bearer ${req.user.originalToken}` }
      })),
      apiClient.get(`/api/residentes/${req.params.id}/evoluciones`, {
        headers: { _originalAuthorization: `Bearer ${req.user.originalToken}` }
      }).catch(() => ({ data: [] })),
      apiClient.get(`/api/residentes/${req.params.id}/ordenes-medicas`, {
        headers: { _originalAuthorization: `Bearer ${req.user.originalToken}` }
      }).catch(() => ({ data: [] }))
    ]);

    // Combinar todos los datos en una respuesta
    res.json({
      ...residente.data,
      signosVitales: signosVitales.data,
      evoluciones: evoluciones.data,
      ordenesMedicas: ordenesMedicas.data
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || `Error al obtener residente con ID ${req.params.id}`,
      data: error.data
    });
  }
});

/**
 * @route POST /api/bff/residentes
 * @desc Crear un nuevo residente
 * @access Privado (Admin, Médico, Secretaria)
 */
router.post('/', authenticate(['admin', 'medico', 'secretaria']), async (req, res) => {
  try {
    const response = await apiClient.post('/api/residentes', req.body, {
      headers: { _originalAuthorization: `Bearer ${req.user.originalToken}` }
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Error al crear residente',
      data: error.data
    });
  }
});

/**
 * @route PUT /api/bff/residentes/:id
 * @desc Actualizar un residente
 * @access Privado (Admin, Médico, Secretaria)
 */
router.put('/:id', authenticate(['admin', 'medico', 'secretaria']), async (req, res) => {
  try {
    const response = await apiClient.put(`/api/residentes/${req.params.id}`, req.body, {
      headers: { _originalAuthorization: `Bearer ${req.user.originalToken}` }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || `Error al actualizar residente con ID ${req.params.id}`,
      data: error.data
    });
  }
});

/**
 * @route DELETE /api/bff/residentes/:id
 * @desc Eliminar un residente
 * @access Privado (Solo Admin)
 */
router.delete('/:id', authenticate(['admin']), async (req, res) => {
  try {
    await apiClient.delete(`/api/residentes/${req.params.id}`, {
      headers: { _originalAuthorization: `Bearer ${req.user.originalToken}` }
    });
    
    res.status(204).end();
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || `Error al eliminar residente con ID ${req.params.id}`,
      data: error.data
    });
  }
});

module.exports = router;
