import apiClient from './api.config';
import { recuperarDeErrores500 } from '../utils/errorHandler';

// Servicio de autenticación
const authService = {
  // Login con credenciales
  login: async (username, password) => {
    try {
      // Validar entrada
      if (!username || username.trim() === '') {
        throw new Error('El nombre de usuario no puede estar vacío');
      }
      
      if (!password || password.trim() === '') {
        throw new Error('La contraseña no puede estar vacía');
      }
      
      // Autenticación con el servidor
      const response = await apiClient.post('/auth/login', { username, password });
      
      // Verificar respuesta
      if (!response || !response.token || !response.user) {
        throw new Error('Respuesta de autenticación inválida');
      }
      
      // Guardar información de autenticación de forma segura
      try {
        // Guardar token en localStorage para persistencia entre sesiones
        localStorage.setItem('token', response.token);
        // Guardar usuario en sessionStorage para mejor seguridad
        sessionStorage.setItem('user', JSON.stringify(response.user));
        // También mantener en localStorage para compatibilidad
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Guardar timestamp del login
        const ahora = new Date().toISOString();
        localStorage.setItem('auth_timestamp', ahora);
        console.log('Autenticación guardada correctamente:', ahora);
      } catch (storageError) {
        console.error('Error guardando datos de autenticación:', storageError);
        // Continuar aunque falle el almacenamiento
      }
      
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },
  
  // Cerrar sesión
  logout: async () => {
    try {
      // Intentar logout en el servidor
      try {
        await apiClient.post('/auth/logout');
      } catch (error) {
        console.warn('Error al hacer logout en el servidor:', error);
        // Continuar con el logout local aunque falle en el servidor
      }
      
      // Limpiar storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      // Aún así, intentamos limpiar el storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },
  
  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    
    // Si no hay token, no está autenticado
    if (!token) return false;
    
    // Verificar tiempo de última autenticación
    const authTimestamp = localStorage.getItem('auth_timestamp');
    if (authTimestamp) {
      // Comprobar si la autenticación tiene más de 8 horas (expiración)
      const entonces = new Date(authTimestamp);
      const ahora = new Date();
      
      // 8 horas en milisegundos = 8 * 60 * 60 * 1000
      const horasExpiracion = 8;
      const diff = ahora.getTime() - entonces.getTime();
      
      if (diff > horasExpiracion * 60 * 60 * 1000) {
        console.warn('Sesión expirada por tiempo');
        // Limpiar datos de autenticación
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        return false;
      }
    }
    
    return true;
  },
  
  // Obtener usuario actual
  getCurrentUser: () => {
    try {
      // Primero intentar desde sessionStorage (más seguro)
      let userStr = sessionStorage.getItem('user');
      
      // Si no está en sessionStorage, intentar desde localStorage
      if (!userStr) {
        userStr = localStorage.getItem('user');
        // Si se encuentra en localStorage pero no en sessionStorage, restaurarlo en sessionStorage
        if (userStr) {
          try {
            sessionStorage.setItem('user', userStr);
          } catch (e) {
            console.warn('No se pudo restaurar el usuario en sessionStorage');
          }
        }
      }
      
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  },
  
  // Cambiar contraseña
  changePassword: async (currentPassword, newPassword) => {
    try {
      const result = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return result;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  },
  
  // Cambiar contraseña obligatoria (primer inicio de sesión)
  cambiarPasswordObligatoria: async (userId, newPassword) => {
    try {
      const result = await apiClient.post('/auth/cambiar-password-obligatoria', {
        userId,
        newPassword
      });
      return result;
    } catch (error) {
      console.error('Error al cambiar contraseña obligatoria:', error);
      throw error;
    }
  },
  
  // Solicitar restablecimiento de contraseña
  requestPasswordReset: async (email) => {
    try {
      return await apiClient.post('/auth/request-password-reset', { email });
    } catch (error) {
      console.error('Error al solicitar restablecimiento de contraseña:', error);
      throw error;
    }
  },
  
  // Resetear contraseña con token
  resetPassword: async (token, newPassword) => {
    try {
      return await apiClient.post('/auth/reset-password', { token, newPassword });
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      throw error;
    }
  },
  
  // Verificar la sesión actual con el servidor
  verifySession: async () => {
    try {
      // Si no hay token localmente, ya sabemos que no está autenticado
      if (!authService.isAuthenticated()) {
        return { authenticated: false, message: 'No hay sesión local' };
      }
      
      // Verificar con el servidor
      const result = await apiClient.get('/auth/verify');
      
      // Actualizar timestamp de autenticación si la sesión es válida
      if (result && result.authenticated) {
        localStorage.setItem('auth_timestamp', new Date().toISOString());
      }
      
      return result;
    } catch (error) {
      console.error('Error verificando sesión con el servidor:', error);
      // Si hay un error de autorización, limpiar datos locales
      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
      }
      return { authenticated: false, message: error.message || 'Error verificando sesión' };
    }
  },
  
  // Verificar token de sesión
  verifyToken: async () => {
    try {
      return await apiClient.get('/auth/verify');
    } catch (error) {
      console.warn('Error al verificar token:', error);
      return { valid: false };
    }
  },
  
  // Refrescar el token BFF manualmente (opcional, para uso avanzado)
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        return { success: true, token: response.token };
      }
      return { success: false };
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      return { success: false };
    }
  }
};

export default authService;