const express = require('express');
const router = express.Router();
const residentesController = require('../controllers/residentes.controller');
const { authenticate, authorizeAccess } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const accesoResidentes = [
  authenticate(),
  authorizeAccess({
    roles: ['admin', 'medico', 'cuidador', 'secretaria'],
    permisos: ['residentes']
  })
];

const accesoSignosRecientes = [
  authenticate(),
  authorizeAccess({
    roles: ['admin', 'medico', 'enfermera'],
    permisos: ['signos_vitales']
  })
];

/**
 * @route   GET /api/residentes
 * @desc    Obtener todos los residentes con opciones de filtrado
 * @access  Private
 */
router.get('/', accesoResidentes, residentesController.getResidentes);

/**
 * @route   GET /api/residentes/stats
 * @desc    Obtener estadísticas de residentes
 * @access  Private
 */
router.get('/stats', accesoResidentes, residentesController.getStats);

/**
 * @route   GET /api/residentes/ocupacion
 * @desc    Obtener datos de ocupación
 * @access  Private
 */
router.get('/ocupacion', accesoResidentes, residentesController.getOcupacion);

/**
 * @route   GET /api/residentes/signos-vitales/recientes
 * @desc    Obtener signos vitales recientes
 * @access  Private
 */
router.get('/signos-vitales/recientes', accesoSignosRecientes, residentesController.getSignosVitalesRecientes);

/**
 * @route   GET /api/residentes/:id
 * @desc    Obtener un residente por su ID
 * @access  Private
 */
router.get('/:id', accesoResidentes, residentesController.getResidenteById);

/**
 * @route   POST /api/residentes
 * @desc    Crear un nuevo residente
 * @access  Private (solo admin y secretaria)
 */
router.post('/',
  authenticate(),
  authorizeAccess({ roles: ['admin', 'secretaria'], permisos: ['residentes'] }),
  residentesController.createResidente
);

/**
 * @route   PUT /api/residentes/:id
 * @desc    Actualizar un residente existente
 * @access  Private (solo admin, medico y secretaria)
 */
router.put('/:id',
  authenticate(),
  authorizeAccess({ roles: ['admin', 'medico', 'secretaria'], permisos: ['residentes'] }),
  residentesController.updateResidente
);

/**
 * @route   DELETE /api/residentes/:id
 * @desc    Eliminar un residente
 * @access  Private (solo admin)
 */
router.delete('/:id',
  authenticate(),
  authorizeAccess({ roles: ['admin'], permisos: ['residentes'] }),
  residentesController.deleteResidente
);

/**
 * @route   POST /api/residentes/:id/foto
 * @desc    Subir o actualizar foto de un residente
 * @access  Private (admin, secretaria)
 */
router.post('/:id/foto',
  authenticate(),
  authorizeAccess({ roles: ['admin', 'secretaria'], permisos: ['residentes'] }),
  upload.single('foto'),
  residentesController.uploadPhoto
);

/**
 * @route   DELETE /api/residentes/:id/foto
 * @desc    Eliminar foto de un residente
 * @access  Private (admin, secretaria)
 */
router.delete('/:id/foto',
  authenticate(),
  authorizeAccess({ roles: ['admin', 'secretaria'], permisos: ['residentes'] }),
  residentesController.deletePhoto
);

module.exports = router;