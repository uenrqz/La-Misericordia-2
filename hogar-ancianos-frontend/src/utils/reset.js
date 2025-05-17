/**
 * Utilidad para limpiar tokens y redirigir correctamente
 */

export const resetAuth = () => {
  // Eliminar cualquier token y dato de usuario anterior
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirigir a la página de login
  window.location.href = '/login';
};

// Para usar en desarrollo, pegar en la consola del navegador:
// localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login';