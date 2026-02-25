const express = require('express');
const router = express.Router();
const apiClient = require('../config/api.config');
const { authenticate } = require('../middleware/auth.middleware');
const multer = require('multer');
const FormData = require('form-data');

// Configuración de multer para memoria (no guarda en disco)
const memoryStorage = multer.memoryStorage();
const upload = multer({ 
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

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

    // Extraer resultados de las promesas
    const [residenteResult, signosVitalesResult, evolucionesResult, ordenesMedicasResult] = results;
    
    // Verificar si obtuvimos la información básica del residente
    if (residenteResult.status !== 'fulfilled') {
      throw {
        status: 404,
        message: `No se encontró el residente con ID ${req.params.id}`
      };
    }
    
    // Obtener datos de cada resultado
    const residente = residenteResult.value.data;
    const signosVitales = signosVitalesResult.status === 'fulfilled' ? signosVitalesResult.value.data : [];
    const evoluciones = evolucionesResult.status === 'fulfilled' ? evolucionesResult.value.data : [];
    const ordenesMedicas = ordenesMedicasResult.status === 'fulfilled' ? ordenesMedicasResult.value.data : [];
    
    // Combinar todos los datos en una respuesta
    res.json({
      ...residente,
      signosVitales,
      evoluciones,
      ordenesMedicas
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

/**
 * @route POST /api/bff/residentes/:id/foto
 * @desc Subir foto de un residente
 * @access Privado (Admin, Médico, Secretaria)
 */
router.post('/:id/foto', authenticate(['admin', 'medico', 'secretaria']), upload.single('foto'), async (req, res) => {
  try {
    // Verificar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
    }
    
    // Crear un FormData para enviar la imagen
    const form = new FormData();
    form.append('foto', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    const response = await apiClient.post(`/api/residentes/${req.params.id}/foto`, form, {
      headers: { 
        _originalAuthorization: `Bearer ${req.user.originalToken}`,
        ...form.getHeaders()
      }
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error al subir foto de residente:', error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al subir foto',
      data: error.response?.data
    });
  }
});

/**
 * @route DELETE /api/bff/residentes/:id/foto
 * @desc Eliminar foto de un residente
 * @access Privado (Admin, Médico, Secretaria)
 */
router.delete('/:id/foto', authenticate(['admin', 'medico', 'secretaria']), async (req, res) => {
  try {
    const response = await apiClient.delete(`/api/residentes/${req.params.id}/foto`, {
      headers: { _originalAuthorization: `Bearer ${req.user.originalToken}` }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error al eliminar foto de residente:', error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error al eliminar foto',
      data: error.response?.data
    });
  }
});

module.exports = router;
