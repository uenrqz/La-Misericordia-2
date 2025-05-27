#!/usr/bin/env node

/**
 * Script para verificar el estado del sistema LA MISERICORDIA 2
 * Verifica la disponibilidad y estado de todos los componentes
 * Fecha: 23 de mayo de 2025
 */

const http = require('http');
const { exec } = require('child_process');

// Colores para consola
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m"
};

// Endpoints a verificar
const endpoints = [
  { name: 'Backend', url: 'http://localhost:3000/api/status', type: 'json' },
  { name: 'BFF', url: 'http://localhost:4000/api/bff/status', type: 'json' },
  { name: 'Frontend', url: 'http://localhost:5174', type: 'html' },
];

// Verificar estado de Docker y PostgreSQL
function checkDocker() {
  return new Promise((resolve) => {
    exec('docker ps | grep postgres', (error, stdout) => {
      if (error || !stdout) {
        console.log(`${colors.red}[ERROR] PostgreSQL no está ejecutándose en Docker${colors.reset}`);
        resolve(false);
      } else {
        console.log(`${colors.green}[OK] PostgreSQL ejecutándose en Docker${colors.reset}`);
        resolve(true);
      }
    });
  });
}

// Verificar disponibilidad de un endpoint
function checkEndpoint(name, url, type) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          if (type === 'json') {
            try {
              const jsonData = JSON.parse(data);
              const env = jsonData.environment || jsonData.mode || 'unknown';
              console.log(`${colors.green}[OK] ${name} disponible - Entorno: ${env}${colors.reset}`);
              resolve(true);
            } catch (e) {
              console.log(`${colors.yellow}[AVISO] ${name} responde pero con formato inválido${colors.reset}`);
              resolve(false);
            }
          } else {
            console.log(`${colors.green}[OK] ${name} disponible${colors.reset}`);
            resolve(true);
          }
        } else {
          console.log(`${colors.red}[ERROR] ${name} responde con código ${res.statusCode}${colors.reset}`);
          resolve(false);
        }
      });
    }).on('error', (e) => {
      console.log(`${colors.red}[ERROR] ${name} no disponible: ${e.message}${colors.reset}`);
      resolve(false);
    });
  });
}

// Función principal
async function checkSystemStatus() {
  console.log(`${colors.blue}=== Verificando estado del sistema LA MISERICORDIA 2 ===${colors.reset}`);
  
  // Verificar Docker y PostgreSQL
  await checkDocker();
  
  // Verificar componentes
  let allOk = true;
  
  for (const endpoint of endpoints) {
    const status = await checkEndpoint(endpoint.name, endpoint.url, endpoint.type);
    if (!status) allOk = false;
  }
  
  // Resultado final
  console.log(`${colors.blue}=== Resultado de la verificación ===${colors.reset}`);
  
  if (allOk) {
    console.log(`${colors.green}✓ Sistema LA MISERICORDIA 2 funcionando correctamente en modo producción${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Sistema LA MISERICORDIA 2 parcialmente disponible${colors.reset}`);
    console.log(`${colors.yellow}  Ejecute ./iniciar_produccion.sh para reiniciar los componentes del sistema${colors.reset}`);
  }
}

// Ejecutar
checkSystemStatus();
