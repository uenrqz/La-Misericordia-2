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
      // Normalizar credenciales para el backend
      const loginCredentials = { ...credentials };
      
      // Si el username no contiene @, podría ser un nombre de usuario directo como 'admin' o 'u.enrqz'
      if (loginCredentials.username && !loginCredentials.username.includes('@')) {
        console.log(`[BFF Auth] Procesando inicio de sesión con username: ${loginCredentials.username}`);
        
        // No modificamos el username, lo enviamos tal cual al backend
        // El backend debe estar configurado para aceptar tanto username como email
      }
      
      console.log(`[BFF Auth] Enviando solicitud de autenticación al backend para: ${loginCredentials.username}`);
      console.log(`[BFF Auth] URL del backend: ${process.env.API_URL || 'http://localhost:3000'}`);
      
      const response = await apiClient.post('/api/auth/login', loginCredentials);
      
      if (!response.data || !response.data.token) {
        console.error('[BFF Auth] Respuesta inválida del backend:', response.data);
        throw {
          status: 401,
          message: 'Respuesta de autenticación inválida del backend'
        };
      }
      
      console.log('[BFF Auth] Autenticación exitosa desde el backend');
      return response.data;
    } catch (error) {
      // Si ya es un error personalizado, lo lanzamos directamente
      if (error.status && error.message) {
        throw error;
      }
      
      // Determinamos el tipo de error basado en la respuesta o el código
      const status = error.status || 
                     (error.response ? error.response.status : 500);
      
      let message = 'Error de autenticación';
      const errorCode = error.code;
      
      // Log detallado del error para debugging
      console.error('[BFF Auth] Error en autenticación:', {
        code: errorCode,
        status: status,
        message: error.message,
        responseData: error.response?.data,
        apiUrl: process.env.API_URL
      });
      
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      } else if (errorCode === 'ECONNREFUSED') {
        message = 'No se pudo conectar al servidor de autenticación. Verifica que el backend esté en línea.';
        console.error('[BFF Auth] ❌ Backend no responde. Verifica API_URL:', process.env.API_URL);
      } else if (errorCode === 'ECONNABORTED' || errorCode === 'ETIMEDOUT') {
        message = 'Tiempo de espera agotado al intentar autenticar. El backend puede estar lento o suspendido.';
        console.error('[BFF Auth] ⏱️ Timeout al conectar con el backend');
      } else if (errorCode === 'ENOTFOUND') {
        message = 'No se encontró el servidor de autenticación. Verifica la URL del backend.';
        console.error('[BFF Auth] 🔍 Servidor no encontrado. API_URL:', process.env.API_URL);
      }
      
      throw {
        status,
        message,
        code: errorCode,
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
