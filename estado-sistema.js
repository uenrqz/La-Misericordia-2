/**
 * La Misericordia 2 - Script de resumen del sistema
 * Este script muestra un resumen del estado actual del sistema, verificando
 * la conectividad entre los componentes, mostrando recursos y estados.
 */

const http = require('http');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Configuración de servicios
const services = [
  { name: 'Backend', url: 'http://localhost:3000/api/status', port: 3000 },
  { name: 'BFF', url: 'http://localhost:4000/api/bff/status', port: 4000 },
  { name: 'Frontend', url: 'http://localhost:5174', port: 5174 }
];

// Mensaje de bienvenida
console.log(`${colors.magenta}===============================================${colors.reset}`);
console.log(`${colors.cyan}       SISTEMA LA MISERICORDIA 2 - RESUMEN${colors.reset}`);
console.log(`${colors.cyan}       ${new Date().toLocaleString()}${colors.reset}`);
console.log(`${colors.magenta}===============================================${colors.reset}`);

async function checkServiceStatus(service) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(service.url, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return { 
      status: response.ok ? 'online' : 'error',
      statusCode: response.status,
      ok: response.ok
    };
  } catch (error) {
    return { 
      status: 'offline', 
      error: error.message,
      ok: false
    };
  }
}

async function getProcessInfo() {
  try {
    const { stdout } = await exec('ps aux | grep -E "node|npm" | grep -v grep');
    return stdout.trim().split('\n');
  } catch (error) {
    return [];
  }
}

async function checkSystem() {
  console.log(`\n${colors.blue}Verificando estado de los servicios...${colors.reset}`);
  
  // Verificar servicios
  for (const service of services) {
    process.stdout.write(`  - ${service.name}: `);
    const status = await checkServiceStatus(service);
    
    if (status.ok) {
      console.log(`${colors.green}ONLINE${colors.reset}`);
    } else if (status.statusCode) {
      console.log(`${colors.yellow}ERROR (${status.statusCode})${colors.reset}`);
    } else {
      console.log(`${colors.red}OFFLINE${colors.reset}`);
    }
  }
  
  // Mostrar procesos en ejecución
  console.log(`\n${colors.blue}Procesos Node.js en ejecución:${colors.reset}`);
  const processes = await getProcessInfo();
  
  if (processes.length === 0) {
    console.log(`  ${colors.yellow}No se encontraron procesos Node.js en ejecución${colors.reset}`);
  } else {
    processes.forEach(proc => {
      // Extraer información relevante del proceso
      const parts = proc.split(/\s+/);
      const user = parts[0];
      const pid = parts[1];
      const cpu = parts[2];
      const mem = parts[3];
      const command = parts.slice(10).join(' ');
      
      const serviceType = 
        command.includes('backend') ? 'Backend' :
        command.includes('bff') ? 'BFF' :
        command.includes('frontend') || command.includes('vite') ? 'Frontend' : 'Otro';
      
      const colorByType = {
        'Backend': colors.green,
        'BFF': colors.cyan,
        'Frontend': colors.magenta,
        'Otro': colors.yellow
      };
      
      console.log(`  ${colorByType[serviceType]}[${serviceType}]${colors.reset} PID:${pid} CPU:${cpu}% MEM:${mem}% CMD: ${command.substring(0, 60)}${command.length > 60 ? '...' : ''}`);
    });
  }
  
  // Información de puertos
  console.log(`\n${colors.blue}Puertos en uso:${colors.reset}`);
  
  try {
    const { stdout } = await exec('lsof -i -P -n | grep LISTEN');
    const ports = stdout.trim().split('\n')
      .filter(line => services.some(s => line.includes(`:${s.port}`)));
    
    if (ports.length === 0) {
      console.log(`  ${colors.yellow}No se encontraron puertos de la aplicación en uso${colors.reset}`);
    } else {
      ports.forEach(port => {
        const parts = port.split(/\s+/);
        const process = parts[0];
        const pid = parts[1];
        const portInfo = parts[8];
        
        const serviceInfo = services.find(s => portInfo.includes(`:${s.port}`));
        const serviceName = serviceInfo ? serviceInfo.name : "Desconocido";
        
        console.log(`  ${colors.green}${serviceName}${colors.reset}: ${process} (PID:${pid}) - ${portInfo}`);
      });
    }
  } catch (error) {
    console.log(`  ${colors.red}Error al verificar puertos: ${error.message}${colors.reset}`);
  }
  
  // Probar conexión entre BFF y backend
  console.log(`\n${colors.blue}Probando conexión entre servicios:${colors.reset}`);
  
  try {
    const response = await fetch('http://localhost:4000/api/bff/status');
    const data = await response.json();
    
    if (data.status === "online") {
      console.log(`  ${colors.green}✓ BFF -> Backend: Conexión establecida${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ BFF -> Backend: Error de conexión${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ BFF -> Backend: No se pudo conectar (${error.message})${colors.reset}`);
  }
  
  // Verificar autenticación de prueba
  console.log(`\n${colors.blue}Probando autenticación:${colors.reset}`);
  
  try {
    const loginResponse = await fetch('http://localhost:4000/api/bff/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log(`  ${colors.green}✓ Autenticación exitosa${colors.reset}`);
      
      // Verificar el token
      if (loginData.token) {
        const verifyResponse = await fetch('http://localhost:4000/api/bff/auth/verify', {
          headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        
        if (verifyResponse.ok) {
          console.log(`  ${colors.green}✓ Verificación de token exitosa${colors.reset}`);
        } else {
          console.log(`  ${colors.red}✗ Verificación de token falló${colors.reset}`);
        }
      }
    } else {
      console.log(`  ${colors.red}✗ Autenticación falló (${loginResponse.status})${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error al probar autenticación: ${error.message}${colors.reset}`);
  }
  
  // Información de acceso al sistema
  console.log(`\n${colors.cyan}Accesos al Sistema:${colors.reset}`);
  console.log(`  → Frontend: ${colors.green}http://localhost:5174${colors.reset}`);
  console.log(`  → BFF API:  ${colors.green}http://localhost:4000/api/bff${colors.reset}`);
  console.log(`  → Backend:  ${colors.green}http://localhost:3000/api${colors.reset}`);
  
  console.log(`\n${colors.cyan}Acceso al sistema:${colors.reset}`);
  console.log(`  → Use las credenciales proporcionadas por el administrador del sistema`);
  
  console.log(`\n${colors.magenta}===============================================${colors.reset}`);
  console.log(`  Para iniciar el sistema completo, ejecute: ${colors.yellow}node iniciar-sistema.js${colors.reset}`);
  console.log(`${colors.magenta}===============================================${colors.reset}`);
}

// Ejecutar el chequeo
checkSystem().catch(error => {
  console.error(`${colors.red}Error al verificar el sistema: ${error.message}${colors.reset}`);
});
