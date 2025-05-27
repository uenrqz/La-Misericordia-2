/**
 * Manejador de errores 500 para la aplicación La Misericordia 2
 * Este módulo proporciona herramientas para detectar, diagnosticar y recuperarse
 * de errores 500 (Internal Server Error) en la comunicación con el BFF y el backend.
 */

/**
 * Detecta y maneja errores 500 en las peticiones fetch
 * @param {string} url - URL de la solicitud
 * @param {object} options - Opciones de fetch
 * @returns {Promise<Response>} - Respuesta del fetch con manejo de errores
 */
export async function fetchWithErrorHandling(url, options = {}) {
  const maxRetries = options.maxRetries || 2;
  const retryDelay = options.retryDelay || 1000;
  let lastError;
  
  // Eliminar opciones personalizadas que no son estándar para fetch
  const fetchOptions = { ...options };
  delete fetchOptions.maxRetries;
  delete fetchOptions.retryDelay;
  
  // Asegurarse de que se manejen los errores de timeout
  if (!fetchOptions.signal && options.timeout) {
    const controller = new AbortController();
    fetchOptions.signal = controller.signal;
    setTimeout(() => controller.abort(), options.timeout);
  }
  
  // Intentar la solicitud con reintentos
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Intento ${attempt + 1}/${maxRetries + 1} para URL: ${url}`);
      const response = await fetch(url, fetchOptions);
      
      // Loguear información de la respuesta para diagnóstico
      console.log(`Respuesta recibida para ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      // Si hay un error 500, intentamos de nuevo después de un retraso
      if (response.status === 500) {
        console.warn(`Error 500 detectado en intento ${attempt + 1}/${maxRetries + 1}. URL: ${url}`);
        lastError = new Error(`Error del servidor (500) en ${url}`);
        lastError.response = response;
        
        // Si ya se intentó el máximo de veces, devolver el error
        if (attempt === maxRetries) {
          logError500(url, lastError);
          return response;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      
      // Para otros códigos devolvemos la respuesta directamente
      return response;
    } catch (error) {
      console.error(`Error en fetch (intento ${attempt + 1}/${maxRetries + 1}):`, error);
      lastError = error;
      
      // Información adicional sobre el error
      if (error.name === 'AbortError') {
        console.error('La solicitud fue abortada por timeout');
      } else if (error.message && error.message.includes('Failed to fetch')) {
        console.error('No se pudo conectar al servidor. Verifique que el servidor esté en ejecución.');
      }
      
      // Si es el último intento, registrar y propagar el error
      if (attempt === maxRetries) {
        logError500(url, error);
        
        // Mejorar el mensaje de error para el usuario
        const errorMsg = error.name === 'AbortError' 
          ? 'Tiempo de espera agotado' 
          : `Error de conexión: ${error.message}`;
        error.userMessage = errorMsg;
        throw error;
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
  
  // No deberíamos llegar aquí, pero por seguridad
  throw lastError;
}

/**
 * Registra información detallada sobre errores 500
 * @param {string} url - URL que generó el error
 * @param {Error} error - Error capturado
 */
function logError500(url, error) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    url,
    message: error.message || 'Error 500 sin mensaje',
    status: error.response?.status || 500,
    stack: error.stack,
    userAgent: navigator.userAgent
  };
  
  // Guardar para diagnóstico posterior
  const errors500 = JSON.parse(sessionStorage.getItem('errors500') || '[]');
  errors500.push(errorInfo);
  sessionStorage.setItem('errors500', JSON.stringify(errors500));
  
  // También registrarlo en la consola
  console.error('Error 500 registrado:', errorInfo);
  
  // Enviar al sistema de telemetría si existe
  if (window.telemetry && typeof window.telemetry.reportError === 'function') {
    window.telemetry.reportError('ERROR_500', errorInfo);
  }
  
  return errorInfo;
}

/**
 * Diagnóstica errores 500 recientes
 * @returns {object} Diagnóstico de errores 500
 */
export function diagnosticarErrores500() {
  const errors500 = JSON.parse(sessionStorage.getItem('errors500') || '[]');
  const ahora = new Date();
  
  // Filtrar errores de los últimos 30 minutos
  const erroresRecientes = errors500.filter(err => {
    const timestamp = new Date(err.timestamp);
    const minutosTranscurridos = (ahora - timestamp) / (1000 * 60);
    return minutosTranscurridos <= 30;
  });
  
  // Agrupar por URL
  const erroresPorUrl = erroresRecientes.reduce((acc, err) => {
    acc[err.url] = acc[err.url] || [];
    acc[err.url].push(err);
    return acc;
  }, {});
  
  // Diagnosticar patrones comunes
  const diagnostico = {
    totalErrores: erroresRecientes.length,
    urlsMasComunes: Object.keys(erroresPorUrl)
      .map(url => ({ url, count: erroresPorUrl[url].length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    posiblesCausas: [],
    recomendaciones: []
  };
  
  // Determinar posibles causas
  if (diagnostico.totalErrores > 5) {
    diagnostico.posiblesCausas.push('Múltiples errores 500 indican un problema persistente en el servidor');
    diagnostico.recomendaciones.push('Verificar los logs del BFF y del Backend');
  }
  
  if (Object.keys(erroresPorUrl).length === 1) {
    diagnostico.posiblesCausas.push('Los errores ocurren en una sola URL, posible problema en un endpoint específico');
    diagnostico.recomendaciones.push(`Revisar la implementación del endpoint: ${Object.keys(erroresPorUrl)[0]}`);
  }
  
  // Añadir recomendaciones generales
  diagnostico.recomendaciones.push(
    'Verificar la conectividad con el BFF',
    'Asegurar que el backend esté respondiendo correctamente',
    'Revisar la configuración de CORS',
    'Validar que el token de autenticación sea válido'
  );
  
  return diagnostico;
}

/**
 * Intenta recuperarse de errores 500
 * @returns {Promise<boolean>} True si la recuperación fue exitosa
 */
export async function recuperarDeErrores500() {
  console.log('Intentando recuperarse de errores 500...');
  
  try {
    // 1. Verificar conectividad con el BFF usando la ruta de estado
    console.log('Verificando conexión con el BFF...');
    const baseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:4000/api/bff' 
      : `${window.location.protocol}//${window.location.hostname}/api/bff`;
    
    console.log(`URL de verificación del BFF: ${baseUrl}/status`);
      
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    
    const bffCheck = await fetch(`${baseUrl}/status`, { 
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    if (!bffCheck.ok) {
      console.error('El BFF no está respondiendo correctamente');
      return false;
    }
    
    // 2. Verificar token de autenticación
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const baseUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:4000/api/bff' 
          : `${window.location.protocol}//${window.location.hostname}/api/bff`;
          
        const tokenCheck = await fetch(`${baseUrl}/auth/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const tokenStatus = await tokenCheck.json();
        
        if (!tokenStatus.authenticated) {
          console.warn('El token no es válido, redirigiendo a login...');
          // Limpiar datos de sesión
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Redireccionar a login
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return false;
        }
      } catch (error) {
        console.error('Error al verificar token:', error);
      }
    }
    
    // 3. Limpiar caché de errores
    sessionStorage.removeItem('errors500');
    
    console.log('Recuperación exitosa de errores 500');
    return true;
  } catch (error) {
    console.error('Error durante el intento de recuperación:', error);
    return false;
  }
}

// No necesitamos exportación por defecto ya que las funciones
// ya están siendo exportadas individualmente
// Esto soluciona el error de "Importing binding name 'default' cannot be resolved by star export entries"
