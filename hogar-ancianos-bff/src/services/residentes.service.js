const axios = require('axios');
const { API_URL } = require('../config/api.config');
const FormData = require('form-data');

/**
 * Servicio para gestionar las operaciones relacionadas con residentes
 */
class ResidentesService {
  /**
   * Obtener todos los residentes
   */
  async getResidentes(token, params = {}) {
    try {
      const response = await axios.get(`${API_URL}/residentes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Obtener un residente por su ID
   */
  async getResidenteById(token, id) {
    try {
      const response = await axios.get(`${API_URL}/residentes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Crear un nuevo residente
   */
  async createResidente(token, data) {
    try {
      const response = await axios.post(`${API_URL}/residentes`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Actualizar un residente existente
   */
  async updateResidente(token, id, data) {
    try {
      const response = await axios.put(`${API_URL}/residentes/${id}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Eliminar un residente
   */
  async deleteResidente(token, id) {
    try {
      const response = await axios.delete(`${API_URL}/residentes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Subir foto para un residente
   */
  async uploadResidentePhoto(token, id, photoFile) {
    try {
      // Crear un objeto FormData para enviar el archivo
      const formData = new FormData();
      formData.append('foto', photoFile.buffer, {
        filename: photoFile.originalname,
        contentType: photoFile.mimetype
      });

      // Configurar las cabeceras para incluir el token y el boundary del FormData
      const headers = {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      };

      // Enviar la solicitud
      const response = await axios.post(
        `${API_URL}/residentes/${id}/foto`,
        formData,
        { headers }
      );

      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Eliminar la foto de un residente
   */
  async deleteResidentePhoto(token, id) {
    try {
      const response = await axios.delete(`${API_URL}/residentes/${id}/foto`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Manejar errores de las peticiones
   */
  _handleError(error) {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      return {
        status: error.response.status,
        message: error.response.data.message || 'Error en la petición',
        error: error.response.data
      };
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      return {
        status: 503,
        message: 'El servicio no está disponible en este momento',
        error: 'No se recibió respuesta del servidor'
      };
    } else {
      // Algo ocurrió al configurar la petición que desencadenó un error
      return {
        status: 500,
        message: 'Error al procesar la petición',
        error: error.message
      };
    }
  }
}

module.exports = new ResidentesService();
