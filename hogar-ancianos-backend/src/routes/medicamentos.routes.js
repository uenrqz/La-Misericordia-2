const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');

// Aquí se importará el controlador cuando se implemente
// const medicamentosController = require('../controllers/medicamentos.controller');

/**
 * @route   GET /api/medicamentos/residente/:residenteId
 * @desc    Obtener todos los medicamentos asignados a un residente
 * @access  Private
 */
router.get('/residente/:residenteId', authenticate(['admin', 'medico', 'cuidador']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para obtener medicamentos del residente ID ${req.params.residenteId} - Por implementar` 
  });
});

/**
 * @route   GET /api/medicamentos/:id
 * @desc    Obtener detalles de un medicamento asignado
 * @access  Private
 */
router.get('/:id', authenticate(['admin', 'medico', 'cuidador']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para obtener detalle del medicamento ID ${req.params.id} - Por implementar` 
  });
});

/**
 * @route   POST /api/medicamentos
 * @desc    Asignar un nuevo medicamento a un residente
 * @access  Private (solo médicos)
 */
router.post('/', authenticate(['admin', 'medico']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: 'Endpoint para asignar nuevo medicamento - Por implementar' 
  });
});

/**
 * @route   PUT /api/medicamentos/:id
 * @desc    Actualizar información de un medicamento asignado
 * @access  Private (solo médicos)
 */
router.put('/:id', authenticate(['admin', 'medico']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para actualizar medicamento ID ${req.params.id} - Por implementar` 
  });
});

/**
 * @route   DELETE /api/medicamentos/:id
 * @desc    Eliminar un medicamento asignado
 * @access  Private (solo médicos)
 */
router.delete('/:id', authenticate(['admin', 'medico']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para eliminar medicamento ID ${req.params.id} - Por implementar` 
  });
});

module.exports = router;