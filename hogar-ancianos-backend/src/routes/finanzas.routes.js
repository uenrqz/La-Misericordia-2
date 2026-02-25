const express = require('express');
const router = express.Router();
const finanzasController = require('../controllers/finanzas.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/finanzas/resumen
 * @desc    Obtener resumen financiero
 * @access  Private
 */
router.get('/resumen', authenticate(['admin', 'medico', 'enfermera', 'secretaria']), finanzasController.getResumen);

/**
 * @route   GET /api/finanzas/graficas/mensuales
 * @desc    Obtener datos para gráficas mensuales de finanzas
 * @access  Private
 */
router.get('/graficas/mensuales', authenticate(['admin', 'medico', 'enfermera', 'secretaria']), finanzasController.getGraficasMensuales);

module.exports = router;
