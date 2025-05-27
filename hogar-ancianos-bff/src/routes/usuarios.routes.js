/**
 * Router para operaciones de usuarios en el BFF
 */
const express = require('express');
const router = express.Router();
const usuariosService = require('../services/usuarios.service');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/bff/usuarios
 * @desc    Obtener todos los usuarios
 * @access  Private (admin)
 */
router.get('/', authenticate(['admin']), async (req, res) => {
  try {
    const usuarios = await usuariosService.obtenerUsuarios(`Bearer ${req.user.originalToken}`);
    res.json(usuarios);
  } catch (error) {
    res.status(error.status || 500).json({ 
      message: error.message || 'Error al obtener usuarios',
      details: error.details
    });
  }
});

/**
 * @route   GET /api/bff/usuarios/:id
 * @desc    Obtener un usuario por ID
 * @access  Private (admin o el propio usuario)
 */
router.get('/:id', authenticate(['admin', 'medico', 'enfermera']), async (req, res) => {
  try {
    // Verificar si es el mismo usuario o es admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'No tienes permisos para ver este usuario' });
    }
    
    const usuario = await usuariosService.obtenerUsuarioPorId(req.params.id, `Bearer ${req.user.originalToken}`);
    res.json(usuario);
  } catch (error) {
    res.status(error.status || 500).json({ 
      message: error.message || 'Error al obtener usuario',
      details: error.details
    });
  }
});

/**
 * @route   POST /api/bff/usuarios
 * @desc    Crear un nuevo usuario
 * @access  Private (admin)
 */
router.post('/', authenticate(['admin']), async (req, res) => {
  try {
    const resultado = await usuariosService.crearUsuario(req.body, `Bearer ${req.user.originalToken}`);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ 
      message: error.message || 'Error al crear usuario',
      details: error.details
    });
  }
});

/**
 * @route   PUT /api/bff/usuarios/:id
 * @desc    Actualizar un usuario existente
 * @access  Private (admin o el propio usuario)
 */
router.put('/:id', authenticate(['admin', 'medico', 'enfermera']), async (req, res) => {
  try {
    // Verificar si es el mismo usuario o es admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'No tienes permisos para modificar este usuario' });
    }
    
    // Si no es admin, no debe poder cambiar su rol
    if (req.user.role !== 'admin' && req.body.rol) {
      delete req.body.rol;
    }
    
    const resultado = await usuariosService.actualizarUsuario(req.params.id, req.body, `Bearer ${req.user.originalToken}`);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ 
      message: error.message || 'Error al actualizar usuario',
      details: error.details
    });
  }
});

/**
 * @route   DELETE /api/bff/usuarios/:id
 * @desc    Eliminar un usuario (soft delete)
 * @access  Private (admin)
 */
router.delete('/:id', authenticate(['admin']), async (req, res) => {
  try {
    // No permitir eliminar su propia cuenta
    if (req.user.id === parseInt(req.params.id)) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }
    
    const resultado = await usuariosService.eliminarUsuario(req.params.id, `Bearer ${req.user.originalToken}`);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ 
      message: error.message || 'Error al eliminar usuario',
      details: error.details
    });
  }
});

/**
 * @route   PUT /api/bff/usuarios/:id/cambiar-password
 * @desc    Cambiar la contraseña de un usuario
 * @access  Private (admin o el propio usuario)
 */
router.put('/:id/cambiar-password', authenticate(['admin', 'medico', 'enfermera']), async (req, res) => {
  try {
    // Verificar si es el mismo usuario o es admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'No tienes permisos para cambiar esta contraseña' });
    }
    
    const resultado = await usuariosService.cambiarPassword(req.params.id, req.body, `Bearer ${req.user.originalToken}`);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ 
      message: error.message || 'Error al cambiar contraseña',
      details: error.details
    });
  }
});

/**
 * @route   PUT /api/bff/usuarios/:id/estado
 * @desc    Activar o desactivar un usuario
 * @access  Private (admin)
 */
router.put('/:id/estado', authenticate(['admin']), async (req, res) => {
  try {
    // No permitir desactivar su propia cuenta
    if (req.user.id === parseInt(req.params.id) && req.body.activo === false) {
      return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
    }
    
    const resultado = await usuariosService.cambiarEstadoUsuario(req.params.id, req.body.activo, `Bearer ${req.user.originalToken}`);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ 
      message: error.message || 'Error al cambiar estado del usuario',
      details: error.details
    });
  }
});

/**
 * @route   GET /api/bff/usuarios/admin/solicitudes
 * @desc    Obtener solicitudes pendientes de administrador
 * @access  Private (admin)
 */
router.get('/admin/solicitudes', authenticate(['admin']), async (req, res) => {
  try {
    const solicitudes = await usuariosService.obtenerSolicitudesAdmin(`Bearer ${req.user.originalToken}`);
    res.json(solicitudes);
  } catch (error) {
    res.status(error.status || 500).json({ 
      message: error.message || 'Error al obtener solicitudes de administrador',
      details: error.details
    });
  }
});

/**
 * @route   POST /api/bff/usuarios/admin/solicitudes/:solicitudId/responder
 * @desc    Aprobar o rechazar una solicitud de administrador
 * @access  Private (admin)
 */
router.post('/admin/solicitudes/:solicitudId/responder', authenticate(['admin']), async (req, res) => {
  try {
    const { aprobado, comentario } = req.body;
    
    if (typeof aprobado !== 'boolean') {
      return res.status(400).json({ message: 'El campo aprobado es obligatorio y debe ser un booleano' });
    }
    
    const resultado = await usuariosService.responderSolicitudAdmin(
      req.params.solicitudId,
      aprobado,
      comentario,
      `Bearer ${req.user.originalToken}`
    );
    
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ 
      message: error.message || 'Error al responder solicitud',
      details: error.details
    });
  }
});

module.exports = router;
