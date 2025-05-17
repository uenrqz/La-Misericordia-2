const express = require('express');
const router = express.Router();
const donacionesController = require('../controllers/donaciones.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Proteger todas las rutas con autenticación
router.use(authMiddleware.authenticate());

// Rutas básicas CRUD
router.get('/', donacionesController.obtenerDonaciones);
router.get('/:id', donacionesController.obtenerDonacionPorId);
router.post('/', donacionesController.crearDonacion);
router.put('/:id', donacionesController.actualizarDonacion);
router.delete('/:id', donacionesController.eliminarDonacion);

// Rutas para generación de recibos
router.post('/:id/recibo', donacionesController.generarReciboDonacion);

module.exports = router;