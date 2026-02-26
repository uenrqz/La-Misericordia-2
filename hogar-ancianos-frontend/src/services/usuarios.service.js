/**
 * Servicio para gestionar usuarios en el frontend
 */
import apiClient from './api.config';

const usuariosService = {
  /**
   * Obtener usuarios públicos para el login (sin autenticación requerida)
   * @returns {Promise<Array>} Lista básica de usuarios para el login
   */
  // Cache de usuarios públicos para reducir llamadas al servidor
  _cachedPublicUsers: null,
  _cacheTimestamp: 0,
  _cacheTTL: 60000, // 1 minuto de tiempo de vida para la caché
  
    getUsuariosPublicos: async () => {
    try {
      // Usar caché si está disponible y no ha expirado
      const now = Date.now();
      if (usuariosService._cachedPublicUsers && 
          (now - usuariosService._cacheTimestamp) < usuariosService._cacheTTL) {
        console.log('🔄 Usando caché de usuarios para el login');
        return usuariosService._cachedPublicUsers;
      }
      
      // Obtener la URL base del BFF desde las variables de entorno
      const BFF_URL = import.meta.env.VITE_BFF_URL || 'https://hogar-ancianos-bff.onrender.com';
      const url = `${BFF_URL}/api/bff/usuarios/public`;
      
      // Desactivar logs en producción para reducir consumo de memoria
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📞 Llamando a usuarios públicos: ${url}`);
      }
      
      const fetchResponse = await fetch(url, {
        // Optimizar la petición
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'default'
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`Error de red: ${fetchResponse.status}`);
      }
      
      const data = await fetchResponse.json();
      
      // Guardar en caché
      usuariosService._cachedPublicUsers = data;
      usuariosService._cacheTimestamp = now;
      
      // Desactivar logs en producción
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Usuarios cargados:', data.length);
      }
      
      return data;
    } catch (error) {
      // Log mínimo en producción para reducir overhead
      console.error('❌ Error al obtener usuarios:', error.message);
      throw error;
    }
  },

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
      console.log('🚀 Iniciando creación de usuario:', {
        username: userData.username,
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        rol: userData.rol
      });
      
      // Validar que el rol sea uno de los permitidos antes de enviarlo
      const rolesPermitidos = ['admin', 'medico', 'enfermero', 'cuidador', 'secretaria'];
      if (!rolesPermitidos.includes(userData.rol)) {
        console.warn(`⚠️ Rol no válido "${userData.rol}", cambiando a "enfermero"`);
        userData.rol = 'enfermero'; // Usar un rol seguro por defecto
      }
      
      // Verificar que todos los campos requeridos estén presentes
      const camposRequeridos = ['username', 'nombre', 'apellido', 'email', 'password', 'rol'];
      const camposFaltantes = camposRequeridos.filter(campo => !userData[campo]);
      
      if (camposFaltantes.length > 0) {
        const errorMsg = `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`;
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // Asegurar que los valores son del tipo correcto
      const userDataNormalizado = {
        username: String(userData.username).trim(),
        nombre: String(userData.nombre).trim(),
        apellido: String(userData.apellido).trim(),
        email: String(userData.email).trim(),
        password: userData.password,
        rol: String(userData.rol).trim(),
        permisos: Array.isArray(userData.permisos) ? userData.permisos : []
      };
      
      console.log('📡 Enviando petición al servidor...');
      
      // Usar fetch directamente para tener más control sobre la petición
      const BFF_URL = import.meta.env.VITE_BFF_URL || 'https://hogar-ancianos-bff.onrender.com';
      const baseURL = `${BFF_URL}/api/bff`;
      const url = `${baseURL}/usuarios`;  
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No hay token de autenticación disponible');
        throw new Error('No hay token de autenticación disponible');
      }
      
      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userDataNormalizado)
      });
      
      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json().catch(() => ({}));
        console.error(`❌ Error del servidor (${fetchResponse.status}):`, errorData);
        
        throw {
          response: {
            status: fetchResponse.status,
            data: errorData,
            statusText: fetchResponse.statusText
          }
        };
      }
      
      const response = await fetchResponse.json();
      console.log('✅ Usuario creado exitosamente:', response);
      return response;
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      
      // Mejorar mensaje de error para depuración
      if (error.response) {
        console.error('🔍 Datos de la respuesta de error:', {
          status: error.response.status,
          data: error.response.data,
          statusText: error.response.statusText
        });
        
        // Intentar proporcionar un mensaje más descriptivo
        if (error.response.status === 401) {
          console.error('🔑 Error de autenticación. Posiblemente el token ha expirado.');
        } else if (error.response.status === 403) {
          console.error('🔒 Error de permisos. El usuario no tiene permisos de administrador.');
        } else if (error.response.status === 400) {
          console.error('📋 Datos incorrectos:', error.response.data?.message || 'Formato de datos incorrecto');
        }
      }
      
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
