/**
 * Servicio de usuarios para el BFF
 * Maneja la comunicación con el backend para operaciones relacionadas con usuarios
 */
const apiClient = require('../config/api.config');

class UsuariosService {
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
      const response = await apiClient.post('/api/usuarios', userData, {
        headers: { _originalAuthorization: token }
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw this._formatError(error);
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
    if (error.response) {
      // El servidor respondió con un código de error
      return {
        status: error.response.status,
        message: error.response.data.message || 'Error en la operación',
        details: error.response.data.error || null
      };
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      return {
        status: 503,
        message: 'No se pudo conectar con el servidor',
        details: 'Verifique que el servicio backend esté funcionando'
      };
    } else {
      // Error al configurar la petición
      return {
        status: 500,
        message: 'Error interno del BFF',
        details: error.message
      };
    }
  }
}

module.exports = new UsuariosService();
