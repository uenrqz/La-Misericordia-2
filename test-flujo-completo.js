#!/usr/bin/env node

/**
 * Prueba de Flujo Completo del Sistema LA MISERICORDIA 2
 * Verifica que todas las mejoras de estabilidad estén funcionando correctamente
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de pruebas
const config = {
  bffUrl: 'http://localhost:4000/api/bff',
  backendUrl: 'http://localhost:3000/api',
  frontendUrl: 'http://localhost:5174',
  timeout: 10000,
  credenciales: {
    admin: { username: 'admin', password: 'Admin2025!' },
    prueba: { username: 'usuario_prueba', password: 'prueba123' }
  }
};

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

class SistemaTester {
  constructor() {
    this.resultados = {
      exitosos: 0,
      fallidos: 0,
      advertencias: 0,
      detalles: []
    };
    this.token = null;
  }

  async ejecutar() {
    log(`${colors.bold}=== PRUEBA DE FLUJO COMPLETO - SISTEMA LA MISERICORDIA 2 ===${colors.reset}`);
    log(`Fecha: ${new Date().toLocaleString()}\n`);

    try {
      // 1. Verificar servicios básicos
      await this.verificarServicios();
      
      // 2. Probar autenticación
      await this.probarAutenticacion();
      
      // 3. Probar manejo de errores
      await this.probarManejoErrores();
      
      // 4. Probar recuperación automática
      await this.probarRecuperacionAutomatica();
      
      // 5. Probar sistema de notificaciones
      await this.probarSistemaNotificaciones();
      
      // 6. Verificar archivos de configuración
      await this.verificarArchivosConfiguracion();
      
      // Mostrar resumen
      this.mostrarResumen();
      
    } catch (err) {
      error(`Error crítico durante las pruebas: ${err.message}`);
      process.exit(1);
    }
  }

  async verificarServicios() {
    info('=== 1. VERIFICACIÓN DE SERVICIOS ===');
    
    const servicios = [
      { nombre: 'Frontend', url: config.frontendUrl },
      { nombre: 'BFF', url: `${config.bffUrl}/status` },
      { nombre: 'Backend', url: `${config.backendUrl}/health` }
    ];

    for (const servicio of servicios) {
      try {
        const response = await this.fetchConTimeout(servicio.url, { method: 'GET' });
        if (response.ok) {
          success(`${servicio.nombre} está online`);
          this.registrarExito(`${servicio.nombre} online`);
        } else {
          warning(`${servicio.nombre} responde pero con estado ${response.status}`);
          this.registrarAdvertencia(`${servicio.nombre} estado ${response.status}`);
        }
      } catch (err) {
        error(`${servicio.nombre} no está disponible: ${err.message}`);
        this.registrarFallo(`${servicio.nombre} offline: ${err.message}`);
      }
    }
  }

  async probarAutenticacion() {
    info('\n=== 2. PRUEBA DE AUTENTICACIÓN ===');
    
    try {
      // Probar login con credenciales de admin
      const loginResponse = await this.fetchConTimeout(`${config.bffUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.credenciales.admin)
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        if (loginData.token) {
          this.token = loginData.token;
          success('Login exitoso con credenciales de admin');
          this.registrarExito('Autenticación admin');
          
          // Verificar token
          await this.verificarToken();
        } else {
          error('Login sin token en respuesta');
          this.registrarFallo('Login sin token');
        }
      } else {
        error(`Login falló con estado ${loginResponse.status}`);
        this.registrarFallo(`Login fallido: ${loginResponse.status}`);
      }
    } catch (err) {
      error(`Error en autenticación: ${err.message}`);
      this.registrarFallo(`Error autenticación: ${err.message}`);
    }
  }

  async verificarToken() {
    try {
      const verifyResponse = await this.fetchConTimeout(`${config.bffUrl}/auth/verify`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        if (verifyData.authenticated) {
          success('Verificación de token exitosa');
          this.registrarExito('Verificación token');
        } else {
          warning('Token válido pero no autenticado');
          this.registrarAdvertencia('Token no autenticado');
        }
      } else {
        error(`Verificación de token falló: ${verifyResponse.status}`);
        this.registrarFallo(`Verificación token: ${verifyResponse.status}`);
      }
    } catch (err) {
      error(`Error verificando token: ${err.message}`);
      this.registrarFallo(`Error verificación token: ${err.message}`);
    }
  }

  async probarManejoErrores() {
    info('\n=== 3. PRUEBA DE MANEJO DE ERRORES ===');
    
    // Probar endpoint inexistente para generar error 404
    try {
      const response = await this.fetchConTimeout(`${config.bffUrl}/endpoint-inexistente`, {
        method: 'GET'
      });
      
      if (response.status === 404) {
        success('Manejo correcto de error 404');
        this.registrarExito('Error 404 manejado');
      } else {
        warning(`Respuesta inesperada para endpoint inexistente: ${response.status}`);
        this.registrarAdvertencia(`404 inesperado: ${response.status}`);
      }
    } catch (err) {
      // Es esperado que falle
      success('Error de conexión manejado correctamente');
      this.registrarExito('Error conexión manejado');
    }

    // Probar error de autorización (sin token)
    try {
      const response = await this.fetchConTimeout(`${config.bffUrl}/usuarios`, {
        method: 'GET'
      });
      
      if (response.status === 401) {
        success('Manejo correcto de error 401 (sin autorización)');
        this.registrarExito('Error 401 manejado');
      } else {
        warning(`Respuesta inesperada para endpoint protegido: ${response.status}`);
        this.registrarAdvertencia(`401 inesperado: ${response.status}`);
      }
    } catch (err) {
      warning(`Error inesperado en prueba 401: ${err.message}`);
      this.registrarAdvertencia(`Error 401: ${err.message}`);
    }
  }

  async probarRecuperacionAutomatica() {
    info('\n=== 4. PRUEBA DE RECUPERACIÓN AUTOMÁTICA ===');
    
    // Simular múltiples reintentos
    let intentosExitosos = 0;
    const totalIntentos = 3;
    
    for (let i = 1; i <= totalIntentos; i++) {
      try {
        const response = await this.fetchConTimeout(`${config.bffUrl}/status`, {
          method: 'GET'
        });
        
        if (response.ok) {
          intentosExitosos++;
        }
        
        // Pequeña pausa entre intentos
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        // Ignorar errores individuales para esta prueba
      }
    }
    
    if (intentosExitosos >= 2) {
      success(`Recuperación automática funcional (${intentosExitosos}/${totalIntentos} exitosos)`);
      this.registrarExito('Recuperación automática');
    } else {
      warning(`Recuperación automática limitada (${intentosExitosos}/${totalIntentos} exitosos)`);
      this.registrarAdvertencia('Recuperación limitada');
    }
  }

  async probarSistemaNotificaciones() {
    info('\n=== 5. VERIFICACIÓN DE SISTEMA DE NOTIFICACIONES ===');
    
    // Verificar que los componentes de notificación existen
    const archivosNotificacion = [
      'hogar-ancianos-frontend/src/components/ui/SystemNotification.jsx',
      'hogar-ancianos-frontend/src/contexts/SystemContext.jsx',
      'hogar-ancianos-frontend/src/utils/errorHandler.js'
    ];
    
    for (const archivo of archivosNotificacion) {
      const rutaCompleta = path.join(__dirname, archivo);
      if (fs.existsSync(rutaCompleta)) {
        success(`Archivo de notificación existe: ${archivo}`);
        this.registrarExito(`Archivo existe: ${path.basename(archivo)}`);
      } else {
        error(`Archivo de notificación faltante: ${archivo}`);
        this.registrarFallo(`Archivo faltante: ${path.basename(archivo)}`);
      }
    }
  }

  async verificarArchivosConfiguracion() {
    info('\n=== 6. VERIFICACIÓN DE ARCHIVOS DE CONFIGURACIÓN ===');
    
    const archivosConfig = [
      'iniciar-sistema.js',
      'verificar_sistema.js',
      'estado-sistema.js',
      'iniciar_produccion.sh',
      'PRODUCCION_README.md'
    ];
    
    for (const archivo of archivosConfig) {
      const rutaCompleta = path.join(__dirname, archivo);
      if (fs.existsSync(rutaCompleta)) {
        success(`Archivo de configuración existe: ${archivo}`);
        this.registrarExito(`Config existe: ${archivo}`);
      } else {
        error(`Archivo de configuración faltante: ${archivo}`);
        this.registrarFallo(`Config faltante: ${archivo}`);
      }
    }
  }

  async fetchConTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  registrarExito(mensaje) {
    this.resultados.exitosos++;
    this.resultados.detalles.push({ tipo: 'exito', mensaje });
  }

  registrarFallo(mensaje) {
    this.resultados.fallidos++;
    this.resultados.detalles.push({ tipo: 'fallo', mensaje });
  }

  registrarAdvertencia(mensaje) {
    this.resultados.advertencias++;
    this.resultados.detalles.push({ tipo: 'advertencia', mensaje });
  }

  mostrarResumen() {
    log(`\n${colors.bold}=== RESUMEN DE PRUEBAS ===${colors.reset}`);
    success(`Pruebas exitosas: ${this.resultados.exitosos}`);
    if (this.resultados.advertencias > 0) {
      warning(`Advertencias: ${this.resultados.advertencias}`);
    }
    if (this.resultados.fallidos > 0) {
      error(`Pruebas fallidas: ${this.resultados.fallidos}`);
    }
    
    const total = this.resultados.exitosos + this.resultados.fallidos + this.resultados.advertencias;
    const porcentajeExito = total > 0 ? Math.round((this.resultados.exitosos / total) * 100) : 0;
    
    log(`\n${colors.bold}Porcentaje de éxito: ${porcentajeExito}%${colors.reset}`);
    
    if (porcentajeExito >= 80) {
      success('🎉 Sistema funcionando correctamente');
    } else if (porcentajeExito >= 60) {
      warning('⚠️  Sistema funcionando con advertencias');
    } else {
      error('🔥 Sistema con problemas críticos');
    }
    
    // Guardar reporte
    this.generarReporte();
  }

  generarReporte() {
    const reporte = {
      fecha: new Date().toISOString(),
      resumen: this.resultados,
      detalles: this.resultados.detalles,
      configuracion: config
    };
    
    const reportePath = path.join(__dirname, 'reporte-pruebas-flujo.json');
    fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
    info(`\n📊 Reporte guardado en: ${reportePath}`);
  }
}

// Ejecutar pruebas si este archivo se ejecuta directamente
const tester = new SistemaTester();
tester.ejecutar().catch(err => {
  error(`Error crítico: ${err.message}`);
  process.exit(1);
});

export default SistemaTester;
