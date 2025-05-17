/**
 * Utilidad para gestionar el puerto de la aplicación frontend
 * Verifica si el puerto está ocupado y lo libera si es necesario
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual con módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Puerto preferido para la aplicación
export const PREFERRED_PORT = 5174;

/**
 * Verifica si un puerto está en uso
 * @param {number} port - El puerto a verificar
 * @returns {Promise<boolean>} - True si el puerto está ocupado, false si está libre
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    let command = '';
    
    // Comando dependiendo del sistema operativo
    if (process.platform === 'win32') {
      command = `netstat -ano | find ":${port}"`;
    } else {
      command = `lsof -i:${port} | grep LISTEN`;
    }

    exec(command, (error, stdout) => {
      resolve(!!stdout); // Si hay salida, el puerto está en uso
    });
  });
}

/**
 * Obtiene el PID (ID del proceso) que está usando un puerto específico
 * @param {number} port - El puerto cuyo PID queremos obtener
 * @returns {Promise<number|null>} - El PID si se encontró, null si no
 */
function getProcessIdByPort(port) {
  return new Promise((resolve) => {
    let command = '';
    
    // Comando dependiendo del sistema operativo
    if (process.platform === 'win32') {
      command = `netstat -ano | find ":${port}"`;
      exec(command, (error, stdout) => {
        if (stdout) {
          // En Windows, el PID es el último número en cada línea
          const lines = stdout.split('\n');
          for (const line of lines) {
            if (line) {
              const parts = line.trim().split(/\s+/);
              if (parts.length > 4) {
                resolve(parseInt(parts[parts.length - 1], 10));
                return;
              }
            }
          }
        }
        resolve(null);
      });
    } else {
      // En macOS/Linux
      command = `lsof -i:${port} -t`;
      exec(command, (error, stdout) => {
        if (stdout) {
          resolve(parseInt(stdout.trim(), 10));
        } else {
          resolve(null);
        }
      });
    }
  });
}

/**
 * Mata el proceso que está usando un puerto específico
 * @param {number} pid - El ID del proceso a terminar
 * @returns {Promise<boolean>} - True si se terminó con éxito, false si no
 */
function killProcess(pid) {
  return new Promise((resolve) => {
    const killCommand = process.platform === 'win32' ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
    
    exec(killCommand, (error) => {
      resolve(!error);
    });
  });
}

/**
 * Asegura que el puerto preferido esté disponible
 * @returns {Promise<number>} - El puerto que estará disponible
 */
export async function ensurePortAvailable() {
  console.log(`Verificando disponibilidad del puerto ${PREFERRED_PORT}...`);
  
  const isInUse = await isPortInUse(PREFERRED_PORT);
  
  if (isInUse) {
    console.log(`Puerto ${PREFERRED_PORT} está ocupado`);
    const pid = await getProcessIdByPort(PREFERRED_PORT);
    
    if (pid) {
      console.log(`Intentando liberar el puerto ${PREFERRED_PORT} (PID: ${pid})...`);
      const killed = await killProcess(pid);
      
      if (killed) {
        console.log(`Puerto ${PREFERRED_PORT} liberado con éxito`);
      } else {
        console.log(`No se pudo liberar el puerto ${PREFERRED_PORT}`);
        return 0; // Retornar 0 para que Vite use un puerto aleatorio disponible
      }
    }
  } else {
    console.log(`Puerto ${PREFERRED_PORT} está disponible`);
  }
  
  return PREFERRED_PORT;
}

/**
 * Guarda el puerto actual en un archivo de configuración
 * @param {number} port - El puerto a guardar
 */
export function saveCurrentPort(port) {
  const configPath = path.join(__dirname, '..', '..', '.port-config.json');
  fs.writeFileSync(configPath, JSON.stringify({ port }), 'utf8');
  console.log(`Puerto ${port} guardado en configuración`);
}

/**
 * Obtiene el puerto guardado anteriormente
 * @returns {number|null} - El puerto guardado o null si no hay ninguno
 */
export function getSavedPort() {
  const configPath = path.join(__dirname, '..', '..', '.port-config.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.port || null;
    }
  } catch (err) {
    console.error('Error al leer la configuración de puerto:', err);
  }
  
  return null;
}