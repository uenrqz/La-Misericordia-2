const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const donacionesController = require('../controllers/donaciones.controller');

/**
 * @route   GET /api/donaciones
 * @desc    Obtener todas las donaciones con opciones de filtrado
 * @access  Private (admin, administrativo, contador)
 */
router.get('/', 
  authenticate(['admin', 'administrativo', 'contador']), 
  donacionesController.getDonaciones
);

/**
 * @route   GET /api/donaciones/:id
 * @desc    Obtener una donación específica
 * @access  Private (admin, administrativo, contador)
 */
router.get('/:id', 
  authenticate(['admin', 'administrativo', 'contador']), 
  donacionesController.getDonacionById
);

/**
 * @route   POST /api/donaciones
 * @desc    Registrar nueva donación
 * @access  Private (admin, administrativo)
 */
router.post('/', 
  authenticate(['admin', 'administrativo']), 
  donacionesController.createDonacion
);

/**
 * @route   PUT /api/donaciones/:id
 * @desc    Actualizar donación
 * @access  Private (admin, administrativo, contador)
 */
router.put('/:id', 
  authenticate(['admin', 'administrativo', 'contador']), 
  donacionesController.updateDonacion
);

/**
 * @route   GET /api/donaciones/informe-sat
 * @desc    Generar informe de donaciones para SAT
 * @access  Private (admin, contador)
 */
router.get('/informe-sat', 
  authenticate(['admin', 'contador']), 
  donacionesController.generarInformeSAT
);

/**
 * @route   POST /api/donaciones/marcar-recibos
 * @desc    Marcar múltiples donaciones como con recibo generado
 * @access  Private (admin, contador)
 */
router.post('/marcar-recibos', 
  authenticate(['admin', 'contador']), 
  donacionesController.marcarRecibosGenerados
);

module.exports = router;