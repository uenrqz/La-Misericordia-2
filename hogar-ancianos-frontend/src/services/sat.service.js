import axios from 'axios';

// URL base de la API para servicios de donación/SAT
const API_URL = 'http://localhost:4000/api/donaciones';

/**
 * Inicia sesión con el sistema SAT para facturación electrónica
 * @param {Object} credentials - Credenciales de acceso
 * @returns {Promise<Object>} - Resultado de la operación de login
 */
export const iniciarSesionSAT = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/sat/login`, credentials, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al iniciar sesión con SAT:', error);
    throw error;
  }
};

/**
 * Verifica el estado actual de la sesión con SAT
 * @returns {Promise<Object>} - Información del estado de la sesión
 */
export const verificarSesionSAT = async () => {
  try {
    const response = await axios.get(`${API_URL}/sat/sesion`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al verificar sesión SAT:', error);
    throw error;
  }
};

/**
 * Cierra la sesión actual con SAT
 * @returns {Promise<Object>} - Resultado de la operación de cierre de sesión
 */
export const cerrarSesionSAT = async () => {
  try {
    const response = await axios.post(`${API_URL}/sat/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al cerrar sesión SAT:', error);
    throw error;
  }
};

/**
 * Genera un recibo de donación electrónico
 * @param {string} donacionId - ID de la donación
 * @returns {Promise<Object>} - Datos del recibo generado
 */
export const generarReciboDonacion = async (donacionId) => {
  try {
    const response = await axios.post(`${API_URL}/${donacionId}/recibo`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al generar recibo de donación:', error);
    throw error;
  }
};
