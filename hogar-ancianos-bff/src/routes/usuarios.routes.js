/**
 * Router para operaciones de usuarios en el BFF
 */
const express = require('express');
const router = express.Router();
const usuariosService = require('../services/usuarios.service');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/bff/usuarios/public
 * @desc    Obtener usuarios para el login (versión pública sin detalles sensibles)
 * @access  Public
 */
router.get('/public', async (req, res) => {
  try {
    const usuarios = await usuariosService.obtenerUsuariosParaLogin();
    res.json(usuarios);
  } catch (error) {
    res.status(error.status || 500).json({ 
      message: error.message || 'Error al obtener usuarios para login',
      details: error.details
    });
  }
});

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
    console.log('Ruta POST /usuarios: Iniciando creación de usuario', {
      username: req.body?.username,
      rol: req.body?.rol
    });
    
    // Verificar que se recibió un cuerpo de solicitud
    if (!req.body) {
      return res.status(400).json({
        message: 'No se recibieron datos para crear el usuario',
        details: 'El cuerpo de la solicitud está vacío'
      });
    }
    
    // Importamos el módulo de autenticación correctamente para acceder a sus funciones
    const { mapearRol } = require('../middleware/auth.middleware');
    
    // Validación de roles permitidos en la ruta
    if (req.body && req.body.rol) {
      const rolOriginal = req.body.rol;
      const rolesPermitidos = ['admin', 'medico', 'enfermero', 'cuidador', 'secretaria'];
      
      // Mapear el rol a un formato estandarizado
      const rolMapeado = mapearRol(rolOriginal);
      
      // Verificar si el rol mapeado está en la lista de roles permitidos
      if (!rolesPermitidos.includes(rolMapeado)) {
        console.warn(`Ruta POST /usuarios: Rol no permitido "${rolOriginal}" (mapeado a "${rolMapeado}"), cambiando a "enfermero"`);
        req.body.rol = 'enfermero'; // Usar rol seguro por defecto
      } else {
        console.log(`Ruta POST /usuarios: Rol válido para creación de usuario: ${rolOriginal} (mapeado a "${rolMapeado}")`);
        req.body.rol = rolMapeado; // Usar el rol mapeado para garantizar consistencia
      }
    }
    
    // Verificar que estén todos los campos requeridos
    const camposRequeridos = ['username', 'nombre', 'apellido', 'password', 'rol'];
    const camposFaltantes = camposRequeridos.filter(campo => !req.body[campo]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        message: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`,
        details: 'Todos los campos marcados son obligatorios'
      });
    }
    
    // Proceder con la creación del usuario a través del servicio
    const resultado = await usuariosService.crearUsuario(req.body, `Bearer ${req.user.originalToken}`);
    console.log('Ruta POST /usuarios: Usuario creado exitosamente');
    res.status(201).json(resultado);
  } catch (error) {
    console.error('Ruta POST /usuarios: Error al crear usuario:', error);
    
    // Crear una respuesta de error más descriptiva y útil
    const statusCode = error.status || 500;
    const errorMessage = error.message || 'Error al crear usuario';
    const errorDetails = error.details || 'Error en el proceso de creación de usuario';
    
    // Para errores de servidor (500), dar información más detallada
    let responseMessage = errorMessage;
    if (statusCode === 500) {
      responseMessage = `Error interno del servidor: ${errorMessage}. Por favor contacte al administrador del sistema.`;
    }
    
    res.status(statusCode).json({ 
      message: responseMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
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
