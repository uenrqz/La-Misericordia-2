/**
 * Script para depurar y diagnosticar problemas con el frontend en modo producción
 * Este script verifica el estado del frontend y ofrece soluciones para problemas comunes
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const http = require('http');
const open = require('open');

// Variables de configuración
const FRONTEND_PORT = 5174;
const FRONTEND_DIR = path.join(__dirname, 'hogar-ancianos-frontend');
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');

// Colores para la consola
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.blue}==================================================${colors.reset}`);
  console.log(`${colors.cyan}  DIAGNÓSTICO DEL FRONTEND EN MODO PRODUCCIÓN${colors.reset}`);
  console.log(`${colors.blue}==================================================${colors.reset}`);
  
  // Paso 1: Verificar si existe el directorio del frontend
  if (!fs.existsSync(FRONTEND_DIR)) {
    console.log(`${colors.red}[ERROR] No se encontró el directorio del frontend: ${FRONTEND_DIR}${colors.reset}`);
    process.exit(1);
  }
  console.log(`${colors.green}✓ Directorio del frontend encontrado${colors.reset}`);
  
  // Paso 2: Verificar la configuración de Vite
  const viteConfigPath = path.join(FRONTEND_DIR, 'vite.config.js');
  if (!fs.existsSync(viteConfigPath)) {
    console.log(`${colors.red}[ERROR] No se encontró el archivo de configuración de Vite: ${viteConfigPath}${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ Archivo de configuración de Vite encontrado${colors.reset}`);
  console.log(`${colors.blue}[INFO] Contenido de vite.config.js:${colors.reset}`);
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  console.log(viteConfig);
  
  // Paso 3: Verificar las variables de entorno
  const envProdPath = path.join(FRONTEND_DIR, '.env.production');
  if (fs.existsSync(envProdPath)) {
    console.log(`${colors.green}✓ Archivo .env.production encontrado${colors.reset}`);
    console.log(`${colors.blue}[INFO] Contenido de .env.production:${colors.reset}`);
    const envProd = fs.readFileSync(envProdPath, 'utf8');
    console.log(envProd);
  } else {
    console.log(`${colors.yellow}[AVISO] No se encontró el archivo .env.production${colors.reset}`);
  }
  
  // Paso 4: Verificar el package.json y los scripts
  const packageJsonPath = path.join(FRONTEND_DIR, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`${colors.red}[ERROR] No se encontró el archivo package.json: ${packageJsonPath}${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ Archivo package.json encontrado${colors.reset}`);
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`${colors.blue}[INFO] Scripts disponibles:${colors.reset}`);
  console.log(packageJson.scripts);
  
  // Paso 5: Verificar si existe el directorio dist (compilación previa)
  if (fs.existsSync(DIST_DIR)) {
    console.log(`${colors.green}✓ Directorio dist encontrado${colors.reset}`);
    console.log(`${colors.blue}[INFO] Contenido del directorio dist:${colors.reset}`);
    const distFiles = fs.readdirSync(DIST_DIR);
    console.log(distFiles);
  } else {
    console.log(`${colors.yellow}[AVISO] No se encontró el directorio dist. Necesita compilar primero.${colors.reset}`);
    
    // Intentar compilar
    console.log(`${colors.blue}[INFO] Ejecutando compilación...${colors.reset}`);
    try {
      execSync('npm run build', { cwd: FRONTEND_DIR, stdio: 'inherit' });
      console.log(`${colors.green}✓ Compilación exitosa${colors.reset}`);
      
      // Verificar que ahora dist existe
      if (fs.existsSync(DIST_DIR)) {
        console.log(`${colors.green}✓ Directorio dist creado correctamente${colors.reset}`);
        const distFiles = fs.readdirSync(DIST_DIR);
        console.log(`${colors.blue}[INFO] Contenido del directorio dist:${colors.reset}`);
        console.log(distFiles);
      } else {
        console.log(`${colors.red}[ERROR] La compilación no generó el directorio dist${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}[ERROR] Error durante la compilación:${colors.reset}`);
      console.error(error);
      process.exit(1);
    }
  }
  
  // Paso 6: Verificar si el puerto está en uso
  console.log(`${colors.blue}[INFO] Verificando si el puerto ${FRONTEND_PORT} está en uso...${colors.reset}`);
  const isPortFree = await checkPort(FRONTEND_PORT);
  if (!isPortFree) {
    console.log(`${colors.yellow}[AVISO] El puerto ${FRONTEND_PORT} ya está en uso.${colors.reset}`);
    console.log(`${colors.blue}[INFO] Intentando liberar el puerto...${colors.reset}`);
    
    try {
      if (process.platform === 'win32') {
        const result = execSync(`netstat -ano | findstr :${FRONTEND_PORT}`).toString();
        const pid = result.split(/\s+/).filter(Boolean).pop();
        execSync(`taskkill /F /PID ${pid}`);
      } else {
        execSync(`lsof -t -i:${FRONTEND_PORT} | xargs kill -9`);
      }
      console.log(`${colors.green}✓ Puerto ${FRONTEND_PORT} liberado${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}[AVISO] No se pudo liberar el puerto. Continuando de todos modos...${colors.reset}`);
    }
  } else {
    console.log(`${colors.green}✓ El puerto ${FRONTEND_PORT} está disponible${colors.reset}`);
  }
  
  // Paso 7: Iniciar el servidor en modo preview con configuración específica
  console.log(`${colors.blue}[INFO] Iniciando servidor en modo preview...${colors.reset}`);
  
  const previewProcess = spawn('npm', ['run', 'preview', '--', '--port', FRONTEND_PORT, '--host'], {
    cwd: FRONTEND_DIR,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe']
  });
  
  let serverStarted = false;
  
  previewProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`${colors.blue}[PREVIEW] ${colors.reset}${output}`);
    
    // Detectar si el servidor se ha iniciado correctamente
    if (output.includes('Local:') || output.includes('ready in')) {
      serverStarted = true;
      
      // Intentar abrir el navegador
      const url = `http://localhost:${FRONTEND_PORT}`;
      console.log(`${colors.green}[SUCCESS] Servidor iniciado en ${url}${colors.reset}`);
      console.log(`${colors.blue}[INFO] Intentando abrir el navegador...${colors.reset}`);
      
      try {
        open(url);
      } catch (error) {
        console.log(`${colors.yellow}[AVISO] No se pudo abrir el navegador automáticamente${colors.reset}`);
        console.log(`${colors.blue}[INFO] Por favor, abra manualmente: ${url}${colors.reset}`);
      }
    }
  });
  
  previewProcess.stderr.on('data', (data) => {
    console.log(`${colors.yellow}[PREVIEW ERROR] ${colors.reset}${data.toString()}`);
  });
  
  previewProcess.on('error', (error) => {
    console.log(`${colors.red}[ERROR] Error al iniciar el servidor: ${error.message}${colors.reset}`);
    process.exit(1);
  });
  
  previewProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}[ERROR] El servidor se cerró con código ${code}${colors.reset}`);
      process.exit(code);
    }
  });
  
  // Verificar periodicamente si el servidor está disponible
  let checkCount = 0;
  const checkInterval = setInterval(async () => {
    checkCount++;
    
    if (serverStarted) {
      clearInterval(checkInterval);
      return;
    }
    
    if (checkCount > 20) {
      console.log(`${colors.red}[ERROR] Tiempo de espera agotado para iniciar el servidor${colors.reset}`);
      clearInterval(checkInterval);
      previewProcess.kill();
      process.exit(1);
    }
    
    const isServerRunning = await checkServer(FRONTEND_PORT);
    if (isServerRunning) {
      serverStarted = true;
      const url = `http://localhost:${FRONTEND_PORT}`;
      console.log(`${colors.green}[SUCCESS] Servidor detectado en ${url}${colors.reset}`);
      clearInterval(checkInterval);
      
      // Intentar abrir el navegador
      try {
        open(url);
      } catch (error) {
        console.log(`${colors.yellow}[AVISO] No se pudo abrir el navegador automáticamente${colors.reset}`);
        console.log(`${colors.blue}[INFO] Por favor, abra manualmente: ${url}${colors.reset}`);
      }
    }
  }, 1000);
  
  // Manejar cierre del proceso
  process.on('SIGINT', () => {
    console.log(`${colors.blue}[INFO] Cerrando servidor...${colors.reset}`);
    clearInterval(checkInterval);
    if (previewProcess) {
      previewProcess.kill();
    }
    process.exit(0);
  });
}

/**
 * Verifica si un puerto está en uso
 * @param {number} port - El puerto a verificar
 * @returns {Promise<boolean>} - True si está libre, false si está en uso
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.on('error', () => {
      resolve(false);
    });
    server.on('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

/**
 * Verifica si un servidor está ejecutándose en el puerto especificado
 * @param {number} port - El puerto a verificar
 * @returns {Promise<boolean>} - True si el servidor está respondiendo
 */
function checkServer(port) {
  return new Promise((resolve) => {
    const req = http.request({
      method: 'GET',
      hostname: 'localhost',
      port: port,
      path: '/',
      timeout: 1000
    }, (res) => {
      resolve(res.statusCode < 400);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Iniciar el script
main().catch(error => {
  console.error(`${colors.red}[ERROR FATAL] ${error.message}${colors.reset}`);
  process.exit(1);
});
