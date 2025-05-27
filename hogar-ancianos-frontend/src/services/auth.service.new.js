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
      
      // Guardar información de autenticación
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
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
    return !!token;
  },
  
  // Obtener usuario actual
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
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
  
  // Verificar token de sesión
  verifyToken: async () => {
    try {
      return await apiClient.get('/auth/verify-token');
    } catch (error) {
      console.warn('Error al verificar token:', error);
      return { valid: false };
    }
  }
};

export default authService;
