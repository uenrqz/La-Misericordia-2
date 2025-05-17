const express = require('express');
const router = express.Router();
const donacionesController = require('../controllers/donaciones.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Proteger todas las rutas con autenticación
router.use(authMiddleware.authenticate());

// Rutas para gestión de sesión SAT (protegidas con roles específicos)
router.post('/sat/login', authMiddleware.hasRole(['admin', 'contabilidad']), donacionesController.iniciarSesionSAT);
router.get('/sat/sesion', authMiddleware.hasRole(['admin', 'contabilidad']), donacionesController.verificarSesionSAT);
router.post('/sat/logout', authMiddleware.hasRole(['admin', 'contabilidad']), donacionesController.cerrarSesionSAT);

// Rutas básicas CRUD
router.get('/', donacionesController.obtenerDonaciones);
router.get('/:id', donacionesController.obtenerDonacionPorId);
router.post('/', donacionesController.crearDonacion);
router.put('/:id', donacionesController.actualizarDonacion);
router.delete('/:id', donacionesController.eliminarDonacion);

// Rutas para generación de recibos
router.post('/:id/recibo', donacionesController.generarReciboDonacion);

module.exports = router;