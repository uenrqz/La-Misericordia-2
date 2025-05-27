/**
 * Servicio para gestionar usuarios en el frontend
 */
import apiClient from './api.config';

const usuariosService = {
  /**
   * Obtener todos los usuarios
   * @returns {Promise<Array>} Lista de usuarios
   */
  getUsuarios: async () => {
    try {
      return await apiClient.get('/usuarios');
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  },

  /**
   * Obtener un usuario por su ID
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  getUsuarioById: async (id) => {
    try {
      return await apiClient.get(`/usuarios/${id}`);
    } catch (error) {
      console.error(`Error al obtener usuario ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del nuevo usuario
   * @returns {Promise<Object>} Resultado de la creación
   */
  createUsuario: async (userData) => {
    try {
      return await apiClient.post('/usuarios', userData);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  /**
   * Actualizar un usuario existente
   * @param {string} id - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  updateUsuario: async (id, userData) => {
    try {
      return await apiClient.put(`/usuarios/${id}`, userData);
    } catch (error) {
      console.error(`Error al actualizar usuario ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un usuario (soft delete)
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  deleteUsuario: async (id) => {
    try {
      return await apiClient.delete(`/usuarios/${id}`);
    } catch (error) {
      console.error(`Error al eliminar usuario ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cambiar la contraseña de un usuario
   * @param {string} id - ID del usuario
   * @param {Object} passwordData - Datos de contraseña (actual, nueva y confirmación)
   * @returns {Promise<Object>} Resultado del cambio
   */
  cambiarPassword: async (id, passwordData) => {
    try {
      return await apiClient.put(`/usuarios/${id}/cambiar-password`, passwordData);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  },

  /**
   * Activar o desactivar un usuario
   * @param {string} id - ID del usuario
   * @param {boolean} activo - Estado activo o inactivo
   * @returns {Promise<Object>} Resultado de la operación
   */
  toggleEstadoUsuario: async (id, activo) => {
    try {
      return await apiClient.put(`/usuarios/${id}/estado`, { activo });
    } catch (error) {
      console.error(`Error al cambiar estado del usuario ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener solicitudes de administrador pendientes
   * @returns {Promise<Array>} Lista de solicitudes
   */
  getSolicitudesAdmin: async () => {
    try {
      return await apiClient.get('/usuarios/admin/solicitudes');
    } catch (error) {
      console.error('Error al obtener solicitudes de administrador:', error);
      throw error;
    }
  },

  /**
   * Aprobar o rechazar una solicitud de administrador
   * @param {string} solicitudId - ID de la solicitud
   * @param {boolean} aprobado - Si se aprueba o rechaza
   * @param {string} comentario - Comentario opcional
   * @returns {Promise<Object>} Resultado de la operación
   */
  responderSolicitudAdmin: async (solicitudId, aprobado, comentario = '') => {
    try {
      return await apiClient.post(`/usuarios/admin/solicitudes/${solicitudId}/responder`, {
        aprobado,
        comentario
      });
    } catch (error) {
      console.error(`Error al responder a solicitud ${solicitudId}:`, error);
      throw error;
    }
  },

  /**
   * Verificar si un usuario necesita cambiar su contraseña
   * @param {Object} user - Usuario actual
   * @returns {boolean} - True si necesita cambio de contraseña
   */
  requiereCambioPassword: (user) => {
    return user && user.cambio_password_requerido === true;
  }
};

export default usuariosService;
