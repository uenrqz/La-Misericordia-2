const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const ordenesMedicasController = require('../controllers/ordenes-medicas.controller');

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