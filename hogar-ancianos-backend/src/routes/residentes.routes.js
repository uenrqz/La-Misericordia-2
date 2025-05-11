const express = require('express');
const router = express.Router();
const residentesController = require('../controllers/residentes.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/residentes
 * @desc    Obtener todos los residentes con opciones de filtrado
 * @access  Private
 */
router.get('/', authenticate(['admin', 'medico', 'cuidador', 'secretaria']), residentesController.getResidentes);

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

module.exports = router;