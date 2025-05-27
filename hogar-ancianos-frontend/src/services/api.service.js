import axios from 'axios';
import { fetchWithErrorHandling, recuperarDeErrores500 } from '../utils/errorHandler';

// Configuración base para las peticiones API
// Obtenemos la URL base del entorno, con fallback a producción
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:4000/api/bff' 
  : `${window.location.protocol}//${window.location.hostname}/api/bff`;

// Configuración de CORS
const CORS_CONFIG = {
  credentials: 'include',
  mode: 'cors'
};

/**
 * Cliente HTTP configurado para realizar peticiones al BFF con manejo de errores.
 * Incluye reintentos automáticos y manejo de errores 500.
 */
const apiClient = {
  /**
   * Realiza una petición GET con manejo de errores
   * @param {string} endpoint - Endpoint a consultar (sin incluir base URL)
   * @param {object} options - Opciones adicionales para la petición
   * @returns {Promise<object>} - Respuesta del servidor
   */
  get: async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Añadir token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await fetchWithErrorHandling(url, {
        method: 'GET',
        headers,
        credentials: 'include',
        mode: 'cors',
        timeout: options.timeout || 10000,
        maxRetries: options.maxRetries || 2,
        retryDelay: options.retryDelay || 1000,
        ...options,
        ...CORS_CONFIG
      });
      
      // Si hay error 500 después de los reintentos
      if (response.status === 500) {
        console.error(`Error 500 persistente en GET ${endpoint}`);
        // Intentar recuperarse
        await recuperarDeErrores500();
        throw new Error(`Error del servidor en ${endpoint}`);
      }
      
      // Para errores 401/403 relacionados con autenticación
      if (response.status === 401 || response.status === 403) {
        console.warn(`Error de autenticación ${response.status} en ${endpoint}`);
        // Si estamos en una página protegida, redireccionar al login
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Sesión expirada o inválida');
        }
      }
      
      // Devolver datos JSON si es posible
      if (response.headers.get('content-type')?.includes('application/json')) {
        return await response.json();
      }
      
      // Si no es JSON, devolver el texto
      return await response.text();
    } catch (error) {
      console.error(`Error en GET ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Realiza una petición POST con manejo de errores
   * @param {string} endpoint - Endpoint a consultar
   * @param {object} data - Datos a enviar en el cuerpo de la petición
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} - Respuesta del servidor
   */
  post: async (endpoint, data = {}, options = {}) => {
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Añadir token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await fetchWithErrorHandling(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
        mode: 'cors',
        timeout: options.timeout || 10000,
        maxRetries: options.maxRetries || 2,
        retryDelay: options.retryDelay || 1000,
        ...options,
        ...CORS_CONFIG
      });
      
      // Verificar si la respuesta es exitosa (código 2xx)
      if (!response.ok) {
        console.warn(`Respuesta no exitosa (${response.status}) en POST ${endpoint}`);
        
        // Intentar obtener más información del error
        let errorData = {};
        try {
          if (response.headers.get('content-type')?.includes('application/json')) {
            errorData = await response.clone().json();
          } else {
            errorData.text = await response.clone().text();
          }
        } catch (e) {
          console.error('Error al leer datos de error:', e);
        }
        
        // Manejar distintos tipos de errores
        if (response.status === 500) {
          console.error(`Error 500 en POST ${endpoint}:`, errorData);
          // Intentar recuperarse
          await recuperarDeErrores500();
          throw new Error(`Error del servidor (500) en ${endpoint}: ${errorData.message || 'Error interno'}`);
        }
        
        // Para errores 401/403 relacionados con autenticación
        if (response.status === 401 || response.status === 403) {
          console.warn(`Error de autenticación ${response.status} en ${endpoint}`);
          // Si estamos en una página protegida, redireccionar al login
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Sesión expirada o inválida');
          }
          throw new Error(errorData.message || 'Error de autenticación');
        }
        
        // Para cualquier otro error
        throw new Error(errorData.message || `Error ${response.status} en ${endpoint}`);
      }
      
      // Devolver datos JSON si es posible
      try {
        if (response.headers.get('content-type')?.includes('application/json')) {
          const jsonData = await response.json();
          
          // Verificar que los datos tengan la estructura esperada
          if (endpoint === '/auth/login' && (!jsonData || !jsonData.token)) {
            console.warn('Respuesta de login sin token:', jsonData);
            throw new Error('La respuesta del servidor de autenticación no tiene el formato esperado');
          }
          
          return jsonData;
        }
        
        // Si no es JSON, devolver el texto
        return await response.text();
      } catch (parseError) {
        console.error(`Error al procesar la respuesta de ${endpoint}:`, parseError);
        throw new Error(`Error al procesar la respuesta del servidor: ${parseError.message}`);
      }
    } catch (error) {
      console.error(`Error en POST ${endpoint}:`, error);
      
      // Mensajes de error personalizados para login
      if (endpoint === '/auth/login') {
        if (error.message.includes('401')) {
          throw new Error('Credenciales inválidas. Por favor verifique su usuario y contraseña.');
        } else if (error.message.includes('500')) {
          throw new Error('El servidor de autenticación no está disponible en este momento. Por favor intente más tarde.');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
          throw new Error('No se pudo conectar al servidor. Verifique su conexión a internet.');
        }
      }
      
      throw error;
    }
  },
  
  /**
   * Realiza una petición PUT con manejo de errores
   * @param {string} endpoint - Endpoint a consultar
   * @param {object} data - Datos a enviar en el cuerpo de la petición
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} - Respuesta del servidor
   */
  put: async (endpoint, data = {}, options = {}) => {
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Añadir token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await fetchWithErrorHandling(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        timeout: options.timeout || 10000,
        maxRetries: options.maxRetries || 2,
        retryDelay: options.retryDelay || 1000,
        ...options
      });
      
      // Si hay error 500 después de los reintentos
      if (response.status === 500) {
        console.error(`Error 500 persistente en PUT ${endpoint}`);
        // Intentar recuperarse
        await recuperarDeErrores500();
        throw new Error(`Error del servidor en ${endpoint}`);
      }
      
      // Devolver datos JSON si es posible
      if (response.headers.get('content-type')?.includes('application/json')) {
        return await response.json();
      }
      
      // Si no es JSON, devolver el texto
      return await response.text();
    } catch (error) {
      console.error(`Error en PUT ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Realiza una petición DELETE con manejo de errores
   * @param {string} endpoint - Endpoint a consultar
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} - Respuesta del servidor
   */
  delete: async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Añadir token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await fetchWithErrorHandling(url, {
        method: 'DELETE',
        headers,
        timeout: options.timeout || 10000,
        maxRetries: options.maxRetries || 1, // Menos reintentos para operaciones destructivas
        retryDelay: options.retryDelay || 1000,
        ...options
      });
      
      // Si hay error 500 después de los reintentos
      if (response.status === 500) {
        console.error(`Error 500 persistente en DELETE ${endpoint}`);
        // Intentar recuperarse
        await recuperarDeErrores500();
        throw new Error(`Error del servidor en ${endpoint}`);
      }
      
      // Devolver datos JSON si es posible
      if (response.headers.get('content-type')?.includes('application/json')) {
        return await response.json();
      }
      
      // Si no es JSON, devolver el texto
      return await response.text();
    } catch (error) {
      console.error(`Error en DELETE ${endpoint}:`, error);
      throw error;
    }
  }
};

export default apiClient;
