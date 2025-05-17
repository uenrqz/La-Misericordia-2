/**
 * Utilidad de diagnóstico para verificar la conectividad con el backend
 * Ejecutar con: node src/utils/diagnostico.js
 */
const axios = require('axios');
require('dotenv').config();

// Configuración básica
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ENDPOINTS = [
  '/',                     // Ruta principal
  '/api/auth/validate',    // Validación de token
  '/api/residentes',       // Listado de residentes
  '/health'                // Estado del servicio (si existe)
];

// Colores para la salida en consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Verifica la conectividad con un endpoint
 * @param {string} endpoint - Ruta a verificar
 * @returns {Promise<void>}
 */
async function verificarEndpoint(endpoint) {
  const url = `${API_URL}${endpoint}`;
  console.log(`${colors.blue}Verificando: ${url}${colors.reset}`);
  
  try {
    const startTime = Date.now();
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: false // No lanzar error para códigos HTTP de error
    });
    const timeElapsed = Date.now() - startTime;
    
    
    const statusColor = response.status >= 200 && response.status < 300 
      ? colors.green 
      : response.status === 401 // Códigos 401 son esperados para rutas protegidas
        ? colors.cyan 
        : response.status >= 400 && response.status < 500 
          ? colors.yellow 
          : colors.red;
    
    console.log(`${statusColor}Status: ${response.status} - Tiempo: ${timeElapsed}ms${colors.reset}`);
    
    if (response.status >= 200 && response.status < 300) {
      console.log(`${colors.green}Respuesta: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...${colors.reset}`);
    } else if (response.status === 401) {
      console.log(`${colors.cyan}Respuesta esperada (ruta protegida): ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    } else if (response.status >= 400) {
      console.log(`${colors.yellow}Error: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}Error: ${error.code || error.message}${colors.reset}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`${colors.red}No se pudo conectar al servidor. Verifica que el backend esté en ejecución en ${API_URL}${colors.reset}`);
    } else if (error.code === 'ECONNABORTED') {
      console.log(`${colors.red}Tiempo de espera agotado al intentar conectar con ${url}${colors.reset}`);
    }
  }
  console.log('-'.repeat(50));
}

/**
 * Función principal de diagnóstico
 */
async function ejecutarDiagnostico() {
  console.log(`${colors.cyan}=== DIAGNÓSTICO DE CONECTIVIDAD BFF ====${colors.reset}`);
  console.log(`${colors.cyan}Fecha: ${new Date().toISOString()}${colors.reset}`);
  console.log(`${colors.cyan}Backend URL: ${API_URL}${colors.reset}`);
  console.log('-'.repeat(50));
  
  // Verificar todos los endpoints
  for (const endpoint of ENDPOINTS) {
    await verificarEndpoint(endpoint);
  }
  
  // Verificar credenciales de autenticación (versión simplificada)
  try {
    console.log(`${colors.blue}Intentando autenticación de prueba...${colors.reset}`);
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'test_user',
      password: 'test_password'
    }, { timeout: 5000, validateStatus: false });
    
    console.log(`${colors.yellow}Resultado de autenticación: ${response.status}${colors.reset}`);
    console.log(`${colors.yellow}Mensaje: ${JSON.stringify(response.data)}${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}Error en prueba de autenticación: ${error.message}${colors.reset}`);
  }
  
  console.log(`${colors.cyan}=== FIN DEL DIAGNÓSTICO ====${colors.reset}`);
}

// Ejecutar diagnóstico
ejecutarDiagnostico().catch(console.error);
