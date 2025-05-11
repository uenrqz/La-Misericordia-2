const express = require('express');
const router = express.Router();
const signosVitalesController = require('../controllers/signos-vitales.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/residentes/:id/signos-vitales
 * @desc    Obtener todos los registros de signos vitales de un residente
 * @access  Private (admin, médico, enfermera)
 */
router.get('/:id/signos-vitales', 
  authenticate(['admin', 'medico', 'enfermera']), 
  signosVitalesController.getSignosVitalesByResidente
);

/**
 * @route   POST /api/residentes/:id/signos-vitales
 * @desc    Registrar nuevos signos vitales para un residente
 * @access  Private (admin, medico, enfermera)
 */
router.post('/:id/signos-vitales', 
  authenticate(['admin', 'medico', 'enfermera']), 
  signosVitalesController.createSignosVitales
);

/**
 * @route   PUT /api/residentes/:id/signos-vitales/:signoVitalId
 * @desc    Actualizar un registro de signos vitales (solo del mismo día)
 * @access  Private (admin, médico, enfermera que creó el registro)
 */
router.put('/:id/signos-vitales/:signoVitalId', 
  authenticate(['admin', 'medico', 'enfermera']), 
  signosVitalesController.updateSignosVitales
);

/**
 * @route   GET /api/residentes/:id/signos-vitales/estadisticas
 * @desc    Obtener estadísticas de signos vitales (para gráficas)
 * @access  Private (admin, médico, enfermera)
 */
router.get('/:id/signos-vitales/estadisticas', 
  authenticate(['admin', 'medico', 'enfermera']), 
  signosVitalesController.getEstadisticasSignosVitales
);

module.exports = router;