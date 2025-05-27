import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente para mostrar notificaciones del sistema, especialmente
 * para errores 500 y problemas de conectividad.
 */
const SystemNotification = ({ 
  message, 
  type = 'error', 
  duration = 5000, 
  onClose,
  showCloseButton = true,
  showIcon = true
}) => {
  const [visible, setVisible] = useState(true);

  // Ocultar automáticamente después de la duración especificada
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Manejar cierre manual
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  // No renderizar si no es visible
  if (!visible) return null;
  
  // Estilos basados en el tipo
  const notificationStyles = {
    error: {
      bg: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: 'fas fa-exclamation-circle text-red-500'
    },
    warning: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-500',
      text: 'text-yellow-800',
      icon: 'fas fa-exclamation-triangle text-yellow-500'
    },
    info: {
      bg: 'bg-blue-100',
      border: 'border-blue-500',
      text: 'text-blue-800',
      icon: 'fas fa-info-circle text-blue-500'
    },
    success: {
      bg: 'bg-green-100',
      border: 'border-green-500',
      text: 'text-green-800',
      icon: 'fas fa-check-circle text-green-500'
    }
  };
  
  const style = notificationStyles[type] || notificationStyles.info;

  return (
    <div className={`fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 rounded-lg p-4 ${style.bg} border ${style.border} shadow-lg animate-fade-in`}>
      <div className="flex items-center">
        {showIcon && (
          <div className="flex-shrink-0 mr-3">
            <i className={`${style.icon} text-lg`}></i>
          </div>
        )}
        <div className={`flex-grow ${style.text}`}>
          {message}
        </div>
        {showCloseButton && (
          <button
            type="button"
            onClick={handleClose}
            className={`ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 ${style.text} hover:bg-opacity-25 hover:bg-gray-500 inline-flex h-8 w-8 focus:outline-none`}
          >
            <span className="sr-only">Cerrar</span>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
};

SystemNotification.propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  type: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  duration: PropTypes.number,
  onClose: PropTypes.func,
  showCloseButton: PropTypes.bool,
  showIcon: PropTypes.bool
};

/**
 * Componente específico para notificaciones de error 500
 */
export const Error500Notification = ({ onRetry }) => {
  return (
    <SystemNotification
      type="error"
      duration={0} // No ocultar automáticamente
      message={
        <div>
          <p className="font-bold">Error del servidor (500)</p>
          <p className="text-sm">Se ha producido un error en el servidor. Por favor, inténtalo de nuevo más tarde.</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-2 text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-xs px-3 py-1.5"
            >
              Reintentar
            </button>
          )}
        </div>
      }
    />
  );
};

/**
 * Componente para notificaciones de desconexión
 */
export const DisconnectedNotification = ({ onReconnect }) => {
  return (
    <SystemNotification
      type="warning"
      duration={0}
      message={
        <div>
          <p className="font-bold">Problemas de conexión</p>
          <p className="text-sm">No se puede conectar con el servidor. Verifica tu conexión a internet.</p>
          {onReconnect && (
            <button 
              onClick={onReconnect}
              className="mt-2 text-white bg-yellow-600 hover:bg-yellow-700 font-medium rounded-lg text-xs px-3 py-1.5"
            >
              Reconectar
            </button>
          )}
        </div>
      }
    />
  );
};

/**
 * Componente para notificaciones de sesión expirada
 */
export const SessionExpiredNotification = ({ onLogin }) => {
  return (
    <SystemNotification
      type="info"
      duration={10000}
      message={
        <div>
          <p className="font-bold">Sesión expirada</p>
          <p className="text-sm">Tu sesión ha expirado. Por favor, inicia sesión nuevamente.</p>
          {onLogin && (
            <button 
              onClick={onLogin}
              className="mt-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-xs px-3 py-1.5"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      }
    />
  );
};

/**
 * Componente para notificaciones de cambio obligatorio de contraseña
 */
export const PasswordChangeRequiredNotification = ({ onCambiarPassword }) => {
  return (
    <SystemNotification
      type="warning"
      duration={0}
      message={
        <div>
          <p className="font-bold">Cambio de contraseña requerido</p>
          <p className="text-sm">Por motivos de seguridad, debes cambiar tu contraseña temporal antes de continuar.</p>
          {onCambiarPassword && (
            <button 
              onClick={onCambiarPassword}
              className="mt-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-xs px-3 py-1.5"
            >
              Cambiar contraseña
            </button>
          )}
        </div>
      }
    />
  );
};

/**
 * Componente para notificaciones de solicitud de aprobación de administrador
 */
export const AdminApprovalNotification = ({ pendingCount, onVerSolicitudes }) => {
  return (
    <SystemNotification
      type="info"
      duration={10000}
      message={
        <div>
          <p className="font-bold">Solicitudes pendientes</p>
          <p className="text-sm">Hay {pendingCount} solicitud(es) de aprobación para nuevos administradores pendiente(s).</p>
          {onVerSolicitudes && (
            <button 
              onClick={onVerSolicitudes}
              className="mt-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-xs px-3 py-1.5"
            >
              Ver solicitudes
            </button>
          )}
        </div>
      }
    />
  );
};

export default SystemNotification;
