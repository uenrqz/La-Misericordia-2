/**
 * Clase para iniciar el sistema LA MISERICORDIA 2
 * Inicia el backend, BFF y frontend
 * Creado: 22 de mayo de 2025
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

class SistemaStarter {
  constructor() {
    this.procesos = {
      backend: null,
      bff: null,
      frontend: null
    };
    
    this.puertos = {
      backend: 3000,
      bff: 4000,
      frontend: 5174
    };
    
    // Configuración de colores para la consola
    this.colors = {
      reset: "\x1b[0m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      red: "\x1b[31m"
    };
    
    // Registrar manejador para cierre controlado
    process.on('SIGINT', async () => {
      console.log(`${this.colors.yellow}Deteniendo todos los servicios...${this.colors.reset}`);
      await this.detenerTodo();
      process.exit(0);
    });
  }

  /**
   * Mostrar mensaje formateado en la consola
   * @param {string} tipo - Tipo de mensaje
   * @param {string} color - Color del mensaje
   * @param {string} mensaje - Contenido del mensaje
   */
  mensaje(tipo, color, mensaje) {
    console.log(`${color}[${tipo}] ${mensaje}${this.colors.reset}`);
  }

  /**
   * Verificar si un puerto está disponible
   * @param {number} puerto - Número de puerto a verificar
   * @returns {Promise<boolean>} - True si el puerto está disponible
   */
  async verificarPuerto(puerto) {
    return new Promise(resolve => {
      const server = http.createServer();
      
      server.once('error', () => {
        this.mensaje('ERROR', this.colors.red, `El puerto ${puerto} ya está en uso`);
        resolve(false);
      });
      
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      
      server.listen(puerto);
    });
  }

  /**
   * Verificar que todos los puertos necesarios estén disponibles
   * @returns {Promise<boolean>} - True si todos los puertos están disponibles
   */
  async verificarPuertos() {
    this.mensaje('INFO', this.colors.blue, 'Verificando puertos disponibles...');
    
    for (const [nombre, puerto] of Object.entries(this.puertos)) {
      const disponible = await this.verificarPuerto(puerto);
      if (!disponible) {
        this.mensaje('AVISO', this.colors.yellow, 
          `Puerto ${puerto} para ${nombre} no está disponible. Intentando liberar puerto...`);
        
        // Intentar liberar el puerto
        const liberado = await this.liberarPuerto(puerto, nombre);
        if (!liberado) {
          this.mensaje('ERROR', this.colors.red, 
            `No se pudo liberar el puerto ${puerto}. Cierre manualmente las aplicaciones que lo estén usando.`);
          return false;
        }
        
        // Verificar nuevamente después de intentar liberar
        const verificacionFinal = await this.verificarPuerto(puerto);
        if (!verificacionFinal) {
          this.mensaje('ERROR', this.colors.red, 
            `No se pudo liberar el puerto ${puerto} después de intentarlo. Cierre manualmente las aplicaciones.`);
          return false;
        }
        
        this.mensaje('ÉXITO', this.colors.green, `Puerto ${puerto} liberado exitosamente.`);
      }
    }
    
    this.mensaje('INFO', this.colors.green, 'Todos los puertos están disponibles');
    return true;
  }

  /**
   * Intenta liberar un puerto matando el proceso que lo esté usando
   * @param {number} puerto - Número de puerto a liberar
   * @param {string} servicio - Nombre del servicio para mensajes informativos
   * @returns {Promise<boolean>} - True si se pudo liberar el puerto
   */
  async liberarPuerto(puerto, servicio) {
    this.mensaje('INFO', this.colors.yellow, `Intentando liberar puerto ${puerto} para ${servicio}...`);
    
    try {
      // En macOS usamos lsof para encontrar el proceso usando el puerto
      const procesoInfo = await this.ejecutarComando('lsof', ['-i', `:${puerto}`, '-t'], process.cwd());
      
      if (!procesoInfo.trim()) {
        this.mensaje('AVISO', this.colors.yellow, `No se encontró proceso usando el puerto ${puerto}`);
        return true; // No hay proceso, consideramos que está liberado
      }
      
      const pids = procesoInfo.trim().split('\n');
      
      for (const pid of pids) {
        if (pid) {
          this.mensaje('INFO', this.colors.yellow, `Deteniendo proceso con PID ${pid} que usa el puerto ${puerto}...`);
          
          // Enviar señal SIGTERM para detener el proceso de forma controlada
          await this.ejecutarComando('kill', ['-15', pid], process.cwd());
          
          // Esperar un momento para que el proceso termine
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verificar si el proceso sigue ejecutándose
          try {
            await this.ejecutarComando('ps', ['-p', pid], process.cwd());
            
            // Si llegamos aquí, el proceso sigue vivo, intentar con SIGKILL
            this.mensaje('AVISO', this.colors.yellow, `El proceso ${pid} no respondió, usando kill -9...`);
            await this.ejecutarComando('kill', ['-9', pid], process.cwd());
          } catch (e) {
            // Si da error es porque el proceso ya no existe, lo cual es bueno
            this.mensaje('ÉXITO', this.colors.green, `Proceso ${pid} terminado correctamente`);
          }
        }
      }
      
      return true;
    } catch (error) {
      this.mensaje('ERROR', this.colors.red, `Error liberando puerto ${puerto}: ${error.message}`);
      return false;
    }
  }

  /**
   * Intentar conectar a un servidor para verificar que esté funcionando
   * @param {number} puerto - Puerto donde verificar
   * @param {string} ruta - Ruta a verificar
   * @returns {Promise<boolean>} - True si la conexión fue exitosa
   */
  verificarConexion(puerto, ruta = '/api/status') {
    return new Promise(resolve => {
      const req = http.request({
        hostname: 'localhost',
        port: puerto,
        path: ruta,
        method: 'GET',
        timeout: 1000
      }, res => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      
      req.on('error', () => resolve(false));
      req.end();
    });
  }
  
  /**
   * Esperar a que un servidor esté disponible
   * @param {string} tipo - Tipo de servidor (backend, bff, frontend)
   * @param {number} puerto - Puerto del servidor
   * @param {string} ruta - Ruta a verificar
   * @param {number} maxIntentos - Número máximo de intentos
   * @returns {Promise<boolean>} - True si el servidor respondió correctamente
   */
  async esperarServidor(tipo, puerto, ruta = '/api/status', maxIntentos = 20) {
    for (let i = 1; i <= maxIntentos; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.mensaje('INFO', this.colors.yellow, `Esperando a que ${tipo} inicie... (${i}/${maxIntentos})`);
      
      const activo = await this.verificarConexion(puerto, ruta);
      if (activo) {
        this.mensaje('ÉXITO', this.colors.green, 
          `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} iniciado en http://localhost:${puerto}`);
        return true;
      }
    }
    
    this.mensaje('ERROR', this.colors.red, 
      `Tiempo de espera agotado para ${tipo}. Verifique los logs.`);
    return false;
  }

  /**
   * Iniciar un componente del sistema
   * @param {string} tipo - Tipo de componente (backend, bff, frontend)
   * @param {string} directorio - Directorio del componente
   * @returns {Promise<boolean>} - True si se inició correctamente
   */
  async iniciarComponente(tipo, directorio) {
    this.mensaje('INFO', this.colors.blue, `Iniciando ${tipo} en modo DESARROLLO (con Docker)...`);
    
    const dirPath = path.join(__dirname, directorio);
    
    if (!fs.existsSync(dirPath)) {
      this.mensaje('ERROR', this.colors.red, `Directorio ${dirPath} no existe`);
      return false;
    }
    
    // Validación especial para el frontend
    if (tipo === 'frontend') {
      // 1. Liberar puerto 5174 si está ocupado
      const puertoFrontend = 5174;
      const disponible = await this.verificarPuerto(puertoFrontend);
      if (!disponible) {
        this.mensaje('AVISO', this.colors.yellow, `Puerto ${puertoFrontend} para frontend no está disponible. Intentando liberar puerto...`);
        const liberado = await this.liberarPuerto(puertoFrontend, 'frontend');
        if (!liberado) {
          this.mensaje('ERROR', this.colors.red, `No se pudo liberar el puerto ${puertoFrontend}. Cierre manualmente las aplicaciones que lo estén usando.`);
          return false;
        }
      }
      // 2. Verificar dependencias (node_modules y vite)
      const nodeModulesPath = path.join(dirPath, 'node_modules');
      const vitePath = path.join(nodeModulesPath, 'vite');
      let necesitaInstalar = false;
      if (!fs.existsSync(nodeModulesPath)) {
        this.mensaje('AVISO', this.colors.yellow, 'No se encontró node_modules en frontend. Instalando dependencias...');
        necesitaInstalar = true;
      } else if (!fs.existsSync(vitePath)) {
        this.mensaje('AVISO', this.colors.yellow, 'No se encontró Vite en node_modules del frontend. Instalando dependencias...');
        necesitaInstalar = true;
      }
      if (necesitaInstalar) {
        try {
          await this.ejecutarComando('npm', ['install'], dirPath);
        } catch (error) {
          this.mensaje('ERROR', this.colors.red, `Error instalando dependencias para frontend: ${error.message}`);
          return false;
        }
      }
    } else {
      // Instalación de dependencias para backend y bff
      try {
        this.mensaje('INFO', this.colors.blue, `Instalando dependencias para ${tipo}...`);
        await this.ejecutarComando('npm', ['install'], dirPath);
      } catch (error) {
        this.mensaje('ERROR', this.colors.red, `Error instalando dependencias para ${tipo}: ${error.message}`);
        return false;
      }
    }
    
    // Para el backend, ejecutar migraciones de PostgreSQL primero
    if (tipo === 'backend') {
      try {
        this.mensaje('INFO', this.colors.blue, 'Iniciando contenedor de PostgreSQL...');
        await this.ejecutarComando('docker-compose', ['up', '-d'], dirPath);
        
        // Esperar a que PostgreSQL esté listo
        this.mensaje('INFO', this.colors.blue, 'Esperando a que PostgreSQL esté listo...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Esperar 10 segundos
        
        // Verificar que PostgreSQL esté realmente listo haciendo una conexión de prueba
        let postgresListo = false;
        let intentos = 0;
        const maxIntentos = 10;
        
        while (!postgresListo && intentos < maxIntentos) {
          try {
            intentos++;
            this.mensaje('INFO', this.colors.yellow, `Verificando conexión a PostgreSQL... (${intentos}/${maxIntentos})`);
            await this.ejecutarComando('docker', ['exec', 'hogar-ancianos-backend-db-1', 'pg_isready', '-U', 'hogar_user', '-d', 'hogar_db'], dirPath);
            postgresListo = true;
            this.mensaje('ÉXITO', this.colors.green, 'PostgreSQL está listo para recibir conexiones');
          } catch (error) {
            if (intentos < maxIntentos) {
              this.mensaje('AVISO', this.colors.yellow, `PostgreSQL aún no está listo, esperando 3 segundos más...`);
              await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
              throw new Error('PostgreSQL no pudo iniciarse después de varios intentos');
            }
          }
        }
        
        // Ejecutar migraciones (ignorando errores de tablas existentes)
        this.mensaje('INFO', this.colors.blue, 'Verificando estructura de base de datos...');
        try {
          await this.ejecutarComando('node', ['scripts/run-migrations.js'], dirPath);
          this.mensaje('INFO', this.colors.green, 'Estructura de base de datos verificada');
        } catch (migrationsError) {
          // Si el error es por tablas existentes, ignorarlo
          if (migrationsError.message.includes('already exists')) {
            this.mensaje('INFO', this.colors.yellow, 'La base de datos ya existe, continuando...');
          } else {
            throw migrationsError;
          }
        }
      } catch (error) {
        this.mensaje('ERROR', this.colors.red, `Error preparando base de datos: ${error.message}`);
        return false;
      }
    }
    
    // Iniciar el componente en modo desarrollo (con Docker local)
    const env = { ...process.env, NODE_ENV: 'development' };
    this.procesos[tipo] = spawn('npm', ['start'], { cwd: dirPath, shell: true, env: env });
    
    // Manejar salida del proceso
    this.procesos[tipo].stdout.on('data', (data) => {
      process.stdout.write(`${this.colors.blue}[${tipo}] ${this.colors.reset}${data}`);
    });
    
    this.procesos[tipo].stderr.on('data', (data) => {
      process.stderr.write(`${this.colors.red}[${tipo} ERROR] ${this.colors.reset}${data}`);
    });
    
    // Verificar si el proceso se inició correctamente esperando por el servidor
    let ruta = '/api/status';
    if (tipo === 'frontend') ruta = '/';
    
    return await this.esperarServidor(tipo, this.puertos[tipo], ruta);
  }
  
  /**
   * Ejecutar un comando y esperar a que termine
   * @param {string} comando - Comando a ejecutar
   * @param {string[]} args - Argumentos del comando
   * @param {string} cwd - Directorio de trabajo
   * @returns {Promise<string>} - Promesa que se resuelve con la salida del comando
   */
  ejecutarComando(comando, args, cwd) {
    return new Promise((resolve, reject) => {
      const proc = spawn(comando, args, { cwd, shell: true });
      let stdout = '';
      let stderr = '';
      
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Comando falló con código ${code}: ${stderr}`));
        }
      });
      
      proc.on('error', (err) => {
        reject(new Error(`Error ejecutando ${comando}: ${err.message}`));
      });
    });
  }

  /**
   * Detener todos los procesos
   * @returns {Promise<void>} - Promesa que se resuelve cuando todos los procesos han sido detenidos
   */
  async detenerTodo() {
    // Primero intentamos cerrar los procesos de forma amigable con SIGTERM
    for (const [tipo, proceso] of Object.entries(this.procesos)) {
      if (proceso && !proceso.killed) {
        try {
          this.mensaje('INFO', this.colors.yellow, `Deteniendo ${tipo}...`);
          proceso.kill('SIGTERM');
        } catch (error) {
          this.mensaje('ERROR', this.colors.red, `Error deteniendo ${tipo}: ${error.message}`);
        }
      }
    }
    
    // Esperar un momento para que terminen
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Para cualquier proceso que aún no ha terminado, forzar cierre con SIGKILL
    for (const [tipo, proceso] of Object.entries(this.procesos)) {
      if (proceso && !proceso.killed) {
        try {
          this.mensaje('AVISO', this.colors.yellow, `Forzando cierre de ${tipo}...`);
          proceso.kill('SIGKILL');
        } catch (error) {
          this.mensaje('ERROR', this.colors.red, `Error forzando cierre de ${tipo}: ${error.message}`);
        }
      }
    }
    
    // Liberar posibles puertos en uso
    this.mensaje('INFO', this.colors.blue, 'Verificando liberación de puertos...');
    for (const [nombre, puerto] of Object.entries(this.puertos)) {
      await this.liberarPuerto(puerto, nombre);
    }
  }

  /**
   * Iniciar todo el sistema
   */
  async iniciar() {
    this.mensaje('INFO', this.colors.green, '=== INICIANDO SISTEMA LA MISERICORDIA 2 ===');
    
    // Verificar puertos y liberar los que estén ocupados
    this.mensaje('INFO', this.colors.blue, 'Verificando y liberando puertos necesarios...');
    const puertosOk = await this.verificarPuertos();
    if (!puertosOk) return false;
    
    // Iniciar componentes en orden
    const backendOk = await this.iniciarComponente('backend', 'hogar-ancianos-backend');
    if (!backendOk) {
      await this.detenerTodo();
      return false;
    }
    
    const bffOk = await this.iniciarComponente('bff', 'hogar-ancianos-bff');
    if (!bffOk) {
      await this.detenerTodo();
      return false;
    }
    
    const frontendOk = await this.iniciarComponente('frontend', 'hogar-ancianos-frontend');
    if (!frontendOk) {
      await this.detenerTodo();
      return false;
    }
    
    // Mostrar información final
    this.mensaje('ÉXITO', this.colors.green, '=== SISTEMA LA MISERICORDIA 2 INICIADO CORRECTAMENTE EN MODO DESARROLLO ===');
    this.mensaje('INFO', this.colors.blue, 'Accede al sistema en: http://localhost:5174');
    this.mensaje('INFO', this.colors.blue, 'Credenciales de acceso:');
    this.mensaje('INFO', this.colors.blue, '   - Usuario administrador: admin');
    this.mensaje('INFO', this.colors.blue, '   - Contraseña: Admin2025!');
    this.mensaje('INFO', this.colors.blue, 'Sistema listo con PostgreSQL en Docker - Hogar de Ancianos La Misericordia');
    this.mensaje('INFO', this.colors.yellow, 'Presiona Ctrl+C para detener todos los servicios');
    
    return true;
  }
}

// Ejecutar el iniciador
const starter = new SistemaStarter();
(async () => {
  try {
    const resultado = await starter.iniciar();
    if (!resultado) {
      console.error('No se pudo iniciar el sistema correctamente.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error iniciando el sistema:', err);
    // Intentar limpiar antes de salir
    await starter.detenerTodo().catch(() => {});
    process.exit(1);
  }
})();
