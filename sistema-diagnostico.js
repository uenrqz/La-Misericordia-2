#!/usr/bin/env node
/**
 * Script para diagnosticar el sistema completo (backend, BFF y frontend)
 * Ejecutar con: node sistema-diagnostico.js
 */
const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuración
const BACKEND_URL = 'http://localhost:3000';
const BFF_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:5173';

// Colores para la consola
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
 * Crea un interfaz de línea de comandos
 */
function crearInterfazCLI() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Verifica si un servidor está activo
 * @param {string} url - URL del servidor a verificar
 * @returns {Promise<boolean>} - true si está activo, false en caso contrario
 */
async function verificarServidor(url) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return response.status >= 200 && response.status < 500;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica los puertos en uso
 * @param {number} puerto - Número de puerto a verificar
 * @returns {Promise<boolean>} - true si está en uso, false en caso contrario
 */
function verificarPuerto(puerto) {
  try {
    const output = execSync(`lsof -i :${puerto} | grep LISTEN`).toString();
    return output.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Intenta iniciar un servidor si no está en ejecución
 * @param {string} tipo - Tipo de servidor (backend, bff, frontend)
 * @param {object} rl - Interfaz de línea de comandos
 */
async function iniciarServidor(tipo, rl) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}¿Desea iniciar el servidor ${tipo}? (s/n): ${colors.reset}`, async (respuesta) => {
      if (respuesta.toLowerCase() === 's') {
        console.log(`${colors.blue}Iniciando servidor ${tipo}...${colors.reset}`);
        
        let comando = '';
        let directorio = '';
        
        switch (tipo) {
          case 'backend':
            directorio = path.join(__dirname, 'hogar-ancianos-backend');
            comando = 'npm run dev';
            break;
          case 'bff':
            directorio = path.join(__dirname, 'hogar-ancianos-bff');
            comando = 'npm run dev';
            break;
          case 'frontend':
            directorio = path.join(__dirname, 'hogar-ancianos-frontend');
            comando = 'npm run dev';
            break;
        }
        
        try {
          console.log(`${colors.yellow}Ejecutando ${comando} en ${directorio}${colors.reset}`);
          // Iniciamos el proceso en una nueva terminal
          if (process.platform === 'darwin') { // macOS
            execSync(`osascript -e 'tell app "Terminal" to do script "cd ${directorio} && ${comando}"'`);
          } else if (process.platform === 'win32') { // Windows
            execSync(`start cmd.exe /K "cd /d ${directorio} && ${comando}"`);
          } else { // Linux
            execSync(`xterm -e "cd ${directorio} && ${comando}" &`);
          }
          
          console.log(`${colors.green}Servidor ${tipo} iniciado en una nueva terminal.${colors.reset}`);
        } catch (error) {
          console.error(`${colors.red}Error al iniciar el servidor ${tipo}: ${error.message}${colors.reset}`);
        }
      }
      resolve();
    });
  });
}

/**
 * Prueba la comunicación entre componentes
 */
async function probarComunicacion() {
  console.log(`${colors.blue}Probando comunicación entre componentes...${colors.reset}`);
  
  // Probar comunicación del BFF con el backend
  console.log(`${colors.yellow}Verificando comunicación del BFF con el backend...${colors.reset}`);
  
  try {
    const response = await axios.get(`${BFF_URL}/health`, { timeout: 5000 });
    console.log(`${colors.green}BFF responde con estado: ${response.status}${colors.reset}`);
    console.log(`${colors.green}Respuesta: ${JSON.stringify(response.data)}${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}Error al comunicarse con el BFF: ${error.message}${colors.reset}`);
  }
  
  // Intentar autenticación a través del BFF
  console.log(`\n${colors.yellow}Probando autenticación a través del BFF...${colors.reset}`);
  
  try {
    const response = await axios.post(`${BFF_URL}/api/bff/auth/login`, {
      username: 'admin',
      password: 'admin123'
    }, { timeout: 5000 });
    
    console.log(`${colors.green}Autenticación exitosa: ${response.status}${colors.reset}`);
    if (response.data && response.data.token) {
      console.log(`${colors.green}Token recibido de longitud: ${response.data.token.length}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}Error al autenticar: ${error.message}${colors.reset}`);
    if (error.response) {
      console.log(`${colors.red}Respuesta del servidor: ${JSON.stringify(error.response.data)}${colors.reset}`);
    }
  }
}

/**
 * Verificar configuración de CORS
 */
function verificarCORS() {
  console.log(`${colors.blue}Verificando configuración de CORS...${colors.reset}`);
  
  // Backend
  const backendAppPath = path.join(__dirname, 'hogar-ancianos-backend', 'app.js');
  if (fs.existsSync(backendAppPath)) {
    const backendCode = fs.readFileSync(backendAppPath, 'utf8');
    const tieneCORS = backendCode.includes('cors()') || backendCode.includes('cors(');
    
    console.log(`${tieneCORS ? colors.green : colors.red}Backend: CORS ${tieneCORS ? 'habilitado' : 'no detectado'}${colors.reset}`);
  }
  
  // BFF
  const bffAppPath = path.join(__dirname, 'hogar-ancianos-bff', 'src', 'app.js');
  if (fs.existsSync(bffAppPath)) {
    const bffCode = fs.readFileSync(bffAppPath, 'utf8');
    const tieneCORS = bffCode.includes('cors()') || bffCode.includes('cors(');
    
    console.log(`${tieneCORS ? colors.green : colors.red}BFF: CORS ${tieneCORS ? 'habilitado' : 'no detectado'}${colors.reset}`);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.cyan}=== DIAGNÓSTICO DEL SISTEMA LA MISERICORDIA ====${colors.reset}`);
  console.log(`${colors.cyan}Fecha: ${new Date().toISOString()}${colors.reset}`);
  
  const rl = crearInterfazCLI();
  
  // Verificar servidores
  console.log(`${colors.blue}Verificando servidores...${colors.reset}`);
  
  // Backend
  const backendActivo = await verificarServidor(BACKEND_URL);
  console.log(`${backendActivo ? colors.green : colors.red}Backend (${BACKEND_URL}): ${backendActivo ? 'ACTIVO' : 'INACTIVO'}${colors.reset}`);
  
  if (!backendActivo) {
    const backendPuertoUsado = verificarPuerto(3000);
    if (backendPuertoUsado) {
      console.log(`${colors.yellow}El puerto 3000 está en uso, pero el servidor no responde.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}El puerto 3000 está disponible, el servidor no está en ejecución.${colors.reset}`);
      await iniciarServidor('backend', rl);
    }
  }
  
  // BFF
  const bffActivo = await verificarServidor(BFF_URL);
  console.log(`${bffActivo ? colors.green : colors.red}BFF (${BFF_URL}): ${bffActivo ? 'ACTIVO' : 'INACTIVO'}${colors.reset}`);
  
  if (!bffActivo) {
    const bffPuertoUsado = verificarPuerto(4000);
    if (bffPuertoUsado) {
      console.log(`${colors.yellow}El puerto 4000 está en uso, pero el servidor no responde.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}El puerto 4000 está disponible, el servidor no está en ejecución.${colors.reset}`);
      await iniciarServidor('bff', rl);
    }
  }
  
  // Frontend
  const frontendActivo = await verificarServidor(FRONTEND_URL);
  console.log(`${frontendActivo ? colors.green : colors.red}Frontend (${FRONTEND_URL}): ${frontendActivo ? 'ACTIVO' : 'INACTIVO'}${colors.reset}`);
  
  if (!frontendActivo) {
    const frontendPuertoUsado = verificarPuerto(5173);
    if (frontendPuertoUsado) {
      console.log(`${colors.yellow}El puerto 5173 está en uso, pero el servidor no responde.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}El puerto 5173 está disponible, el servidor no está en ejecución.${colors.reset}`);
      await iniciarServidor('frontend', rl);
    }
  }
  
  console.log('-'.repeat(50));
  
  // Verificar CORS
  verificarCORS();
  console.log('-'.repeat(50));
  
  // Probar comunicación si todos los componentes están activos
  if (backendActivo && bffActivo) {
    await probarComunicacion();
  } else {
    console.log(`${colors.yellow}No se puede probar la comunicación porque uno o más componentes están inactivos.${colors.reset}`);
  }
  
  console.log('-'.repeat(50));
  console.log(`${colors.cyan}=== DIAGNÓSTICO COMPLETADO ====${colors.reset}`);
  
  // Sugerencias
  console.log(`\n${colors.magenta}Recomendaciones:${colors.reset}`);
  console.log(`${colors.magenta}1. Si el backend no responde, verifica la conexión a la base de datos.${colors.reset}`);
  console.log(`${colors.magenta}2. Si el BFF no puede comunicarse con el backend, revisa la configuración de URL en el .env del BFF.${colors.reset}`);
  console.log(`${colors.magenta}3. Para solucionar errores 502, verifica timeouts y asegúrate que todas las rutas existan.${colors.reset}`);
  console.log(`${colors.magenta}4. Si hay problemas de CORS, verifica la configuración en ambos servidores.${colors.reset}`);
  
  rl.close();
}

main().catch(console.error);
