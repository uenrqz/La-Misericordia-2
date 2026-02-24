import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserMd, FaUserNurse, FaUserCog, FaTachometerAlt, FaTools } from 'react-icons/fa';

/**
 * Componente que muestra un selector de dashboard según el rol del usuario
 * Permite cambiar entre diferentes vistas de dashboard para administrador, médico y enfermero
 * Solo disponible para el usuario administrador "ulises enriquez"
 */
const UserDashboardSelector = ({ className = '' }) => {
  const [currentRole, setCurrentRole] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  // Verificar si el usuario actual es "ulises enriquez" con rol admin
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // Verificar si es el usuario autorizado (ulises enriquez)
        // Comprobamos posibles variaciones de nombre de usuario, email y que tenga rol admin
        const isUlisesEnriquez = 
          (user.username === 'ulises.enriquez' || 
           user.username === 'u.enrqz' || 
           user.username === 'ulises' ||
           user.name?.toLowerCase().includes('ulises') ||
           user.name?.toLowerCase().includes('enriquez') ||
           user.email === 'ulises.enriquez@lamisericordia.org' ||
           user.email?.toLowerCase().includes('ulises.enriquez')) && 
          (user.role === 'admin' || user.rol === 'admin' || 
           (user.roles && Array.isArray(user.roles) && user.roles.includes('admin')));
        
        // Actualizar estado de autorización
        setIsAuthorized(isUlisesEnriquez);
        
        if (isUlisesEnriquez) {
          // Si el usuario está autorizado, recuperamos el dashboard seleccionado previamente
          // o usamos su rol actual como valor predeterminado
          const savedDashboard = localStorage.getItem('selectedDashboard');
          if (savedDashboard && dashboards.some(d => d.id === savedDashboard)) {
            setCurrentRole(savedDashboard);
            console.log('Recuperando dashboard seleccionado previamente:', savedDashboard);
          } else {
            // Si no hay selección previa, usar el rol actual del usuario
            setCurrentRole(user.role || user.rol || 'enfermero');
          }
          
          console.log('Usuario autorizado para usar el selector de dashboard:', user.username || user.email);
        } else {
          setCurrentRole(user.role || user.rol || 'enfermero');
          console.log('Usuario no autorizado para usar el selector de dashboard:', user.username || user.email || 'desconocido');
        }
      } catch (e) {
        console.error('Error al obtener información del usuario:', e);
        setCurrentRole('enfermero');
        setIsAuthorized(false);
      }
    }
  }, []);

  // Configuración de los dashboards disponibles
  const dashboards = [
    {
      id: 'admin',
      name: 'Administrador',
      description: 'Gestión de usuarios, donaciones y reportes',
      icon: <FaUserCog className="h-5 w-5 mr-2" />,
      url: '/app/dashboard'
    },
    {
      id: 'medico',
      name: 'Médico',
      description: 'Gestión de pacientes y órdenes médicas',
      icon: <FaUserMd className="h-5 w-5 mr-2" />,
      url: '/app/medicos-dashboard'
    },
    {
      id: 'enfermero',
      name: 'Enfermero/a',
      description: 'Signos vitales y medicamentos',
      icon: <FaUserNurse className="h-5 w-5 mr-2" />,
      url: '/app/enfermeria-dashboard'
    }
  ];

  // Encontrar el dashboard actual
  const currentDashboard = dashboards.find(d => d.id === currentRole) || dashboards[2];

  // Manejar el cambio de dashboard
  const handleDashboardChange = (dashboardId) => {
    // Verificar nuevamente la autorización antes de cambiar
    if (!isAuthorized) {
      console.warn('Usuario no autorizado intentando cambiar el dashboard');
      return;
    }
    
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (dashboard) {
      setCurrentRole(dashboardId);
      setIsOpen(false);
      
      // Guardar el rol seleccionado en localStorage para mantener la selección
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          // No modificamos el rol real del usuario, solo para la vista del dashboard
          localStorage.setItem('selectedDashboard', dashboardId);
        }
      } catch (e) {
        console.error('Error al guardar el dashboard seleccionado:', e);
      }
      
      // Navegar al dashboard seleccionado
      navigate(dashboard.url);
    }
  };

  // Si el usuario no es autorizado, no renderizamos el componente
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaTools className="mr-1 text-yellow-600" /> 
            <span className="text-yellow-700">Herramienta de Soporte - Cambiar Dashboard</span>
          </label>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full mb-2">
            Modo Soporte - {currentRole}
          </span>
        </div>
        <div className="border border-yellow-300 rounded-md p-2 bg-yellow-50 mb-2">
          <p className="text-xs text-yellow-700">
            <strong>Solo para soporte técnico.</strong> Esta herramienta permite cambiar entre los diferentes dashboards para pruebas y soporte.
          </p>
        </div>
        <button
          type="button"
          className="bg-white relative w-full border border-yellow-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
          aria-haspopup="listbox"
          aria-expanded="true"
          aria-labelledby="listbox-label"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center">
            {currentDashboard.icon}
            <span className="ml-3 block truncate">{currentDashboard.name}</span>
          </span>
          <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-yellow-500 ring-opacity-80 overflow-auto focus:outline-none sm:text-sm">
          <div className="bg-yellow-100 text-yellow-800 px-3 py-2 text-xs border-b border-yellow-200">
            <FaTachometerAlt className="inline mr-1" /> Seleccione el Dashboard para simular el rol
          </div>
          <ul tabIndex="-1" role="listbox" aria-labelledby="listbox-label" aria-activedescendant="listbox-option-3">
            {dashboards.map((dashboard) => (
              <li
                key={dashboard.id}
                id={`listbox-option-${dashboard.id}`}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-yellow-50 transition-colors duration-150 ${
                  currentRole === dashboard.id ? 'bg-yellow-100 text-yellow-900' : 'text-gray-900'
                }`}
                role="option"
                onClick={() => handleDashboardChange(dashboard.id)}
              >
                <div className="flex items-center">
                  <div className={`${currentRole === dashboard.id ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {dashboard.icon}
                  </div>
                  <div className="ml-2">
                    <div className={`block truncate ${currentRole === dashboard.id ? 'font-semibold' : 'font-normal'}`}>
                      {dashboard.name}
                    </div>
                    <div className="text-xs text-gray-500">{dashboard.description}</div>
                  </div>
                </div>

                {currentRole === dashboard.id && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-yellow-600">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserDashboardSelector;
