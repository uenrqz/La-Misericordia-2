/**
 * Utilidad de diagnóstico para verificar el estado del backend
 * Ejecutar con: node src/utils/diagnostico-servidor.js
 */
require('dotenv').config();
const os = require('os');
const fs = require('fs');
const path = require('path');

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
 * Imprime información del sistema
 */
function imprimirInfoSistema() {
  console.log(`${colors.cyan}=== DIAGNÓSTICO DEL SERVIDOR BACKEND ====${colors.reset}`);
  console.log(`${colors.cyan}Fecha: ${new Date().toISOString()}${colors.reset}`);
  
  // Información del sistema
  console.log(`${colors.blue}Sistema operativo: ${os.type()} ${os.release()}${colors.reset}`);
  console.log(`${colors.blue}Arquitectura: ${os.arch()}${colors.reset}`);
  console.log(`${colors.blue}Memoria total: ${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB${colors.reset}`);
  console.log(`${colors.blue}Memoria libre: ${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB${colors.reset}`);
  console.log(`${colors.blue}Tiempo de actividad: ${Math.round(os.uptime() / 3600)} horas${colors.reset}`);
  
  // Variables de entorno importantes
  console.log(`\n${colors.yellow}Variables de entorno:${colors.reset}`);
  console.log(`${colors.yellow}NODE_ENV: ${process.env.NODE_ENV || 'no definido'}${colors.reset}`);
  console.log(`${colors.yellow}PORT: ${process.env.PORT || '3000 (predeterminado)'}${colors.reset}`);
  console.log(`${colors.yellow}JWT_SECRET: ${process.env.JWT_SECRET ? 'configurado' : 'no definido'}${colors.reset}`);
  console.log(`${colors.yellow}DATABASE_URL: ${process.env.DATABASE_URL ? 'configurado' : 'no definido'}${colors.reset}`);
  
  console.log('-'.repeat(50));
}

/**
 * Verifica la conexión a la base de datos
 */
async function verificarBaseDatos() {
  console.log(`${colors.blue}Verificando conexión a la base de datos...${colors.reset}`);
  
  try {
    // Importamos el cliente de base de datos
    const db = require('../config/db');
    
    // Realizar una consulta simple para verificar la conexión
    const startTime = Date.now();
    const result = await db.query('SELECT NOW() as now');
    const timeElapsed = Date.now() - startTime;
    
    console.log(`${colors.green}Conexión exitosa a la base de datos${colors.reset}`);
    console.log(`${colors.green}Tiempo de respuesta: ${timeElapsed}ms${colors.reset}`);
    console.log(`${colors.green}Hora del servidor DB: ${result.rows[0].now}${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}Error al conectar a la base de datos: ${error.message}${colors.reset}`);
    if (error.code) {
      console.log(`${colors.red}Código de error: ${error.code}${colors.reset}`);
    }
  }
  
  console.log('-'.repeat(50));
}

/**
 * Verifica las rutas configuradas
 */
function verificarRutas() {
  console.log(`${colors.blue}Verificando rutas configuradas...${colors.reset}`);
  
  try {
    // Rutas que deberían estar configuradas
    const rutasEsperadas = [
      '/api/auth/login',
      '/api/auth/validate',
      '/api/residentes',
      '/api/donaciones',
      '/api/usuarios'
    ];
    
    // Verificamos las rutas en app.js
    const appPath = path.join(__dirname, '../../app.js');
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    let rutasDisponibles = [];
    
    rutasEsperadas.forEach(ruta => {
      const disponible = appContent.includes(ruta.split('/')[2]);
      rutasDisponibles.push({
        ruta,
        disponible
      });
    });
    
    // Mostrar resultados
    rutasDisponibles.forEach(({ ruta, disponible }) => {
      console.log(`${disponible ? colors.green : colors.red}${ruta}: ${disponible ? 'Configurada' : 'No encontrada'}${colors.reset}`);
    });
    
  } catch (error) {
    console.log(`${colors.red}Error al verificar rutas: ${error.message}${colors.reset}`);
  }
  
  console.log('-'.repeat(50));
}

/**
 * Verificar puertos abiertos
 */
function verificarPuertos() {
  console.log(`${colors.blue}Verificando puerto de escucha...${colors.reset}`);
  
  const puerto = process.env.PORT || 3000;
  
  console.log(`${colors.yellow}El servidor debería estar escuchando en el puerto: ${puerto}${colors.reset}`);
  console.log(`${colors.yellow}URL completa: http://localhost:${puerto}${colors.reset}`);
  
  // Verificar si hay algo más escuchando en ese puerto
  const { execSync } = require('child_process');
  
  try {
    // Comando para listar procesos escuchando en el puerto (funciona en Linux/Mac)
    const output = execSync(`lsof -i :${puerto} | grep LISTEN`).toString();
    
    if (output) {
      console.log(`${colors.red}Advertencia: Ya hay un proceso escuchando en el puerto ${puerto}:${colors.reset}`);
      console.log(output);
    } else {
      console.log(`${colors.green}El puerto ${puerto} está disponible.${colors.reset}`);
    }
  } catch (error) {
    // Si no hay procesos escuchando, lsof devuelve un código de error
    console.log(`${colors.green}El puerto ${puerto} está disponible.${colors.reset}`);
  }
  
  console.log('-'.repeat(50));
}

/**
 * Función principal de diagnóstico
 */
async function ejecutarDiagnostico() {
  imprimirInfoSistema();
  await verificarBaseDatos();
  verificarRutas();
  verificarPuertos();
  
  console.log(`${colors.cyan}=== FIN DEL DIAGNÓSTICO DEL SERVIDOR ====${colors.reset}`);
  
  console.log(`\n${colors.magenta}Recomendaciones:${colors.reset}`);
  console.log(`${colors.magenta}1. Si hay errores de conexión a la base de datos, verifica las credenciales en el archivo .env${colors.reset}`);
  console.log(`${colors.magenta}2. Si faltan rutas, verifica que estén correctamente importadas en app.js${colors.reset}`);
  console.log(`${colors.magenta}3. Si el puerto está ocupado, cierra la aplicación que lo está usando o cambia el puerto en .env${colors.reset}`);
  console.log(`${colors.magenta}4. Para probar el servidor externamente, asegúrate que no haya un firewall bloqueando las conexiones${colors.reset}`);
}

// Ejecutar el diagnóstico
ejecutarDiagnostico().catch(console.error);
