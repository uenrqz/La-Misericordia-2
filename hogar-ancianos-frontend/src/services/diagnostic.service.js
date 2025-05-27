import { fetchWithErrorHandling, diagnosticarErrores500, recuperarDeErrores500 } from '../utils/errorHandler';
import apiClient from './api.config';

/**
 * Servicio para realizar diagnóstico del sistema
 */
const diagnosticService = {
  /**
   * Verifica el estado de conectividad del frontend con el BFF
   */
  checkBffConnection: async () => {
    try {
      const response = await fetchWithErrorHandling('http://localhost:4000/api/bff/status', { 
        method: 'GET',
        timeout: 5000,
        maxRetries: 1
      });
      
      if (response.status >= 200 && response.status < 300) {
        return {
          status: 'online',
          message: response.data?.message || 'BFF en línea',
          details: response.data
        };
      } else {
        console.warn('Respuesta no exitosa del BFF:', response.status);
        return {
          status: 'degraded',
          message: `BFF respondió con estado: ${response.status}`,
          details: response.data || {}
        };
      }
    } catch (error) {
      console.error('Error al verificar conexión con BFF:', error);
      return {
        status: 'offline',
        message: 'No se pudo conectar con el BFF',
        error: error.message,
        details: {
          code: error.code,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        }
      };
    }
  },

  /**
   * Verifica el estado de conectividad del BFF con el backend
   */
  checkBackendConnection: async () => {
    try {
      const response = await fetchWithErrorHandling('http://localhost:4000/api/bff/diagnostic/backend-status', { 
        method: 'GET',
        timeout: 5000,
        maxRetries: 1
      });
      
      // Verificar si la respuesta es exitosa (2xx)
      if (response.status >= 200 && response.status < 300) {
        return {
          status: response.data?.status || 'unknown',
          message: response.data?.message || 'Estado del backend desconocido',
          details: response.data
        };
      } 
      // Si el BFF responde pero indica que no puede conectar con el backend
      else if (response.status < 500) {
        return {
          status: 'offline',
          message: response.data?.message || 'El backend parece estar offline según el BFF',
          details: response.data || {}
        };
      } 
      // Error del servidor BFF
      else {
        console.warn('Error del servidor BFF al verificar el backend:', response.status);
        return {
          status: 'unknown',
          message: `Error del servidor BFF: ${response.status}`,
          details: response.data || {}
        };
      }
    } catch (error) {
      console.error('Error al verificar conexión con backend:', error);
      return {
        status: 'unknown',
        message: 'No se pudo determinar el estado del backend',
        error: error.message,
        details: {
          code: error.code,
          status: error.response?.status,
          data: error.response?.data || {},
          message: error.response?.data?.message || error.message
        }
      };
    }
  },

  /**
   * Realiza un diagnóstico completo del sistema
   */
  performSystemDiagnostic: async () => {
    try {
      // Verificar estado del BFF con reintentos
      let bffStatus;
      try {
        bffStatus = await diagnosticService.checkBffConnection();
      } catch (error) {
        console.error('Error grave al verificar conexión con BFF:', error);
        bffStatus = {
          status: 'offline',
          message: 'Error crítico al verificar el BFF',
          error: error.message
        };
      }
      
      // Verificar estado del backend
      let backendStatus = { status: 'unknown', message: 'No se pudo determinar el estado del backend' };
      
      // Solo verificamos el backend si el BFF está en línea o degradado
      if (bffStatus.status === 'online' || bffStatus.status === 'degraded') {
        try {
          backendStatus = await diagnosticService.checkBackendConnection();
        } catch (error) {
          console.error('Error grave al verificar conexión con backend:', error);
          backendStatus = {
            status: 'unknown',
            message: 'Error crítico al verificar el backend',
            error: error.message
          };
        }
      }
      
      // Verificar estado de la autenticación
      const authStatus = {
        status: 'unknown',
        message: 'Estado de autenticación desconocido'
      };
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          authStatus.status = 'unauthenticated';
          authStatus.message = 'No hay token de autenticación';
        } else {
          // Verificar si la sesión parece válida (formato básico del token)
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            authStatus.status = 'invalid';
            authStatus.message = 'El formato del token es inválido';
          } else {
            authStatus.status = 'valid';
            authStatus.message = 'Token presente con formato válido';
            
            // Podríamos hacer una verificación adicional con el servidor,
            // pero solo si el BFF está disponible
          }
        }
      } catch (error) {
        console.error('Error al verificar estado de autenticación:', error);
        authStatus.message = 'Error al verificar estado de autenticación';
        authStatus.error = error.message;
      }
      
      // Compilar diagnóstico completo
      return {
        timestamp: new Date().toISOString(),
        bff: bffStatus,
        backend: backendStatus,
        auth: authStatus,
        frontend: {
          status: 'online',
          message: 'Frontend en ejecución',
          details: {
            userAgent: navigator.userAgent,
            localStorage: !!localStorage.getItem('token') ? 'Token presente' : 'Sin token',
            url: window.location.href,
            lastError: sessionStorage.getItem('lastSystemError') || 'Ninguno'
          }
        }
      };
    } catch (error) {
      // Manejar cualquier error inesperado en la función
      console.error('Error inesperado al realizar diagnóstico:', error);
      sessionStorage.setItem('lastSystemError', error.message);
      
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        status: 'error',
        message: 'Ocurrió un error al realizar el diagnóstico del sistema'
      };
    }
  },
  
  /**
   * Registra un error del sistema
   */
  logSystemError: (error, source) => {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message || 'Error desconocido',
      source: source || 'unknown',
      stack: error.stack,
      code: error.code,
      status: error.response?.status
    };
    
    console.error('Error del sistema:', errorInfo);
    
    // Almacenar para referencia futura
    try {
      const storedErrors = JSON.parse(sessionStorage.getItem('systemErrors') || '[]');
      storedErrors.push(errorInfo);
      // Mantener solo los últimos 10 errores para no sobrecargar sessionStorage
      while (storedErrors.length > 10) {
        storedErrors.shift();
      }
      sessionStorage.setItem('systemErrors', JSON.stringify(storedErrors));
      sessionStorage.setItem('lastSystemError', errorInfo.message);
    } catch (e) {
      console.error('Error al guardar información de error:', e);
    }
    
    return errorInfo;
  }
};

export default diagnosticService;
