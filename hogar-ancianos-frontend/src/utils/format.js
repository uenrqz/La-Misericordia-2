/**
 * Utilidades para formatear números y monedas en formato guatemalteco
 */

/**
 * Formatea números para el formato monetario guatemalteco
 * @param {number} num - Número a formatear
 * @returns {string} Número formateado con separadores de miles y decimales
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Formatea un precio como moneda (GTQ)
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada como moneda
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Obtiene la fecha actual en formato español
 * @returns {string} Fecha actual formateada
 */
export const getCurrentDate = () => {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date().toLocaleDateString('es-GT', options);
};

/**
 * Formatea una fecha en formato español
 * @param {Date} date - Objeto fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDateEs = (date) => {
  if (!date || isNaN(date.getTime())) {
    return 'Fecha inválida';
  }
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('es-GT', options);
};

/**
 * Formatea una fecha para mostrar solo la fecha en formato español
 * @param {Date} date - Objeto fecha a formatear
 * @returns {string} Fecha formateada (solo fecha)
 */
export const formatShortDateEs = (date) => {
  if (!date || isNaN(date.getTime())) {
    return 'Fecha inválida';
  }
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('es-GT', options);
};