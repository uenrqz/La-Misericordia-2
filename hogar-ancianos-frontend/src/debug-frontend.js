// Este archivo es para depuración y se ejecutará con el comando node
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Verificar archivos críticos
console.log('--- DIAGNÓSTICO DE ARCHIVOS CRÍTICOS ---');
const criticalFiles = [
  'src/main.jsx',
  'src/App.jsx',
  'src/index.css',
  'src/context/AuthContext.jsx',
  'src/pages/Login.jsx',
  'src/pages/Login.css',
  'src/services/api.service.js',
  'src/services/api.config.js'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  console.log(`${file}: ${fileExists(filePath) ? 'EXISTE ✅' : 'NO EXISTE ❌'}`);
});

// Verificar vite.config.js
const viteConfigPath = path.join(__dirname, '..', 'vite.config.js');
console.log(`\nvite.config.js: ${fileExists(viteConfigPath) ? 'EXISTE ✅' : 'NO EXISTE ❌'}`);

if (fileExists(viteConfigPath)) {
  try {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
    console.log('\nContenido de vite.config.js:');
    console.log(viteConfig);
  } catch (err) {
    console.error('Error al leer vite.config.js:', err);
  }
}

// Verificar dependencias críticas en package.json
console.log('\n--- VERIFICACIÓN DE DEPENDENCIAS ---');
const packageJsonPath = path.join(__dirname, '..', 'package.json');

if (fileExists(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const criticalDeps = ['react', 'react-dom', 'react-router-dom', 'axios', '@vitejs/plugin-react'];
    criticalDeps.forEach(dep => {
      console.log(`${dep}: ${packageJson.dependencies[dep] || packageJson.devDependencies[dep] || 'NO ENCONTRADO ❌'}`);
    });
  } catch (err) {
    console.error('Error al leer package.json:', err);
  }
}

// Verificar puertos en uso
console.log('\n--- PUERTOS EN USO ---');
exec('lsof -i :5174', (error, stdout) => {
  console.log('Puerto 5174 (Frontend):');
  if (stdout) {
    console.log(stdout);
  } else {
    console.log('No hay procesos escuchando en el puerto 5174 ❌');
  }
});

exec('lsof -i :4000', (error, stdout) => {
  console.log('Puerto 4000 (BFF):');
  if (stdout) {
    console.log(stdout);
  } else {
    console.log('No hay procesos escuchando en el puerto 4000 ❌');
  }
});

// Imprimir mensaje final
console.log('\n--- PASOS PARA SOLUCIONAR ---');
console.log('1. Verifica que todos los archivos críticos existen');
console.log('2. Asegúrate de que las dependencias estén instaladas correctamente (npm install)');
console.log('3. Asegúrate de que los puertos 5174 (Frontend) y 4000 (BFF) estén en uso');
console.log('4. Revisa los logs del frontend (frontend.log)');
console.log('5. Intenta limpiar la caché de Vite: rm -rf node_modules/.vite');
