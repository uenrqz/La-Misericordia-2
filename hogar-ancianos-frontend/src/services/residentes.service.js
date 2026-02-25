import api from './api';

/**
 * Servicio para gestionar las operaciones con residentes en el frontend
 */
export const residentesService = {
  /**
   * Obtener todos los residentes
   * @param {Object} params - Parámetros de filtrado y paginación
   * @returns {Promise} - Promesa con la respuesta
   */
  getResidentes: (params = {}) => {
    return api.get('/bff/residentes', { params });
  },

  /**
   * Obtener un residente por su ID
   * @param {string|number} id - ID del residente
   * @returns {Promise} - Promesa con la respuesta
   */
  getResidenteById: (id) => {
    return api.get(`/bff/residentes/${id}`);
  },

  /**
   * Crear un nuevo residente
   * @param {Object} data - Datos del residente
   * @returns {Promise} - Promesa con la respuesta
   */
  createResidente: (data) => {
    return api.post('/bff/residentes', data);
  },

  /**
   * Actualizar un residente existente
   * @param {string|number} id - ID del residente
   * @param {Object} data - Datos actualizados del residente
   * @returns {Promise} - Promesa con la respuesta
   */
  updateResidente: (id, data) => {
    return api.put(`/bff/residentes/${id}`, data);
  },

  /**
   * Eliminar un residente
   * @param {string|number} id - ID del residente
   * @returns {Promise} - Promesa con la respuesta
   */
  deleteResidente: (id) => {
    return api.delete(`/bff/residentes/${id}`);
  },

  /**
   * Subir foto para un residente
   * @param {string|number} id - ID del residente
   * @param {File} file - Archivo de imagen
   * @returns {Promise} - Promesa con la respuesta
   */
  uploadResidentePhoto: (id, file) => {
    const formData = new FormData();
    formData.append('foto', file);
    
    return api.post(`/bff/residentes/${id}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Eliminar foto de un residente
   * @param {string|number} id - ID del residente
   * @returns {Promise} - Promesa con la respuesta
   */
  deleteResidentePhoto: (id) => {
    return api.delete(`/bff/residentes/${id}/foto`);
  }
};
