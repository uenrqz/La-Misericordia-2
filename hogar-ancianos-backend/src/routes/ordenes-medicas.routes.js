const express = require('express');
const router = express.Router();
const { authenticate, authorizeAccess } = require('../middlewares/auth.middleware');

const accesoOrdenesMedicas = [
  authenticate(),
  authorizeAccess({
    roles: ['admin', 'medico', 'enfermera'],
    permisos: ['ordenes_medicas']
  })
];

const accesoOrdenesMedicasEdicion = [
  authenticate(),
  authorizeAccess({
    roles: ['admin', 'medico'],
    permisos: ['ordenes_medicas']
  })
];
const ordenesMedicasController = require('../controllers/ordenes-medicas.controller');

/**
 * @route   GET /api/residentes/:id/ordenes
 * @desc    Obtener todas las órdenes médicas de un residente
 * @access  Private (admin, médico, enfermera)
 */
router.get('/:id/ordenes', accesoOrdenesMedicas, ordenesMedicasController.getOrdenesMedicasByResidente);

/**
 * @route   GET /api/residentes/:id/ordenes/:ordenId
 * @desc    Obtener una orden médica específica
 * @access  Private (admin, médico, enfermera)
 */
router.get('/:id/ordenes/:ordenId', accesoOrdenesMedicas, ordenesMedicasController.getOrdenMedicaById);

/**
 * @route   POST /api/residentes/:id/ordenes
 * @desc    Crear una nueva orden médica
 * @access  Private (solo médico y admin)
 */
router.post('/:id/ordenes', accesoOrdenesMedicasEdicion, ordenesMedicasController.createOrdenMedica);

/**
 * @route   PUT /api/residentes/:id/ordenes/:ordenId
 * @desc    Actualizar una orden médica
 * @access  Private (médico que la creó o admin)
 */
router.put('/:id/ordenes/:ordenId', accesoOrdenesMedicasEdicion, ordenesMedicasController.updateOrdenMedica);

/**
 * @route   DELETE /api/residentes/:id/ordenes/:ordenId
 * @desc    Eliminar una orden médica
 * @access  Private (solo admin)
 */
router.delete('/:id/ordenes/:ordenId',
  authenticate(),
  authorizeAccess({ roles: ['admin'], permisos: ['ordenes_medicas'] }),
  ordenesMedicasController.deleteOrdenMedica
);

module.exports = router;