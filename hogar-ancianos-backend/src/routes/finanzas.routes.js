const express = require('express');
const router = express.Router();
const finanzasController = require('../controllers/finanzas.controller');
const { authenticate, authorizeAccess } = require('../middlewares/auth.middleware');

const accesoFinanzas = [
	authenticate(),
	authorizeAccess({ roles: ['admin', 'medico', 'enfermera', 'secretaria'], permisos: ['finanzas'] })
];

/**
 * @route   GET /api/finanzas/resumen
 * @desc    Obtener resumen financiero
 * @access  Private
 */
router.get('/resumen', accesoFinanzas, finanzasController.getResumen);

/**
 * @route   GET /api/finanzas/graficas/mensuales
 * @desc    Obtener datos para gráficas mensuales de finanzas
 * @access  Private
 */
router.get('/graficas/mensuales', accesoFinanzas, finanzasController.getGraficasMensuales);

module.exports = router;
