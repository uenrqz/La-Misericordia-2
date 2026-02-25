/**
 * Servicio de usuarios para el BFF
 * Maneja la comunicación con el backend para operaciones relacionadas con usuarios
 */
const apiClient = require('../config/api.config');

class UsuariosService {
  /**
   * Obtener usuarios públicos para el login (sin autenticación requerida)
   * @returns {Promise<Array>} Lista básica de usuarios para el login
   */
  async obtenerUsuariosParaLogin() {
    try {
      const response = await apiClient.get('/api/usuarios/public');
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios públicos para login:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Obtener todos los usuarios
   * @returns {Promise<Array>} Lista de usuarios
   */
  async obtenerUsuarios(token) {
    try {
      const response = await apiClient.get('/api/usuarios', {
        headers: { _originalAuthorization: token }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Obtener un usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  async obtenerUsuarioPorId(id, token) {
    try {
      const response = await apiClient.get(`/api/usuarios/${id}`, {
        headers: { _originalAuthorization: token }
      });
      return response.data;
    } catch (error) {
      console.error(`Error al obtener usuario ${id}:`, error);
      throw this._formatError(error);
    }
  }

  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del nuevo usuario
   * @returns {Promise<Object>} Resultado de la creación
   */
  async crearUsuario(userData, token) {
    try {
      console.log('BFF: Iniciando creación de usuario con estos datos:', {
        username: userData.username,
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        rol: userData.rol,
        password: '********' // No mostrar contraseña en logs
      });
      
      // Verificar campos requeridos (segunda validación)
      const camposRequeridos = ['username', 'nombre', 'apellido', 'password', 'rol'];
      const camposFaltantes = camposRequeridos.filter(campo => !userData[campo]);
      
      if (camposFaltantes.length > 0) {
        console.warn(`BFF: Faltan campos requeridos: ${camposFaltantes.join(', ')}`);
        throw {
          status: 400,
          message: `Faltan campos requeridos: ${camposFaltantes.join(', ')}`,
          details: 'Todos los campos marcados son obligatorios'
        };
      }
      
      // Importar el mapeo de roles para normalizar la entrada
      const { mapearRol } = require('../middleware/auth.middleware');
      
      // Validación adicional de roles permitidos
      const rolesPermitidos = ['admin', 'medico', 'enfermero', 'cuidador', 'secretaria'];
      
      // Normalizar datos del usuario
      let usuarioNormalizado = {
        ...userData,
        username: String(userData.username).trim(),
        nombre: String(userData.nombre).trim(),
        apellido: String(userData.apellido).trim(),
        password: userData.password,
        email: userData.email ? String(userData.email).trim() : null,
      };
      
      // Normalizar el rol
      if (userData.rol) {
        const rolMapeado = mapearRol(userData.rol);
        console.log(`BFF: Rol original "${userData.rol}" mapeado a "${rolMapeado}"`);
        
        if (!rolesPermitidos.includes(rolMapeado)) {
          console.warn(`BFF: Rol mapeado "${rolMapeado}" no permitido, se cambiará a "enfermero"`);
          usuarioNormalizado.rol = 'enfermero'; // Rol seguro por defecto
        } else {
          usuarioNormalizado.rol = rolMapeado; // Usar el rol normalizado
        }
      } else {
        console.warn(`BFF: No se proporcionó rol, se usará "enfermero" por defecto`);
        usuarioNormalizado.rol = 'enfermero'; // Rol seguro por defecto si no se proporciona
      }
      
      console.log('BFF: Enviando datos normalizados al backend:', {
        ...usuarioNormalizado,
        password: '********' // No mostrar contraseña en logs
      });
      
      // Verificar token antes de enviar
      if (!token) {
        console.error('BFF: No se proporcionó token para crear usuario');
        throw {
          status: 401,
          message: 'Falta el token de autenticación',
          details: 'Se requiere un token válido para crear usuarios'
        };
      }
      
      // Intentar enviar la petición al backend
      try {
        const response = await apiClient.post('/api/usuarios', usuarioNormalizado, {
          headers: { _originalAuthorization: token }
        });
        
        console.log('BFF: Usuario creado exitosamente:', {
          id: response.data?.usuario?.id,
          username: response.data?.usuario?.username,
          rol: response.data?.usuario?.rol
        });
        
        return response.data;
      } catch (apiError) {
        // Manejo específico de errores del backend
        if (apiError.response) {
          const status = apiError.response.status;
          const errorMessage = apiError.response.data?.message || 'Error desconocido del servidor';
          console.error(`BFF: Error ${status} del backend:`, errorMessage);
          
          if (status === 400) {
            if (errorMessage.includes('Rol no válido')) {
              throw {
                status: 400,
                message: 'El rol seleccionado no es válido. Por favor, seleccione un rol permitido: admin, medico, enfermero, cuidador o secretaria.',
                details: errorMessage
              };
            } else if (errorMessage.includes('ya está en uso')) {
              throw {
                status: 400,
                message: 'El nombre de usuario o correo electrónico ya está registrado en el sistema.',
                details: errorMessage
              };
            } else {
              throw {
                status: 400,
                message: errorMessage,
                details: apiError.response.data?.error || 'Error de validación en el servidor'
              };
            }
          } else if (status === 401) {
            throw {
              status: 401,
              message: 'Sesión expirada o no autorizada',
              details: errorMessage
            };
          } else if (status === 403) {
            throw {
              status: 403,
              message: 'No tienes permiso para crear usuarios',
              details: errorMessage
            };
          } else {
            throw {
              status: status,
              message: errorMessage,
              details: apiError.response.data?.error || 'Error en el servidor'
            };
          }
        } else if (apiError.request) {
          // Si no hay respuesta del servidor
          console.error('BFF: No se recibió respuesta del backend al crear usuario');
          throw {
            status: 503,
            message: 'No se pudo conectar con el servidor. Por favor intente más tarde.',
            details: 'Error de conexión con el backend'
          };
        } else {
          console.error('BFF: Error al configurar la petición:', apiError.message);
          throw {
            status: 500,
            message: 'Error interno al procesar la solicitud',
            details: apiError.message
          };
        }
      }
    } catch (error) {
      console.error('BFF: Error general al crear usuario:', error);
      
      // Si no es un error ya formateado por nosotros, usar el formatter
      if (!error.status) {
        return Promise.reject(this._formatError(error));
      }
      
      // Si ya tiene formato, lo pasamos tal cual
      return Promise.reject(error);
    }
  }

  /**
   * Actualizar un usuario existente
   * @param {string} id - ID del usuario a actualizar
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  async actualizarUsuario(id, userData, token) {
    try {
      const response = await apiClient.put(`/api/usuarios/${id}`, userData, {
        headers: { _originalAuthorization: token }
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Eliminar un usuario (soft delete)
   * @param {string} id - ID del usuario a eliminar
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async eliminarUsuario(id, token) {
    try {
      const response = await apiClient.delete(`/api/usuarios/${id}`, {
        headers: { _originalAuthorization: token }
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Cambiar la contraseña de un usuario
   * @param {string} id - ID del usuario
   * @param {Object} passwordData - Datos de contraseña (actual y nueva)
   * @returns {Promise<Object>} Resultado del cambio
   */
  async cambiarPassword(id, passwordData, token) {
    try {
      const response = await apiClient.put(`/api/usuarios/${id}/cambiar-password`, passwordData, {
        headers: { _originalAuthorization: token }
      });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Activar o desactivar un usuario
   * @param {string} id - ID del usuario
   * @param {boolean} activo - Estado activo o inactivo
   * @returns {Promise<Object>} Resultado de la operación
   */
  async cambiarEstadoUsuario(id, activo, token) {
    try {
      const response = await apiClient.put(`/api/usuarios/${id}/estado`, { activo }, {
        headers: { _originalAuthorization: token }
      });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Obtener solicitudes de administrador pendientes
   * @returns {Promise<Array>} Lista de solicitudes pendientes
   */
  async obtenerSolicitudesAdmin(token) {
    try {
      const response = await apiClient.get('/api/usuarios/admin/solicitudes', {
        headers: { _originalAuthorization: token }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes de administrador:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Responder a una solicitud de administrador
   * @param {string} solicitudId - ID de la solicitud
   * @param {boolean} aprobado - Si se aprueba o rechaza
   * @param {string} comentario - Comentario opcional
   * @returns {Promise<Object>} Resultado de la operación
   */
  async responderSolicitudAdmin(solicitudId, aprobado, comentario, token) {
    try {
      const response = await apiClient.post(`/api/usuarios/admin/solicitudes/${solicitudId}/responder`, {
        aprobado,
        comentario
      }, {
        headers: { _originalAuthorization: token }
      });
      return response.data;
    } catch (error) {
      console.error('Error al responder solicitud de administrador:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Formatear errores para enviar respuestas más claras al frontend
   * @param {Error} error - Error original
   * @returns {Object} Error formateado
   * @private
   */
  _formatError(error) {
    // Si ya es un error formateado por nosotros, lo devolvemos tal cual
    if (error.status && error.message) {
      return error;
    }
    
    if (error.response) {
      // El servidor respondió con un código de error
      const errorData = error.response.data || {};
      
      // Mensajes más específicos según el código de error
      let message = errorData.message || 'Error en la operación';
      
      // Para errores de usuarios, proporcionamos mensajes más específicos
      if (error.config && error.config.url && error.config.url.includes('/usuarios')) {
        if (error.response.status === 400) {
          if (message.includes('Rol no válido')) {
            message = 'El rol proporcionado no es válido. Los roles permitidos son: admin, medico, enfermero, cuidador y secretaria.';
          } else if (message.includes('ya está en uso')) {
            message = 'El nombre de usuario o correo electrónico ya está registrado en el sistema.';
          }
        }
      }
      
      return {
        status: error.response.status,
        message: message,
        details: errorData.error || errorData.details || null
      };
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      return {
        status: 503,
        message: 'No se pudo conectar con el servidor backend',
        details: 'Verifique que el servicio backend esté funcionando y sea accesible'
      };
    } else {
      // Error al configurar la petición o error interno
      console.error('Error interno del BFF:', error);
      return {
        status: 500,
        message: 'Error interno del BFF al procesar la solicitud',
        details: error.message || 'Error desconocido'
      };
    }
  }
}

module.exports = new UsuariosService();
