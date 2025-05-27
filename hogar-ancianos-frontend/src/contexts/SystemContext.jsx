import React, { createContext, useState, useContext, useEffect } from 'react';
import SystemNotification, { 
  Error500Notification, 
  DisconnectedNotification, 
  SessionExpiredNotification,
  PasswordChangeRequiredNotification,
  AdminApprovalNotification 
} from '../components/ui/SystemNotification';
import { recuperarDeErrores500, diagnosticarErrores500 } from '../utils/errorHandler';
import apiClient from '../services/api.service';
import tokenRefreshManager from '../utils/tokenRefreshManager';

// Crear contexto
const SystemContext = createContext();

/**
 * Proveedor de contexto para el estado del sistema
 * Maneja notificaciones de errores globales y estado de conectividad
 */
export const SystemProvider = ({ children }) => {
  // Estado para errores y estado del sistema
  const [error500, setError500] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    bff: 'unknown',
    backend: 'unknown',
    lastCheck: null
  });

  // Estado para notificaciones personalizadas
  const [notification, setNotification] = useState(null);
  
  // Estado del sistema de refresh tokens
  const [tokenRefreshStatus, setTokenRefreshStatus] = useState({
    active: false,
    lastRefresh: null,
    nextRefresh: null
  });

  // Efecto para verificar la conexión periódicamente
  useEffect(() => {
    // Verificar conexión inicial
    checkSystemStatus();
    
    // Configurar verificación periódica cada 30 segundos para el status del sistema
    const statusIntervalId = setInterval(() => {
      checkSystemStatus();
    }, 30000);
    
    // Verificar sesión inicial
    checkSessionStatus();
    
    // Configurar verificación periódica cada 2 minutos para la sesión
    const sessionIntervalId = setInterval(() => {
      checkSessionStatus();
    }, 2 * 60 * 1000);
    
    // Limpiar intervalos al desmontar
    return () => {
      clearInterval(statusIntervalId);
      clearInterval(sessionIntervalId);
    };
  }, []);
  
  // Efecto para escuchar eventos del sistema de refresh tokens
  useEffect(() => {
    // Escuchar eventos del sistema de refresh tokens
    const listener = (evento) => {
      if (evento.success) {
        setTokenRefreshStatus({
          active: true,
          lastRefresh: new Date().toISOString(),
          nextRefresh: new Date(Date.now() + tokenRefreshManager.refreshInterval).toISOString()
        });
      } else if (evento.sessionExpired) {
        setSessionExpired(true);
      }
    };

    tokenRefreshManager.agregarListener(listener);

    // Limpiar listener al desmontar
    return () => {
      tokenRefreshManager.removerListener(listener);
    };
  }, []);
  
  // Verificar el estado del sistema
  const checkSystemStatus = async () => {
    try {
      console.log('Verificando estado del sistema...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // URL dinámica basada en el entorno
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:4000/api/bff' 
        : `${window.location.protocol}//${window.location.hostname}/api/bff`;
      
      console.log(`Consultando estado del sistema en: ${baseUrl}/status`);
      
      const response = await fetch(`${baseUrl}/status`, { 
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('BFF está en línea');
        setSystemStatus(prev => ({
          ...prev,
          bff: 'online',
          lastCheck: new Date()
        }));
        setDisconnected(false);
        
        // También verificar backend si BFF está online
        checkBackendStatus();
      } else {
        setSystemStatus(prev => ({
          ...prev,
          bff: 'error',
          lastCheck: new Date()
        }));
        setDisconnected(true);
      }
    } catch (error) {
      console.error('Error al verificar estado del sistema:', error);
      setSystemStatus(prev => ({
        ...prev,
        bff: 'offline',
        lastCheck: new Date()
      }));
      setDisconnected(true);
    }
  };
  
  // Verificar estado del backend a través del BFF
  const checkBackendStatus = async () => {
    try {
      console.log('Verificando estado del backend...');
      
      // En producción, asumimos que si el BFF está activo, el backend también lo está
      // No hacemos una verificación adicional para evitar errores CORS o de seguridad
      setSystemStatus(prev => ({
        ...prev,
        backend: prev.bff === 'online' ? 'online' : 'unknown'
      }));
      
    } catch (error) {
      console.error('Error al verificar estado del backend:', error);
      setSystemStatus(prev => ({
        ...prev,
        backend: 'offline'
      }));
    }
  };
  
  // Verificar el estado de la sesión actual
  const checkSessionStatus = async () => {
    try {
      // Solo verificamos la sesión si hay un token almacenado
      const token = localStorage.getItem('token');
      if (!token) {
        // No hay sesión que verificar
        return;
      }
      
      // Verificamos si el sistema está conectado
      if (systemStatus.bff !== 'online') {
        return; // No podemos verificar la sesión si el BFF no está online
      }
      
      console.log('Verificando estado de la sesión...');
      
      // Verificar la sesión con el BFF
      const response = await apiClient.get('/auth/verify', { 
        timeout: 5000,
        maxRetries: 0 // No reintentar para este tipo de petición
      });
      
      if (!response || !response.authenticated) {
        console.warn('Sesión expirada o inválida');
        setSessionExpired(true);
        // No eliminamos el token aquí, lo dejamos para que el usuario pueda ver el mensaje
      } else {
        console.log('Sesión verificada y válida');
        // Resetear el estado si estaba marcado como expirado
        if (sessionExpired) {
          setSessionExpired(false);
        }
      }
    } catch (error) {
      console.error('Error al verificar el estado de la sesión:', error);
      // Solo marcar como expirada si es un error de autorización
      if (error.status === 401) {
        setSessionExpired(true);
      }
    }
  };
  
  // Manejar error 500
  const handleError500 = async () => {
    setError500(true);
    
    // Intentar diagnosticar el problema
    const diagnostico = diagnosticarErrores500();
    console.info('Diagnóstico de errores 500:', diagnostico);
    
    // Verificar el estado del sistema
    await checkSystemStatus();
  };
  
  // Intentar recuperarse de error 500
  const recoverFromError500 = async () => {
    try {
      const recovered = await recuperarDeErrores500();
      if (recovered) {
        setError500(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en el proceso de recuperación:', error);
      return false;
    }
  };
  
  // Intentar reconectar
  const handleReconnect = async () => {
    await checkSystemStatus();
  };
  
  // Manejar sesión expirada
  const handleSessionExpired = () => {
    setSessionExpired(true);
  };
  
  // Redireccionar a login
  const redirectToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };
  
  // Mostrar una notificación personalizada
  const showNotification = (type, title, message, duration = 5000) => {
    setNotification({
      type, 
      title, 
      message,
      duration
    });
    
    // Limpiar la notificación después de la duración especificada
    if (duration) {
      setTimeout(() => {
        setNotification(null);
      }, duration);
    }
  };
  
  // Cerrar la notificación manualmente
  const closeNotification = () => {
    setNotification(null);
  };
  
  // Manejar inicio de sesión exitoso
  const handleLoginSuccess = () => {
    // Iniciar el sistema de refresh tokens
    tokenRefreshManager.iniciar();
    
    // Actualizar estado del sistema
    setTokenRefreshStatus({
      active: true,
      lastRefresh: new Date().toISOString(),
      nextRefresh: new Date(Date.now() + tokenRefreshManager.refreshInterval).toISOString()
    });
    
    // Verificar estado del sistema
    checkSystemStatus();
  };
  
  // Manejar cierre de sesión
  const handleLogout = () => {
    // Detener el sistema de refresh tokens
    tokenRefreshManager.detener();
    
    // Limpiar estado del sistema
    setTokenRefreshStatus({
      active: false,
      lastRefresh: null,
      nextRefresh: null
    });
    
    // Limpiar token y datos de usuario
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Redirigir a login
    window.location.href = '/login';
  };
  
  // Forzar refresh del token
  const forceTokenRefresh = async () => {
    try {
      const resultado = await tokenRefreshManager.forzarRefresh();
      if (resultado.success) {
        showNotification(
          'success',
          'Token Actualizado',
          'La sesión se ha renovado exitosamente.'
        );
        return true;
      } else {
        showNotification(
          'error',
          'Error al Renovar Sesión',
          'No se pudo renovar la sesión. Por favor intente nuevamente.'
        );
        return false;
      }
    } catch (error) {
      console.error('Error al forzar refresh del token:', error);
      showNotification(
        'error',
        'Error al Renovar Sesión',
        'Ocurrió un error al intentar renovar la sesión.'
      );
      return false;
    }
  };
  
  // Valor del contexto
  const contextValue = {
    // Estado del sistema
    systemStatus,
    error500,
    disconnected,
    sessionExpired,
    tokenRefreshStatus,

    // Manejo de errores y sistema
    handleError500,
    recoverFromError500,
    checkSystemStatus,
    checkSessionStatus,
    
    // Manejo de autenticación
    redirectToLogin,
    handleSessionExpired,
    handleLoginSuccess,
    handleLogout,
    forceTokenRefresh,
    
    // Notificaciones
    showNotification,
    closeNotification
  };

  return (
    <SystemContext.Provider value={contextValue}>
      {children}
      
      {/* Notificaciones de sistema */}
      {error500 && (
        <Error500Notification
          onRetry={recoverFromError500}
        />
      )}
      
      {disconnected && !error500 && (
        <DisconnectedNotification
          onReconnect={handleReconnect}
        />
      )}
      
      {sessionExpired && !disconnected && !error500 && (
        <SessionExpiredNotification
          onLogin={redirectToLogin}
        />
      )}
      
      {/* Notificación personalizada */}
      {notification && (
        <SystemNotification
          type={notification.type}
          message={
            <div>
              {notification.title && <p className="font-bold">{notification.title}</p>}
              <p className={notification.title ? "text-sm" : ""}>{notification.message}</p>
            </div>
          }
          duration={notification.duration}
          onClose={closeNotification}
        />
      )}
    </SystemContext.Provider>
  );
};

// Hook para usar el contexto
export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem debe usarse dentro de un SystemProvider');
  }
  return context;
};

export default SystemContext;
