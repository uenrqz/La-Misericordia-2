import React, { useState, useEffect } from 'react';
import * as satService from '../../services/sat.service';

// Componente para manejar la sesión de SAT
const SesionSAT = ({ onSesionChange }) => {
  // Estados para manejar la información del formulario y la sesión
  const [formData, setFormData] = useState({
    usuario: '',
    password: '',
    nit: '',
    certificadorNit: ''
  });
  
  const [sesion, setSesion] = useState({
    active: false,
    expiration: null,
    timeLeft: 0,
    environment: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Verificar estado de sesión al cargar el componente
  useEffect(() => {
    checkSesionStatus();
    
    // Verificar la sesión cada minuto
    const interval = setInterval(checkSesionStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Función para verificar el estado actual de la sesión
  const checkSesionStatus = async () => {
    try {
      const response = await satService.verificarSesionSAT();
      if (response.success && response.estadoSesion) {
        setSesion({
          active: response.estadoSesion.sesionActiva,
          expiration: response.estadoSesion.expiracion,
          timeLeft: response.estadoSesion.tiempoRestante,
          environment: response.estadoSesion.ambiente
        });
        
        if (onSesionChange) {
          onSesionChange(response.estadoSesion.sesionActiva);
        }
      }
    } catch (err) {
      console.error('Error al verificar estado de sesión:', err);
    }
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Manejar envío del formulario de inicio de sesión
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const response = await satService.iniciarSesionSAT(formData);
      
      if (response.success) {
        setMessage('Sesión iniciada correctamente con SAT');
        // Limpiar formulario después de inicio de sesión exitoso
        setFormData({
          usuario: '',
          password: '',
          nit: '',
          certificadorNit: ''
        });
        checkSesionStatus(); // Actualizar estado de sesión
      } else {
        setError(response.mensaje || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al conectar con el servicio de SAT');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cierre de sesión
  const handleLogout = async () => {
    setLoading(true);
    
    try {
      const response = await satService.cerrarSesionSAT();
      
      if (response.success) {
        setMessage('Sesión cerrada correctamente');
        setSesion({
          active: false,
          expiration: null,
          timeLeft: 0,
          environment: sesion.environment
        });
        
        if (onSesionChange) {
          onSesionChange(false);
        }
      } else {
        setError(response.mensaje || 'Error al cerrar sesión');
      }
    } catch (err) {
      setError('Error al cerrar sesión con SAT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Sesión SAT para Facturación Electrónica</h2>
      
      {/* Mostrar estado actual de la sesión */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="font-medium">Estado de la sesión:</p>
        <div className="flex items-center mt-2">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${sesion.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{sesion.active ? 'Activa' : 'Inactiva'}</span>
        </div>
        
        {sesion.active && (
          <div className="mt-2 text-sm text-gray-600">
            <p>Tiempo restante: {sesion.timeLeft} minutos</p>
            <p>Ambiente: {sesion.environment === 'production' ? 'Producción' : 'Desarrollo'}</p>
          </div>
        )}
      </div>
      
      {/* Mostrar mensajes de error o éxito */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {message}
        </div>
      )}
      
      {/* Mostrar formulario solo si no hay sesión activa */}
      {!sesion.active ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 mb-1">
              Usuario SAT <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="usuario"
              name="usuario"
              value={formData.usuario}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="nit" className="block text-sm font-medium text-gray-700 mb-1">
              NIT del Emisor (opcional)
            </label>
            <input
              type="text"
              id="nit"
              name="nit"
              value={formData.nit}
              onChange={handleChange}
              placeholder="Deje en blanco para usar el NIT configurado"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="certificadorNit" className="block text-sm font-medium text-gray-700 mb-1">
              NIT del Certificador (opcional)
            </label>
            <input
              type="text"
              id="certificadorNit"
              name="certificadorNit"
              value={formData.certificadorNit}
              onChange={handleChange}
              placeholder="Deje en blanco para usar el configurado por defecto"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión con SAT'}
          </button>
        </form>
      ) : (
        <div className="mt-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-300"
            disabled={loading}
          >
            {loading ? 'Cerrando sesión...' : 'Cerrar Sesión SAT'}
          </button>
          <p className="mt-2 text-sm text-gray-600">
            La sesión se cerrará automáticamente después de 24 horas de inactividad.
          </p>
        </div>
      )}
    </div>
  );
};

export default SesionSAT;
