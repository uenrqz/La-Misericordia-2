const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const ordenesMedicasController = require('../controllers/ordenes-medicas.controller');

// Aquí se importará el controlador cuando se implemente
// const historialMedicoController = require('../controllers/historial-medico.controller');

/**
 * @route   GET /api/historial-medico/residente/:residenteId
 * @desc    Obtener historial médico de un residente
 * @access  Private (personal médico y administrativo)
 */
router.get('/residente/:residenteId', authenticate(['admin', 'medico', 'cuidador']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para obtener historial médico del residente ID ${req.params.residenteId} - Por implementar` 
  });
});

/**
 * @route   GET /api/historial-medico/:id
 * @desc    Obtener un registro específico del historial
 * @access  Private (personal médico y administrativo)
 */
router.get('/:id', authenticate(['admin', 'medico']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para obtener registro médico ID ${req.params.id} - Por implementar` 
  });
});

/**
 * @route   POST /api/historial-medico
 * @desc    Crear un nuevo registro médico
 * @access  Private (solo médicos)
 */
router.post('/', authenticate(['admin', 'medico']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: 'Endpoint para crear registro médico - Por implementar' 
  });
});

/**
 * @route   PUT /api/historial-medico/:id
 * @desc    Actualizar un registro médico
 * @access  Private (solo médicos)
 */
router.put('/:id', authenticate(['admin', 'medico']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para actualizar registro médico ID ${req.params.id} - Por implementar` 
  });
});

/**
 * @route   DELETE /api/historial-medico/:id
 * @desc    Eliminar un registro médico
 * @access  Private (solo admin)
 */
router.delete('/:id', authenticate(['admin']), (req, res) => {
  // Implementación temporal
  res.json({ 
    message: `Endpoint para eliminar registro médico ID ${req.params.id} - Por implementar` 
  });
});

/**
 * @route   GET /api/residentes/:id/ordenes
 * @desc    Obtener todas las órdenes médicas de un residente
 * @access  Private (admin, médico, enfermera)
 */
router.get('/:id/ordenes', 
  authenticate(['admin', 'medico', 'enfermera']), 
  ordenesMedicasController.getOrdenesMedicasByResidente
);

/**
 * @route   GET /api/residentes/:id/ordenes/:ordenId
 * @desc    Obtener una orden médica específica
 * @access  Private (admin, médico, enfermera)
 */
router.get('/:id/ordenes/:ordenId', 
  authenticate(['admin', 'medico', 'enfermera']), 
  ordenesMedicasController.getOrdenMedicaById
);

/**
 * @route   POST /api/residentes/:id/ordenes
 * @desc    Crear una nueva orden médica
 * @access  Private (solo médico y admin)
 */
router.post('/:id/ordenes', 
  authenticate(['admin', 'medico']), 
  ordenesMedicasController.createOrdenMedica
);

/**
 * @route   PUT /api/residentes/:id/ordenes/:ordenId
 * @desc    Actualizar una orden médica
 * @access  Private (médico que la creó o admin)
 */
router.put('/:id/ordenes/:ordenId', 
  authenticate(['admin', 'medico']), 
  ordenesMedicasController.updateOrdenMedica
);

/**
 * @route   DELETE /api/residentes/:id/ordenes/:ordenId
 * @desc    Eliminar una orden médica
 * @access  Private (solo admin)
 */
router.delete('/:id/ordenes/:ordenId', 
  authenticate(['admin']), 
  ordenesMedicasController.deleteOrdenMedica
);

module.exports = router;