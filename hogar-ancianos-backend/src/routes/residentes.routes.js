const express = require('express');
const router = express.Router();
const residentesController = require('../controllers/residentes.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

/**
 * @route   GET /api/residentes
 * @desc    Obtener todos los residentes con opciones de filtrado
 * @access  Private
 */
router.get('/', authenticate(['admin', 'medico', 'cuidador', 'secretaria']), residentesController.getResidentes);

/**
 * @route   GET /api/residentes/stats
 * @desc    Obtener estadísticas de residentes
 * @access  Private
 */
router.get('/stats', authenticate(['admin', 'medico', 'cuidador', 'secretaria']), residentesController.getStats);

/**
 * @route   GET /api/residentes/ocupacion
 * @desc    Obtener datos de ocupación
 * @access  Private
 */
router.get('/ocupacion', authenticate(['admin', 'medico', 'cuidador', 'secretaria']), residentesController.getOcupacion);

/**
 * @route   GET /api/residentes/signos-vitales/recientes
 * @desc    Obtener signos vitales recientes
 * @access  Private
 */
router.get('/signos-vitales/recientes', authenticate(['admin', 'medico', 'enfermera']), residentesController.getSignosVitalesRecientes);

/**
 * @route   GET /api/residentes/:id
 * @desc    Obtener un residente por su ID
 * @access  Private
 */
router.get('/:id', authenticate(['admin', 'medico', 'cuidador', 'secretaria']), residentesController.getResidenteById);

/**
 * @route   POST /api/residentes
 * @desc    Crear un nuevo residente
 * @access  Private (solo admin y secretaria)
 */
router.post('/', authenticate(['admin', 'secretaria']), residentesController.createResidente);

/**
 * @route   PUT /api/residentes/:id
 * @desc    Actualizar un residente existente
 * @access  Private (solo admin, medico y secretaria)
 */
router.put('/:id', authenticate(['admin', 'medico', 'secretaria']), residentesController.updateResidente);

/**
 * @route   DELETE /api/residentes/:id
 * @desc    Eliminar un residente
 * @access  Private (solo admin)
 */
router.delete('/:id', authenticate(['admin']), residentesController.deleteResidente);

/**
 * @route   POST /api/residentes/:id/foto
 * @desc    Subir o actualizar foto de un residente
 * @access  Private (admin, secretaria)
 */
router.post('/:id/foto', 
  authenticate(['admin', 'secretaria']), 
  upload.single('foto'),
  residentesController.uploadPhoto
);

/**
 * @route   DELETE /api/residentes/:id/foto
 * @desc    Eliminar foto de un residente
 * @access  Private (admin, secretaria)
 */
router.delete('/:id/foto', 
  authenticate(['admin', 'secretaria']),
  residentesController.deletePhoto
);

module.exports = router;