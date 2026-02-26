import api from './api';

/**
 * Servicio para gestionar transacciones financieras (Libro Diario)
 */
export const transaccionesService = {
  /**
   * Obtener todas las transacciones con filtros
   * @param {Object} params - Parámetros de filtrado (tipo, categoria_id, fecha_inicio, fecha_fin, busqueda, page, limit)
   * @returns {Promise}
   */
  getTransacciones: (params = {}) => {
    return api.get('/bff/transacciones', { params });
  },

  /**
   * Obtener una transacción por ID
   * @param {string|number} id - ID de la transacción
   * @returns {Promise}
   */
  getTransaccionById: (id) => {
    return api.get(`/bff/transacciones/${id}`);
  },

  /**
   * Crear nueva transacción
   * @param {Object} data - Datos de la transacción
   * @returns {Promise}
   */
  createTransaccion: (data) => {
    return api.post('/bff/transacciones', data);
  },

  /**
   * Actualizar transacción existente
   * @param {string|number} id - ID de la transacción
   * @param {Object} data - Datos actualizados
   * @returns {Promise}
   */
  updateTransaccion: (id, data) => {
    return api.put(`/bff/transacciones/${id}`, data);
  },

  /**
   * Eliminar transacción (marcar como cancelada)
   * @param {string|number} id - ID de la transacción
   * @returns {Promise}
   */
  deleteTransaccion: (id) => {
    return api.delete(`/bff/transacciones/${id}`);
  },

  /**
   * Obtener resumen financiero
   * @param {Object} params - Parámetros (fecha_inicio, fecha_fin)
   * @returns {Promise}
   */
  getResumenFinanciero: (params = {}) => {
    return api.get('/bff/transacciones/resumen', { params });
  },

  /**
   * Obtener predicciones y sugerencias inteligentes
   * @returns {Promise}
   */
  getPredicciones: () => {
    return api.get('/bff/transacciones/predicciones');
  },

  /**
   * Obtener estadísticas del día actual
   * @returns {Promise}
   */
  getEstadisticasHoy: () => {
    return api.get('/bff/transacciones/estadisticas-hoy');
  },

  /**
   * Obtener categorías de transacciones
   * @param {Object} params - Parámetros de filtrado (tipo)
   * @returns {Promise}
   */
  getCategorias: (params = {}) => {
    return api.get('/bff/transacciones/categorias', { params });
  },

  /**
   * Exportar transacciones
   * @param {Object} params - Parámetros (fecha_inicio, fecha_fin, tipo)
   * @returns {Promise}
   */
  exportarTransacciones: (params = {}) => {
    return api.get('/bff/transacciones/exportar', { params });
  }
};

/**
 * Servicio para gestionar pagos programados y calendario de pagos
 */
export const pagosService = {
  /**
   * Obtener todos los pagos programados
   * @param {Object} params - Parámetros de filtrado (activo, frecuencia)
   * @returns {Promise}
   */
  getPagosProgramados: (params = {}) => {
    return api.get('/bff/pagos-programados', { params });
  },

  /**
   * Obtener un pago programado por ID
   * @param {string|number} id - ID del pago programado
   * @returns {Promise}
   */
  getPagoProgramadoById: (id) => {
    return api.get(`/bff/pagos-programados/${id}`);
  },

  /**
   * Crear pago programado
   * @param {Object} data - Datos del pago programado
   * @returns {Promise}
   */
  createPagoProgramado: (data) => {
    return api.post('/bff/pagos-programados', data);
  },

  /**
   * Actualizar pago programado
   * @param {string|number} id - ID del pago programado
   * @param {Object} data - Datos actualizados
   * @returns {Promise}
   */
  updatePagoProgramado: (id, data) => {
    return api.put(`/bff/pagos-programados/${id}`, data);
  },

  /**
   * Eliminar/Desactivar pago programado
   * @param {string|number} id - ID del pago programado
   * @param {boolean} permanente - Si es true, elimina permanentemente
   * @returns {Promise}
   */
  deletePagoProgramado: (id, permanente = false) => {
    return api.delete(`/bff/pagos-programados/${id}`, {
      params: { permanente }
    });
  },

  /**
   * Obtener instancias de pagos (calendario)
   * @param {Object} params - Parámetros de filtrado (fecha_inicio, fecha_fin, estado, pago_programado_id, page, limit)
   * @returns {Promise}
   */
  getInstanciasPagos: (params = {}) => {
    return api.get('/bff/pagos-programados/instancias', { params });
  },

  /**
   * Obtener pagos que requieren atención (próximos y atrasados)
   * @returns {Promise}
   */
  getPagosAtencion: () => {
    return api.get('/bff/pagos-programados/atencion');
  },

  /**
   * Marcar instancia de pago como pagada
   * @param {string|number} id - ID de la instancia de pago
   * @param {Object} data - Datos del pago (fecha_pago, monto_pagado, metodo_pago, etc.)
   * @returns {Promise}
   */
  marcarComoPagado: (id, data = {}) => {
    return api.post(`/bff/pagos-programados/instancia/${id}/pagar`, data);
  },

  /**
   * Cancelar instancia de pago
   * @param {string|number} id - ID de la instancia de pago
   * @param {Object} data - Datos de cancelación (motivo)
   * @returns {Promise}
   */
  cancelarInstanciaPago: (id, data = {}) => {
    return api.put(`/bff/pagos-programados/instancia/${id}/cancelar`, data);
  },

  /**
   * Generar instancias de pagos manualmente
   * @returns {Promise}
   */
  generarInstanciasPagos: () => {
    return api.post('/bff/pagos-programados/generar-instancias');
  },

  /**
   * Actualizar estados de pagos (atrasados, próximos)
   * @returns {Promise}
   */
  actualizarEstadosPagos: () => {
    return api.put('/bff/pagos-programados/actualizar-estados');
  }
};

/**
 * Servicio combinado de finanzas (exporta ambos servicios)
 */
export const finanzasService = {
  transacciones: transaccionesService,
  pagos: pagosService
};

export default finanzasService;
