const express = require('express');
const router = express.Router();
const { authenticate, authorizeAccess } = require('../middlewares/auth.middleware');

const accesoEvoluciones = [
  authenticate(),
  authorizeAccess({
    roles: ['admin', 'medico', 'enfermera'],
    permisos: ['evoluciones']
  })
];
const evolucionesController = require('../controllers/evoluciones.controller');

/**
 * @route   GET /api/residentes/:id/evoluciones
 * @desc    Obtener todas las evoluciones de un residente
 * @access  Private (admin, médico, enfermera)
 */
router.get('/:id/evoluciones', accesoEvoluciones, evolucionesController.getEvolucionesByResidente);

/**
 * @route   POST /api/residentes/:id/evoluciones
 * @desc    Crear una nueva evolución para un residente
 * @access  Private (admin, médico, enfermera)
 */
router.post('/:id/evoluciones', accesoEvoluciones, evolucionesController.createEvolucion);

/**
 * @route   PUT /api/residentes/:id/evoluciones/:evolucionId
 * @desc    Actualizar una evolución (solo mismo día)
 * @access  Private (usuario que la creó o admin)
 */
router.put('/:id/evoluciones/:evolucionId', accesoEvoluciones, evolucionesController.updateEvolucion);

/**
 * @route   DELETE /api/residentes/:id/evoluciones/:evolucionId
 * @desc    Eliminar una evolución
 * @access  Private (solo admin)
 */
router.delete('/:id/evoluciones/:evolucionId',
  authenticate(),
  authorizeAccess({ roles: ['admin'], permisos: ['evoluciones'] }),
  evolucionesController.deleteEvolucion
);

module.exports = router;