const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');

// Aquí se importará el controlador cuando se implemente
// const actividadesController = require('../controllers/actividades.controller');

/**
 * @route   GET /api/actividades/residente/:residenteId
 * @desc    Obtener actividades diarias de un residente
 * @access  Private
 */
router.get('/residente/:residenteId', authenticate(['admin', 'medico', 'cuidador']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para obtener actividades del residente ID ${req.params.residenteId} - Por implementar` 
  });
});

/**
 * @route   GET /api/actividades/fecha/:fecha
 * @desc    Obtener todas las actividades registradas en una fecha específica
 * @access  Private
 */
router.get('/fecha/:fecha', authenticate(['admin', 'cuidador']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para obtener actividades de la fecha ${req.params.fecha} - Por implementar` 
  });
});

/**
 * @route   POST /api/actividades
 * @desc    Registrar actividades diarias para un residente
 * @access  Private (solo cuidadores)
 */
router.post('/', authenticate(['admin', 'cuidador']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: 'Endpoint para registrar actividades diarias - Por implementar' 
  });
});

/**
 * @route   PUT /api/actividades/:id
 * @desc    Actualizar registro de actividades
 * @access  Private (solo cuidadores y admin)
 */
router.put('/:id', authenticate(['admin', 'cuidador']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para actualizar registro de actividades ID ${req.params.id} - Por implementar` 
  });
});

/**
 * @route   DELETE /api/actividades/:id
 * @desc    Eliminar registro de actividades
 * @access  Private (solo admin)
 */
router.delete('/:id', authenticate(['admin']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para eliminar registro de actividades ID ${req.params.id} - Por implementar` 
  });
});

module.exports = router;