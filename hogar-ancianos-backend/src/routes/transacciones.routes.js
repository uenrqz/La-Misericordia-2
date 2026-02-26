const express = require('express');
const router = express.Router();
const transaccionesController = require('../controllers/transacciones.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación y rol admin
router.use(authenticate(['admin']));

/**
 * @route   GET /api/transacciones
 * @desc    Obtener todas las transacciones con filtros
 * @access  Admin
 */
router.get('/', transaccionesController.getTransacciones);

/**
 * @route   GET /api/transacciones/resumen
 * @desc    Obtener resumen financiero
 * @access  Admin
 */
router.get('/resumen', transaccionesController.getResumenFinanciero);

/**
 * @route   GET /api/transacciones/predicciones
 * @desc    Obtener predicciones y sugerencias
 * @access  Admin
 */
router.get('/predicciones', transaccionesController.getPredicciones);

/**
 * @route   GET /api/transacciones/estadisticas-hoy
 * @desc    Obtener estadísticas del día actual
 * @access  Admin
 */
router.get('/estadisticas-hoy', transaccionesController.getEstadisticasHoy);

/**
 * @route   GET /api/transacciones/exportar
 * @desc    Exportar transacciones
 * @access  Admin
 */
router.get('/exportar', transaccionesController.exportarTransacciones);

/**
 * @route   GET /api/transacciones/categorias
 * @desc    Obtener categorías de transacciones
 * @access  Admin
 */
router.get('/categorias', transaccionesController.getCategorias);

/**
 * @route   GET /api/transacciones/:id
 * @desc    Obtener una transacción por ID
 * @access  Admin
 */
router.get('/:id', transaccionesController.getTransaccionById);

/**
 * @route   POST /api/transacciones
 * @desc    Crear nueva transacción
 * @access  Admin
 */
router.post('/', transaccionesController.createTransaccion);

/**
 * @route   PUT /api/transacciones/:id
 * @desc    Actualizar transacción
 * @access  Admin
 */
router.put('/:id', transaccionesController.updateTransaccion);

/**
 * @route   DELETE /api/transacciones/:id
 * @desc    Eliminar transacción
 * @access  Admin
 */
router.delete('/:id', transaccionesController.deleteTransaccion);

module.exports = router;
