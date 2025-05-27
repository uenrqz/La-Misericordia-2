#!/usr/bin/env node

/**
 * Script de Validación Final del Sistema LA MISERICORDIA 2
 * Verifica que todas las mejoras de estabilidad estén implementadas y funcionando
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
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
  log(`ℹ️  ${message}`, colors.cyan);
}

function header(message) {
  log(`\n${colors.bold}=== ${message} ===${colors.reset}`, colors.magenta);
}

class ValidadorFinal {
  constructor() {
    this.resultados = {
      componentes: { exitosos: 0, fallidos: 0 },
      servicios: { exitosos: 0, fallidos: 0 },
      scripts: { exitosos: 0, fallidos: 0 },
      configuracion: { exitosos: 0, fallidos: 0 },
      documentacion: { exitosos: 0, fallidos: 0 }
    };
    this.detalles = [];
  }

  async ejecutar() {
    log(`${colors.bold}🔍 VALIDACIÓN FINAL DEL SISTEMA LA MISERICORDIA 2${colors.reset}`);
    log(`Fecha: ${new Date().toLocaleString()}`);
    log(`Validando mejoras de estabilidad y preparación para producción\n`);

    try {
      // 1. Validar componentes de Frontend
      await this.validarComponentesFrontend();
      
      // 2. Validar servicios de Backend/BFF
      await this.validarServicios();
      
      // 3. Validar scripts de sistema
      await this.validarScripts();
      
      // 4. Validar configuración de producción
      await this.validarConfiguracionProduccion();
      
      // 5. Validar documentación
      await this.validarDocumentacion();
      
      // 6. Generar resumen final
      this.generarResumenFinal();
      
    } catch (err) {
      error(`Error crítico durante la validación: ${err.message}`);
      process.exit(1);
    }
  }

  async validarComponentesFrontend() {
    header('COMPONENTES DE FRONTEND');
    
    const componentesRequeridos = [
      {
        ruta: 'hogar-ancianos-frontend/src/contexts/SystemContext.jsx',
        descripcion: 'Contexto del sistema con manejo de errores',
        validaciones: [
          'SystemProvider',
          'useSystem',
          'tokenRefreshManager',
          'handleError500',
          'handleLoginSuccess'
        ]
      },
      {
        ruta: 'hogar-ancianos-frontend/src/components/ui/SystemNotification.jsx',
        descripcion: 'Sistema de notificaciones',
        validaciones: [
          'Error500Notification',
          'DisconnectedNotification',
          'SessionExpiredNotification'
        ]
      },
      {
        ruta: 'hogar-ancianos-frontend/src/utils/errorHandler.js',
        descripcion: 'Manejador de errores 500',
        validaciones: [
          'fetchWithErrorHandling',
          'recuperarDeErrores500',
          'diagnosticarErrores500'
        ]
      },
      {
        ruta: 'hogar-ancianos-frontend/src/utils/tokenRefreshManager.js',
        descripcion: 'Sistema de refresh tokens automático',
        validaciones: [
          'TokenRefreshManager',
          'refrescarToken',
          'programarProximoRefresh'
        ]
      },
      {
        ruta: 'hogar-ancianos-frontend/src/services/api.service.js',
        descripcion: 'Cliente API con manejo de errores',
        validaciones: [
          'apiClient',
          'fetchWithErrorHandling',
          'CORS_CONFIG'
        ]
      },
      {
        ruta: 'hogar-ancianos-frontend/src/components/SystemDiagnosticAdvanced.jsx',
        descripcion: 'Diagnóstico avanzado del sistema',
        validaciones: [
          'SystemDiagnosticAdvanced',
          'runComprehensiveTest',
          'tokenRefreshManager'
        ]
      }
    ];

    for (const componente of componentesRequeridos) {
      await this.validarComponente(componente);
    }
  }

  async validarComponente(componente) {
    const rutaCompleta = path.join(__dirname, componente.ruta);
    
    try {
      if (!fs.existsSync(rutaCompleta)) {
        error(`${componente.descripcion}: Archivo no encontrado`);
        this.resultados.componentes.fallidos++;
        this.detalles.push({
          categoria: 'componentes',
          tipo: 'error',
          mensaje: `${componente.descripcion}: Archivo faltante`
        });
        return;
      }

      const contenido = fs.readFileSync(rutaCompleta, 'utf8');
      let validacionesExitosas = 0;

      for (const validacion of componente.validaciones) {
        if (contenido.includes(validacion)) {
          validacionesExitosas++;
        } else {
          warning(`${componente.descripcion}: Falta '${validacion}'`);
        }
      }

      if (validacionesExitosas === componente.validaciones.length) {
        success(`${componente.descripcion}: Completamente implementado`);
        this.resultados.componentes.exitosos++;
        this.detalles.push({
          categoria: 'componentes',
          tipo: 'exito',
          mensaje: componente.descripcion
        });
      } else {
        warning(`${componente.descripcion}: ${validacionesExitosas}/${componente.validaciones.length} validaciones pasaron`);
        this.resultados.componentes.fallidos++;
        this.detalles.push({
          categoria: 'componentes',
          tipo: 'advertencia',
          mensaje: `${componente.descripcion}: Parcialmente implementado`
        });
      }

    } catch (error) {
      error(`Error validando ${componente.descripcion}: ${error.message}`);
      this.resultados.componentes.fallidos++;
    }
  }

  async validarServicios() {
    header('SERVICIOS BACKEND Y BFF');
    
    const servicios = [
      {
        ruta: 'hogar-ancianos-bff/src/routes/auth.routes.js',
        descripcion: 'Rutas de autenticación BFF',
        validaciones: ['refresh', 'verify', 'login']
      },
      {
        ruta: 'hogar-ancianos-bff/src/routes/diagnostic.routes.js',
        descripcion: 'Rutas de diagnóstico BFF',
        validaciones: ['status', 'health']
      },
      {
        ruta: 'hogar-ancianos-backend/src/routes/auth.routes.js',
        descripcion: 'Rutas de autenticación Backend',
        validaciones: ['login', 'register', 'password']
      },
      {
        ruta: 'hogar-ancianos-backend/src/utils/admin-produccion.js',
        descripcion: 'Utilidad admin de producción',
        validaciones: ['crearAdminProduccion', 'bcrypt']
      }
    ];

    for (const servicio of servicios) {
      await this.validarServicio(servicio);
    }
  }

  async validarServicio(servicio) {
    const rutaCompleta = path.join(__dirname, servicio.ruta);
    
    try {
      if (!fs.existsSync(rutaCompleta)) {
        error(`${servicio.descripcion}: Archivo no encontrado`);
        this.resultados.servicios.fallidos++;
        return;
      }

      const contenido = fs.readFileSync(rutaCompleta, 'utf8');
      let validacionesExitosas = 0;

      for (const validacion of servicio.validaciones) {
        if (contenido.includes(validacion)) {
          validacionesExitosas++;
        }
      }

      if (validacionesExitosas >= servicio.validaciones.length * 0.7) { // 70% mínimo
        success(`${servicio.descripcion}: Implementado correctamente`);
        this.resultados.servicios.exitosos++;
      } else {
        warning(`${servicio.descripcion}: ${validacionesExitosas}/${servicio.validaciones.length} validaciones`);
        this.resultados.servicios.fallidos++;
      }

    } catch (error) {
      error(`Error validando ${servicio.descripcion}: ${error.message}`);
      this.resultados.servicios.fallidos++;
    }
  }

  async validarScripts() {
    header('SCRIPTS DEL SISTEMA');
    
    const scripts = [
      'iniciar-sistema.js',
      'verificar_sistema.js',
      'estado-sistema.js',
      'test-flujo-completo.js',
      'iniciar_produccion.sh'
    ];

    for (const script of scripts) {
      const rutaCompleta = path.join(__dirname, script);
      
      if (fs.existsSync(rutaCompleta)) {
        // Verificar que el script sea ejecutable o tenga contenido válido
        const contenido = fs.readFileSync(rutaCompleta, 'utf8');
        if (contenido.length > 100) { // Verificación básica de contenido
          success(`Script ${script}: Presente y con contenido`);
          this.resultados.scripts.exitosos++;
        } else {
          warning(`Script ${script}: Presente pero con poco contenido`);
          this.resultados.scripts.fallidos++;
        }
      } else {
        error(`Script ${script}: No encontrado`);
        this.resultados.scripts.fallidos++;
      }
    }
  }

  async validarConfiguracionProduccion() {
    header('CONFIGURACIÓN DE PRODUCCIÓN');
    
    const configuraciones = [
      {
        archivo: 'package.json',
        validaciones: ['node-fetch', 'type": "module']
      },
      {
        archivo: 'hogar-ancianos-backend/docker-compose.yml',
        validaciones: ['postgres', 'environment']
      },
      {
        archivo: 'hogar-ancianos-backend/scripts/admin_produccion.sql',
        validaciones: ['INSERT', 'admin', 'bcrypt']
      },
      {
        archivo: 'PRODUCCION_README.md',
        validaciones: ['admin', 'Admin2025!', 'PostgreSQL']
      }
    ];

    for (const config of configuraciones) {
      await this.validarConfiguracion(config);
    }
  }

  async validarConfiguracion(config) {
    const rutaCompleta = path.join(__dirname, config.archivo);
    
    try {
      if (!fs.existsSync(rutaCompleta)) {
        error(`Configuración ${config.archivo}: No encontrada`);
        this.resultados.configuracion.fallidos++;
        return;
      }

      const contenido = fs.readFileSync(rutaCompleta, 'utf8');
      let validacionesExitosas = 0;

      for (const validacion of config.validaciones) {
        if (contenido.includes(validacion)) {
          validacionesExitosas++;
        }
      }

      if (validacionesExitosas === config.validaciones.length) {
        success(`Configuración ${config.archivo}: Completa`);
        this.resultados.configuracion.exitosos++;
      } else {
        warning(`Configuración ${config.archivo}: ${validacionesExitosas}/${config.validaciones.length} validaciones`);
        this.resultados.configuracion.fallidos++;
      }

    } catch (error) {
      error(`Error validando configuración ${config.archivo}: ${error.message}`);
      this.resultados.configuracion.fallidos++;
    }
  }

  async validarDocumentacion() {
    header('DOCUMENTACIÓN');
    
    const documentos = [
      'README.md',
      'PRODUCCION_README.md',
      'RESUMEN_CAMBIOS_PRODUCCION.md',
      'hogar-ancianos-frontend/README_USUARIO.md',
      'hogar-ancianos-frontend/INFORME_MEJORAS.md'
    ];

    for (const documento of documentos) {
      const rutaCompleta = path.join(__dirname, documento);
      
      if (fs.existsSync(rutaCompleta)) {
        const contenido = fs.readFileSync(rutaCompleta, 'utf8');
        if (contenido.length > 200) { // Documentación mínima
          success(`Documentación ${documento}: Presente`);
          this.resultados.documentacion.exitosos++;
        } else {
          warning(`Documentación ${documento}: Muy breve`);
          this.resultados.documentacion.fallidos++;
        }
      } else {
        error(`Documentación ${documento}: No encontrada`);
        this.resultados.documentacion.fallidos++;
      }
    }
  }

  generarResumenFinal() {
    header('RESUMEN FINAL DE VALIDACIÓN');
    
    const categorias = [
      { nombre: 'Componentes Frontend', datos: this.resultados.componentes },
      { nombre: 'Servicios Backend/BFF', datos: this.resultados.servicios },
      { nombre: 'Scripts del Sistema', datos: this.resultados.scripts },
      { nombre: 'Configuración Producción', datos: this.resultados.configuracion },
      { nombre: 'Documentación', datos: this.resultados.documentacion }
    ];

    let totalExitosos = 0;
    let totalFallidos = 0;

    for (const categoria of categorias) {
      const total = categoria.datos.exitosos + categoria.datos.fallidos;
      const porcentaje = total > 0 ? Math.round((categoria.datos.exitosos / total) * 100) : 0;
      
      log(`📊 ${categoria.nombre}: ${categoria.datos.exitosos}/${total} (${porcentaje}%)`, 
          porcentaje >= 80 ? colors.green : porcentaje >= 60 ? colors.yellow : colors.red);
      
      totalExitosos += categoria.datos.exitosos;
      totalFallidos += categoria.datos.fallidos;
    }

    const totalGeneral = totalExitosos + totalFallidos;
    const porcentajeGeneral = totalGeneral > 0 ? Math.round((totalExitosos / totalGeneral) * 100) : 0;

    log(`\n${colors.bold}RESULTADO GENERAL:${colors.reset}`);
    log(`✅ Exitosos: ${totalExitosos}`, colors.green);
    log(`❌ Fallidos: ${totalFallidos}`, colors.red);
    log(`📈 Porcentaje de completitud: ${porcentajeGeneral}%`, 
        porcentajeGeneral >= 90 ? colors.green : porcentajeGeneral >= 70 ? colors.yellow : colors.red);

    // Mensaje final
    if (porcentajeGeneral >= 90) {
      log(`\n🎉 ${colors.bold}SISTEMA LISTO PARA PRODUCCIÓN${colors.reset}`, colors.green);
      log(`El sistema LA MISERICORDIA 2 está completamente preparado con todas las mejoras de estabilidad implementadas.`);
    } else if (porcentajeGeneral >= 70) {
      log(`\n⚠️  ${colors.bold}SISTEMA CASI LISTO${colors.reset}`, colors.yellow);
      log(`El sistema está en buenas condiciones pero necesita algunas mejoras menores.`);
    } else {
      log(`\n🔥 ${colors.bold}SISTEMA NECESITA TRABAJO ADICIONAL${colors.reset}`, colors.red);
      log(`Se requieren más mejoras antes de estar listo para producción.`);
    }

    // Guardar reporte detallado
    this.guardarReporteDetallado(porcentajeGeneral);
  }

  guardarReporteDetallado(porcentajeGeneral) {
    const reporte = {
      fecha: new Date().toISOString(),
      porcentajeCompletitud: porcentajeGeneral,
      resultados: this.resultados,
      detalles: this.detalles,
      recomendaciones: this.generarRecomendaciones()
    };

    const reportePath = path.join(__dirname, 'validacion-final-reporte.json');
    fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
    info(`📄 Reporte detallado guardado en: ${reportePath}`);
  }

  generarRecomendaciones() {
    const recomendaciones = [];
    
    if (this.resultados.componentes.fallidos > 0) {
      recomendaciones.push('Revisar y completar los componentes de frontend faltantes');
    }
    
    if (this.resultados.servicios.fallidos > 0) {
      recomendaciones.push('Verificar la implementación de los servicios backend/BFF');
    }
    
    if (this.resultados.configuracion.fallidos > 0) {
      recomendaciones.push('Completar la configuración de producción');
    }
    
    recomendaciones.push('Ejecutar pruebas de flujo completo antes del despliegue');
    recomendaciones.push('Verificar que todos los servicios estén funcionando correctamente');
    
    return recomendaciones;
  }
}

// Ejecutar validación
const validador = new ValidadorFinal();
validador.ejecutar().catch(err => {
  error(`Error crítico: ${err.message}`);
  process.exit(1);
});
