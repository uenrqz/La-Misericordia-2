const apiClient = require('../config/api.config');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Servicio de autenticación del BFF
 */
class AuthService {
  /**
   * Autenticar usuario contra el backend
   * @param {Object} credentials - Credenciales de usuario (username, password)
   * @returns {Promise<Object>} - Token y datos de usuario
   */
  async login(credentials) {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      if (!response.data || !response.data.token) {
        throw {
          status: 401,
          message: 'Respuesta de autenticación inválida del backend'
        };
      }
      return response.data;
    } catch (error) {
      // Si ya es un error personalizado, lo lanzamos directamente
      if (error.status && error.message) {
        throw error;
      }
      
      // Determinamos el tipo de error basado en la respuesta o el código
      const status = error.status || 
                     (error.response ? error.response.status : 401);
      
      let message = 'Error de autenticación';
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      } else if (error.code === 'ECONNREFUSED') {
        message = 'No se pudo conectar al servidor de autenticación';
      } else if (error.code === 'ECONNABORTED') {
        message = 'Tiempo de espera agotado al intentar autenticar';
      }
      
      throw {
        status,
        message,
        data: error.data || (error.response ? error.response.data : null)
      };
    }
  }

  /**
   * Obtener token BFF basado en la respuesta del backend
   * @param {Object} userData - Datos del usuario autenticado con token
   * @returns {String} - Token BFF
   */
  generateBffToken(userData) {
    try {
      // Validaciones de seguridad
      if (!userData || !userData.user || !userData.token) {
        throw new Error('Datos de usuario inválidos para generar token');
      }
      
      // El token BFF incluye información del token original y datos del usuario
      const payload = {
        userId: userData.user.id,
        username: userData.user.username,
        role: userData.user.rol,
        originalToken: userData.token,
        createdAt: new Date().getTime()
      };

      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION || '8h'
      });
    } catch (error) {
      console.error('Error al generar BFF token:', error);
      throw {
        status: 500,
        message: 'Error al generar token de autenticación',
        data: { error: error.message }
      };
    }
  }

  /**
   * Verificar token BFF
   * @param {String} token - Token BFF a verificar
   * @returns {Object} - Datos del payload si es válido
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar que el token tiene los campos necesarios
      if (!decoded.userId || !decoded.username || !decoded.role || !decoded.originalToken) {
        throw new Error('Token incompleto o mal formado');
      }
      
      return decoded;
    } catch (error) {
      console.error('Error al verificar token:', error.message);
      throw {
        status: 401,
        message: error.name === 'TokenExpiredError' ? 
                'Su sesión ha expirado, por favor inicie sesión nuevamente' : 
                'Token inválido o corrupto',
        data: { error: error.message }
      };
    }
  }
  
  /**
   * Validar que el token del backend sigue siendo válido
   * @param {String} token - Token original del backend
   * @returns {Promise<Boolean>} - True si el token es válido
   */
  async validateBackendToken(token) {
    try {
      // Intentar hacer una solicitud simple al backend con el token
      await apiClient.get('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      console.error('Error al validar token de backend:', error.message);
      return false;
    }
  }

  /**
   * Refrescar el token original del backend
   * @param {String} originalToken - Token actual del backend
   * @returns {Promise<Object>} - Nuevo token y datos de usuario
   */
  async refreshBackendToken(originalToken) {
    try {
      const response = await apiClient.post('/api/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${originalToken}` }
      });
      if (!response.data || !response.data.token) {
        throw {
          status: 401,
          message: 'Respuesta inválida del backend al refrescar token'
        };
      }
      return response.data;
    } catch (error) {
      let status = error.status || (error.response ? error.response.status : 401);
      let message = 'No se pudo refrescar el token del backend';
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      }
      throw {
        status,
        message,
        data: error.data || (error.response ? error.response.data : null)
      };
    }
  }
}

module.exports = new AuthService();
