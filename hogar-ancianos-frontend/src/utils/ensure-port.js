#!/usr/bin/env node

/**
 * Script para asegurar que el puerto esté disponible antes de iniciar la aplicación
 * Este script se ejecutará antes de iniciar el servidor de desarrollo de Vite
 */

import { exec } from 'child_process';
import { PREFERRED_PORT } from './port-manager.js';

// Puerto a liberar
const PORT = PREFERRED_PORT;

/**
 * Encuentra el proceso que está utilizando un puerto específico
 */
async function findProcessUsingPort(port) {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} | grep LISTEN`;

    exec(cmd, (error, stdout) => {
      if (error || !stdout) {
        console.log(`✅ El puerto ${port} está disponible`);
        resolve(null);
        return;
      }

      let pid = null;
      if (process.platform === 'win32') {
        // En Windows, el PID es el último número en cada línea
        const lines = stdout.toString().split('\n');
        for (const line of lines) {
          if (line.includes(`LISTENING`)) {
            const parts = line.trim().split(/\s+/);
            pid = parts[parts.length - 1];
            break;
          }
        }
      } else {
        // En macOS/Linux, extraemos el PID de la salida de lsof
        const match = stdout.toString().match(/\s+(\d+)\s+/);
        if (match && match[1]) {
          pid = match[1];
        }
      }

      if (pid) {
        console.log(`⚠️ Puerto ${port} está siendo usado por el proceso con PID: ${pid}`);
      }
      resolve(pid);
    });
  });
}

/**
 * Mata el proceso con el PID dado
 */
async function killProcess(pid) {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `taskkill /F /PID ${pid}`
      : `kill -9 ${pid}`;

    exec(cmd, (error) => {
      if (error) {
        console.error(`❌ No se pudo matar el proceso con PID ${pid}: ${error.message}`);
        resolve(false);
        return;
      }

      console.log(`🎯 Proceso con PID ${pid} terminado con éxito`);
      resolve(true);
    });
  });
}

/**
 * Función principal
 */
async function main() {
  console.log(`🔍 Verificando disponibilidad del puerto ${PORT}...`);
  
  const pid = await findProcessUsingPort(PORT);
  if (pid) {
    console.log(`🔄 Intentando liberar el puerto ${PORT}...`);
    const success = await killProcess(pid);
    
    if (success) {
      console.log(`✅ Puerto ${PORT} liberado exitosamente, la aplicación puede iniciarse.`);
      process.exit(0);
    } else {
      console.error(`❌ No se pudo liberar el puerto ${PORT}.`);
      console.log(`⚠️ La aplicación intentará iniciar en otro puerto disponible.`);
      process.exit(1);
    }
  } else {
    console.log(`✅ El puerto ${PORT} está disponible para usar.`);
    process.exit(0);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`❌ Error al verificar el puerto: ${error.message}`);
  process.exit(1);
});