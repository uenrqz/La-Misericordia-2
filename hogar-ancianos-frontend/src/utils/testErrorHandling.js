/**
 * Utilidad para probar el manejo de errores en la aplicación La Misericordia 2.
 * Este script permite simular diferentes tipos de errores y verificar el comportamiento
 * del sistema ante ellos.
 */

// Función para simular un error 500
export function simularError500(endpoint = null) {
  console.log('[Test] Simulando error 500...');
  
  // Guardar la implementación original de fetch
  const originalFetch = window.fetch;
  
  // Reemplazar fetch con una versión que puede simular errores
  window.fetch = function(url, options) {
    // Si se especificó un endpoint específico y la URL lo contiene
    if (endpoint && url.includes(endpoint)) {
      console.log(`[Test] Simulando error 500 para: ${url}`);
      
      // Crear una respuesta simulada con código 500
      const mockResponse = new Response(
        JSON.stringify({
          error: 'Error interno del servidor simulado',
          message: 'Este es un error 500 simulado para pruebas'
        }), 
        { 
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      return Promise.resolve(mockResponse);
    }
    
    // Para cualquier otra URL, usar el fetch normal
    return originalFetch(url, options);
  };
  
  // Devolver una función para restaurar el fetch original
  return function restaurarFetch() {
    console.log('[Test] Restaurando comportamiento normal de fetch');
    window.fetch = originalFetch;
  };
}

// Función para simular un error 401 (no autorizado)
export function simularError401(endpoint = null) {
  console.log('[Test] Simulando error 401 (No autorizado)...');
  
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options) {
    // Si se especificó un endpoint específico y la URL lo contiene
    if (endpoint && url.includes(endpoint)) {
      console.log(`[Test] Simulando error 401 para: ${url}`);
      
      // Crear una respuesta simulada con código 401
      const mockResponse = new Response(
        JSON.stringify({
          error: 'No autorizado',
          message: 'Token inválido o expirado'
        }), 
        { 
          status: 401,
          statusText: 'Unauthorized',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      return Promise.resolve(mockResponse);
    }
    
    return originalFetch(url, options);
  };
  
  return function restaurarFetch() {
    window.fetch = originalFetch;
  };
}

// Función para simular desconexión de red
export function simularDesconexion() {
  console.log('[Test] Simulando desconexión de red...');
  
  const originalFetch = window.fetch;
  
  window.fetch = function() {
    return Promise.reject(new Error('Failed to fetch: Network error'));
  };
  
  return function restaurarConexion() {
    console.log('[Test] Restaurando conexión de red');
    window.fetch = originalFetch;
  };
}

// Función para simular latencia alta
export function simularLatenciaAlta(ms = 3000) {
  console.log(`[Test] Simulando latencia alta (${ms}ms)...`);
  
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options) {
    console.log(`[Test] Aplicando latencia de ${ms}ms a: ${url}`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        originalFetch(url, options).then(resolve);
      }, ms);
    });
  };
  
  return function restaurarVelocidad() {
    console.log('[Test] Restaurando velocidad normal');
    window.fetch = originalFetch;
  };
}

// Función para configurar un token expirado o inválido
export function simularTokenExpirado() {
  console.log('[Test] Simulando token expirado...');
  
  // Guardar el token actual
  const tokenOriginal = localStorage.getItem('token');
  
  // Reemplazar con un token inválido (formato JWT pero expirado)
  const tokenExpirado = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlVzdWFyaW8gZGUgUHJ1ZWJhIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  localStorage.setItem('token', tokenExpirado);
  
  return function restaurarToken() {
    console.log('[Test] Restaurando token original');
    if (tokenOriginal) {
      localStorage.setItem('token', tokenOriginal);
    } else {
      localStorage.removeItem('token');
    }
  };
}

// Función principal para ejecutar pruebas
export function ejecutarPruebasDeErrores() {
  console.log('=== INICIANDO PRUEBAS DE MANEJO DE ERRORES ===');
  
  // Mostrar instrucciones
  console.log(`
    Para probar el manejo de errores:
    
    1. Error 500:
       const restaurar500 = simularError500('/api/bff/residentes');
       // Navegar a la página que usa ese endpoint
       // Para restaurar: restaurar500();
    
    2. Error 401:
       const restaurar401 = simularError401('/api/bff/auth/verify');
       // Para restaurar: restaurar401();
    
    3. Desconexión de red:
       const restaurarRed = simularDesconexion();
       // Para restaurar: restaurarRed();
    
    4. Latencia alta:
       const restaurarLatencia = simularLatenciaAlta(5000);
       // Para restaurar: restaurarLatencia();
    
    5. Token expirado:
       const restaurarToken = simularTokenExpirado();
       // Para restaurar: restaurarToken();
  `);
  
  // Exportar funciones al objeto global window para pruebas desde consola
  window.errorTest = {
    simularError500,
    simularError401,
    simularDesconexion,
    simularLatenciaAlta,
    simularTokenExpirado
  };
  
  console.log('Funciones de prueba disponibles en "window.errorTest"');
}

// Eliminamos el export default para evitar conflictos con las exportaciones individuales
// Esto soluciona el error "Importing binding name 'default' cannot be resolved by star export entries"
