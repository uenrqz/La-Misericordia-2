/**
 * Sistema de Refresh Tokens Automático para LA MISERICORDIA 2
 * 
 * Este módulo implementa un sistema de renovación automática de tokens
 * para mantener la sesión activa sin interrumpir la experiencia del usuario.
 */

import apiClient from '../services/api.config.js';

class TokenRefreshManager {
  constructor() {
    this.refreshTimer = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.refreshInterval = 30 * 60 * 1000; // 30 minutos en milisegundos
    this.warningTime = 5 * 60 * 1000; // 5 minutos antes de expirar
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 segundos
    this.listeners = [];
  }

  /**
   * Inicia el sistema de refresh automático
   */
  iniciar() {
    console.log('🔄 Iniciando sistema de refresh tokens automático');
    
    // Verificar si ya hay un token
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No hay token disponible, no se iniciará el refresh automático');
      return;
    }

    // Programar el primer refresh
    this.programarProximoRefresh();
    
    // Escuchar cambios en el localStorage (para múltiples pestañas)
    window.addEventListener('storage', this.manejarCambioStorage.bind(this));
    
    // Escuchar visibilidad de la página (para pausar cuando no está visible)
    document.addEventListener('visibilitychange', this.manejarCambioVisibilidad.bind(this));
    
    console.log('✅ Sistema de refresh tokens iniciado correctamente');
  }

  /**
   * Detiene el sistema de refresh automático
   */
  detener() {
    console.log('🛑 Deteniendo sistema de refresh tokens');
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    this.isRefreshing = false;
    this.refreshPromise = null;
    
    // Remover event listeners
    window.removeEventListener('storage', this.manejarCambioStorage.bind(this));
    document.removeEventListener('visibilitychange', this.manejarCambioVisibilidad.bind(this));
    
    console.log('✅ Sistema de refresh tokens detenido');
  }

  /**
   * Programa el próximo refresh del token
   */
  programarProximoRefresh() {
    // Limpiar timer anterior si existe
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Programar el siguiente refresh
    this.refreshTimer = setTimeout(() => {
      this.refrescarToken();
    }, this.refreshInterval);

    console.log(`⏰ Próximo refresh programado en ${this.refreshInterval / 1000 / 60} minutos`);
  }

  /**
   * Realiza el refresh del token
   */
  async refrescarToken(forzar = false) {
    // Evitar múltiples refreshes simultáneos
    if (this.isRefreshing && !forzar) {
      console.log('⏳ Refresh ya en progreso, esperando...');
      return this.refreshPromise;
    }

    // Verificar si hay token disponible
    const tokenActual = localStorage.getItem('token');
    if (!tokenActual) {
      console.log('❌ No hay token para refrescar');
      return { success: false, error: 'No hay token disponible' };
    }

    this.isRefreshing = true;
    console.log('🔄 Iniciando refresh del token...');

    this.refreshPromise = this.ejecutarRefresh();
    const resultado = await this.refreshPromise;
    
    this.isRefreshing = false;
    this.refreshPromise = null;

    return resultado;
  }

  /**
   * Ejecuta el proceso de refresh con reintentos
   */
  async ejecutarRefresh() {
    let ultimoError = null;

    for (let intento = 1; intento <= this.maxRetries; intento++) {
      try {
        console.log(`🔄 Intento de refresh ${intento}/${this.maxRetries}`);
        
        const response = await apiClient.post('/auth/refresh', {}, {
          timeout: 10000,
          maxRetries: 0 // No reintentar a nivel de API, lo manejamos aquí
        });

        if (response && response.token) {
          // Actualizar token en localStorage
          localStorage.setItem('token', response.token);
          
          // Actualizar timestamp de autenticación
          localStorage.setItem('auth_timestamp', new Date().toISOString());
          
          console.log('✅ Token refresheado exitosamente');
          
          // Notificar a los listeners
          this.notificarListeners({ success: true, nuevoToken: response.token });
          
          // Programar el siguiente refresh
          this.programarProximoRefresh();
          
          return { success: true, token: response.token };
        } else {
          throw new Error('Respuesta de refresh sin token');
        }

      } catch (error) {
        console.warn(`⚠️ Error en intento ${intento}:`, error.message);
        ultimoError = error;
        
        // Si es un error de autorización, no reintentamos
        if (error.status === 401 || error.status === 403) {
          console.error('❌ Error de autorización, token inválido');
          this.manejarTokenInvalido();
          return { success: false, error: 'Token inválido', shouldLogout: true };
        }
        
        // Esperar antes del siguiente intento
        if (intento < this.maxRetries) {
          console.log(`⏳ Esperando ${this.retryDelay / 1000}s antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    console.error('❌ Falló el refresh después de todos los intentos:', ultimoError?.message);
    
    // Notificar a los listeners sobre el fallo
    this.notificarListeners({ success: false, error: ultimoError });
    
    // Programar un retry en más tiempo
    setTimeout(() => {
      console.log('🔄 Reintentando refresh después de fallo...');
      this.refrescarToken(true);
    }, this.retryDelay * 2);

    return { success: false, error: ultimoError?.message || 'Error desconocido' };
  }

  /**
   * Maneja cuando el token es inválido
   */
  manejarTokenInvalido() {
    console.log('🚨 Token inválido detectado, limpiando sesión...');
    
    // Detener el sistema de refresh
    this.detener();
    
    // Limpiar almacenamiento
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Notificar que la sesión expiró
    this.notificarListeners({ success: false, sessionExpired: true });
  }

  /**
   * Maneja cambios en el localStorage (múltiples pestañas)
   */
  manejarCambioStorage(event) {
    if (event.key === 'token') {
      if (!event.newValue) {
        // Token fue removido, detener refresh
        console.log('🔍 Token removido en otra pestaña, deteniendo refresh');
        this.detener();
      } else if (event.newValue !== event.oldValue) {
        // Token fue actualizado en otra pestaña, reprogramar refresh
        console.log('🔍 Token actualizado en otra pestaña, reprogramando refresh');
        this.programarProximoRefresh();
      }
    }
  }

  /**
   * Maneja cambios en la visibilidad de la página
   */
  manejarCambioVisibilidad() {
    if (document.visibilityState === 'visible') {
      // Página se volvió visible, verificar si necesitamos refresh inmediato
      const authTimestamp = localStorage.getItem('auth_timestamp');
      if (authTimestamp) {
        const tiempoTranscurrido = Date.now() - new Date(authTimestamp).getTime();
        
        // Si han pasado más de 45 minutos, hacer refresh inmediato
        if (tiempoTranscurrido > 45 * 60 * 1000) {
          console.log('🔍 Página visible después de tiempo prolongado, refresheando token...');
          this.refrescarToken(true);
        }
      }
    }
  }

  /**
   * Añade un listener para eventos del sistema de refresh
   */
  agregarListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remueve un listener
   */
  removerListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifica a todos los listeners sobre eventos del refresh
   */
  notificarListeners(evento) {
    this.listeners.forEach(listener => {
      try {
        listener(evento);
      } catch (error) {
        console.error('Error en listener de refresh:', error);
      }
    });
  }

  /**
   * Obtiene el estado actual del sistema de refresh
   */
  obtenerEstado() {
    return {
      activo: !!this.refreshTimer,
      refresheando: this.isRefreshing,
      proximoRefresh: this.refreshTimer ? Date.now() + this.refreshInterval : null,
      listenersActivos: this.listeners.length
    };
  }

  /**
   * Fuerza un refresh inmediato
   */
  async forzarRefresh() {
    console.log('🔧 Refresh forzado por usuario/sistema');
    return await this.refrescarToken(true);
  }
}

// Instancia global del manager
const tokenRefreshManager = new TokenRefreshManager();

// Inicializar automáticamente cuando se carga el módulo
// Solo si estamos en el browser y hay un token
if (typeof window !== 'undefined' && localStorage.getItem('token')) {
  // Inicializar después de un pequeño delay para asegurar que todo esté cargado
  setTimeout(() => {
    tokenRefreshManager.iniciar();
  }, 1000);
}

export default tokenRefreshManager;
export { TokenRefreshManager };
