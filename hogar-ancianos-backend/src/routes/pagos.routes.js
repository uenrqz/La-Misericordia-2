const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagos.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación y rol admin
router.use(authenticateToken);
router.use(requireRole(['admin']));

/**
 * @route   GET /api/pagos-programados
 * @desc    Obtener todos los pagos programados
 * @access  Admin
 */
router.get('/', pagosController.getPagosProgramados);

/**
 * @route   GET /api/pagos-programados/instancias
 * @desc    Obtener instancias de pagos (calendario)
 * @access  Admin
 */
router.get('/instancias', pagosController.getInstanciasPagos);

/**
 * @route   GET /api/pagos-programados/atencion
 * @desc    Obtener pagos que requieren atención (próximos y atrasados)
 * @access  Admin
 */
router.get('/atencion', pagosController.getPagosAtencion);

/**
 * @route   POST /api/pagos-programados/generar-instancias
 * @desc    Generar instancias de pagos manualmente
 * @access  Admin
 */
router.post('/generar-instancias', pagosController.generarInstanciasPagos);

/**
 * @route   PUT /api/pagos-programados/actualizar-estados
 * @desc    Actualizar estados de pagos (atrasados, próximos)
 * @access  Admin
 */
router.put('/actualizar-estados', pagosController.actualizarEstadosPagos);

/**
 * @route   GET /api/pagos-programados/:id
 * @desc    Obtener un pago programado por ID
 * @access  Admin
 */
router.get('/:id', pagosController.getPagoProgramadoById);

/**
 * @route   POST /api/pagos-programados
 * @desc    Crear pago programado
 * @access  Admin
 */
router.post('/', pagosController.createPagoProgramado);

/**
 * @route   PUT /api/pagos-programados/:id
 * @desc    Actualizar pago programado
 * @access  Admin
 */
router.put('/:id', pagosController.updatePagoProgramado);

/**
 * @route   DELETE /api/pagos-programados/:id
 * @desc    Eliminar/Desactivar pago programado
 * @access  Admin
 */
router.delete('/:id', pagosController.deletePagoProgramado);

/**
 * @route   POST /api/pagos-programados/instancia/:id/pagar
 * @desc    Marcar instancia de pago como pagada
 * @access  Admin
 */
router.post('/instancia/:id/pagar', pagosController.marcarComoPagado);

/**
 * @route   PUT /api/pagos-programados/instancia/:id/cancelar
 * @desc    Cancelar instancia de pago
 * @access  Admin
 */
router.put('/instancia/:id/cancelar', pagosController.cancelarInstanciaPago);

module.exports = router;
