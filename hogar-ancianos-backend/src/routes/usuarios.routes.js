const express = require('express');
const router = express.Router();
const { authenticate, authorizeAccess } = require('../middlewares/auth.middleware');

// Importar el controlador de usuarios
const usuariosController = require('../controllers/usuarios.controller');

/**
 * @route   GET /api/usuarios/public
 * @desc    Obtener lista pública de usuarios para login (sin datos sensibles)
 * @access  Public
 */
router.get('/public', usuariosController.getUsuariosPublicos);

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios (solo admin)
 * @access  Private
 */
router.get('/',
	authenticate(),
	authorizeAccess({ roles: ['admin'], permisos: ['usuarios'] }),
	usuariosController.getUsuarios
);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener un usuario por su ID
 * @access  Private (admin o el mismo usuario)
 */
router.get('/:id',
	authenticate(),
	authorizeAccess({ roles: ['admin'], permisos: ['usuarios'] }),
	usuariosController.getUsuarioById
);

/**
 * @route   POST /api/usuarios
 * @desc    Crear un nuevo usuario
 * @access  Private (solo admin)
 */
router.post('/',
	authenticate(),
	authorizeAccess({ roles: ['admin'], permisos: ['usuarios'] }),
	usuariosController.createUsuario
);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar un usuario existente
 * @access  Private (admin o el mismo usuario)
 */
router.put('/:id',
	authenticate(),
	authorizeAccess({ roles: ['admin', 'medico', 'doctor', 'enfermera'], permisos: ['usuarios'] }),
	usuariosController.updateUsuario
);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar un usuario
 * @access  Private (solo admin)
 */
router.delete('/:id',
	authenticate(),
	authorizeAccess({ roles: ['admin'], permisos: ['usuarios'] }),
	usuariosController.deleteUsuario
);

/**
 * @route   PUT /api/usuarios/:id/cambiar-password
 * @desc    Cambiar la contraseña de un usuario
 * @access  Private (admin o el mismo usuario)
 */
router.put('/:id/cambiar-password',
	authenticate(),
	authorizeAccess({ roles: ['admin', 'medico', 'doctor', 'enfermera'], permisos: ['usuarios'] }),
	usuariosController.cambiarPassword
);

/**
 * @route   PUT /api/usuarios/:id/estado
 * @desc    Activar/desactivar un usuario
 * @access  Private (solo admin)
 */
router.put('/:id/estado',
	authenticate(),
	authorizeAccess({ roles: ['admin'], permisos: ['usuarios'] }),
	usuariosController.toggleEstadoUsuario
);

/**
 * @route   GET /api/usuarios/solicitudes-admin
 * @desc    Obtener solicitudes pendientes de administrador
 * @access  Private (solo admin)
 */
router.get('/admin/solicitudes',
	authenticate(),
	authorizeAccess({ roles: ['admin'], permisos: ['usuarios'] }),
	usuariosController.getSolicitudesAdmin
);

/**
 * @route   POST /api/usuarios/solicitudes-admin/:id/responder
 * @desc    Aprobar o rechazar una solicitud de administrador
 * @access  Private (solo admin)
 */
router.post('/admin/solicitudes/:solicitudId/responder',
	authenticate(),
	authorizeAccess({ roles: ['admin'], permisos: ['usuarios'] }),
	usuariosController.responderSolicitudAdmin
);

module.exports = router;