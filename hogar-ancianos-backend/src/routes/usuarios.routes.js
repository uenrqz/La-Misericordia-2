const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');

// Importar el controlador de usuarios
const usuariosController = require('../controllers/usuarios.controller');

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios (solo admin)
 * @access  Private
 */
router.get('/', authenticate(['admin']), usuariosController.getUsuarios);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener un usuario por su ID
 * @access  Private (admin o el mismo usuario)
 */
router.get('/:id', authenticate(['admin', 'medico', 'doctor', 'enfermera']), usuariosController.getUsuarioById);

/**
 * @route   POST /api/usuarios
 * @desc    Crear un nuevo usuario
 * @access  Private (solo admin)
 */
router.post('/', authenticate(['admin']), usuariosController.createUsuario);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar un usuario existente
 * @access  Private (admin o el mismo usuario)
 */
router.put('/:id', authenticate(['admin', 'medico', 'doctor', 'enfermera']), usuariosController.updateUsuario);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar un usuario
 * @access  Private (solo admin)
 */
router.delete('/:id', authenticate(['admin']), usuariosController.deleteUsuario);

/**
 * @route   PUT /api/usuarios/:id/cambiar-password
 * @desc    Cambiar la contraseña de un usuario
 * @access  Private (admin o el mismo usuario)
 */
router.put('/:id/cambiar-password', authenticate(['admin', 'medico', 'doctor', 'enfermera']), usuariosController.cambiarPassword);

/**
 * @route   PUT /api/usuarios/:id/estado
 * @desc    Activar/desactivar un usuario
 * @access  Private (solo admin)
 */
router.put('/:id/estado', authenticate(['admin']), usuariosController.toggleEstadoUsuario);

/**
 * @route   GET /api/usuarios/solicitudes-admin
 * @desc    Obtener solicitudes pendientes de administrador
 * @access  Private (solo admin)
 */
router.get('/admin/solicitudes', authenticate(['admin']), usuariosController.getSolicitudesAdmin);

/**
 * @route   POST /api/usuarios/solicitudes-admin/:id/responder
 * @desc    Aprobar o rechazar una solicitud de administrador
 * @access  Private (solo admin)
 */
router.post('/admin/solicitudes/:solicitudId/responder', authenticate(['admin']), usuariosController.responderSolicitudAdmin);

module.exports = router;