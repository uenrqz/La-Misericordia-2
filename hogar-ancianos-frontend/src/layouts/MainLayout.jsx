import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import authService from '../services/auth.service';
import diagnosticService from '../services/diagnostic.service';
import { initFlowbite } from 'flowbite';
import { useSystem } from '../contexts/SystemContext';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleError500, systemStatus, checkSystemStatus } = useSystem();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Cambiado a false por defecto para Mac
  const [currentUser, setCurrentUser] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Función para manejar el redimensionamiento de la ventana
  const handleResize = () => {
    if (window.innerWidth >= 768) { // md breakpoint
      // En pantallas grandes, mantener el estado actual o abrir si es la primera vez
      // No cambiar automáticamente para respetar la preferencia del usuario
    } else {
      // En móviles, cerrar automáticamente
      setIsSidebarOpen(false);
    }
  };

  // Efecto para inicializar la UI y verificar autenticación
  useEffect(() => {
    try {
      initFlowbite();
      
      // Configurar el estado inicial basado en el tamaño de pantalla
      handleResize();
      window.addEventListener('resize', handleResize);
      
      // Obtener usuario actual desde localStorage
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      
      // Redireccionar a dashboard según rol
      if (user && location.pathname === '/app/dashboard') {
        if (user.role === 'medico' || user.rol === 'medico') {
          navigate('/app/medicos');
        } else if (user.role === 'enfermera' || user.rol === 'enfermera') {
          navigate('/app/enfermeria');
        }
      }
      
      // Verificar la autenticación con el servidor
      authService.verifyToken()
        .then(result => {
          if (!result.authenticated) {
            console.log('Sesión expirada o inválida. Redirigiendo al login...');
            handleLogout();
          }
        })
        .catch(error => {
          // Si el error es 401, no redirigir inmediatamente, dejar que el interceptor de Axios intente refrescar
          if (error?.status !== 401) {
            console.error("Error al verificar la autenticación:", error);
          }
        });
    } catch (error) {
      console.error("Error en MainLayout useEffect:", error);
      // Manejo de error para evitar que la aplicación se rompa
      if (error.response && error.response.status === 500) {
        console.error("Error del servidor (500):", error);
        handleError500();
      }
    }

    // Cleanup function para remover el event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [location, navigate, handleError500]);
  
  // Efecto para comprobar el estado del sistema
  useEffect(() => {
    const checkSystemStatusAndUpdate = async () => {
      try {
        await checkSystemStatus();
        
        // Mostrar modal de advertencia si hay problemas
        if (systemStatus.bff !== 'online' || systemStatus.backend !== 'online') {
          setShowStatusModal(true);
        }
      } catch (error) {
        console.error("Error al comprobar el estado del sistema:", error);
      }
    };
    
    // Comprobar estado al inicio
    checkSystemStatusAndUpdate();
    
    // Programar comprobaciones cada 2 minutos
    const statusInterval = setInterval(checkSystemStatusAndUpdate, 120000);
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(statusInterval);
  }, [checkSystemStatus, systemStatus]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Efecto para manejar el teclado (ESC para cerrar sidebar)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const renderMenuItems = () => {
    const user = currentUser || authService.getCurrentUser();
    const role = user?.role || user?.rol || 'admin';
    
    return (
      <ul className="space-y-2 font-medium">
        <li>
          <Link
            to={role === 'medico' ? '/app/medicos' : role === 'enfermera' ? '/app/enfermeria' : '/app/dashboard'}
            className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${
              location.pathname === '/app/dashboard' || 
              location.pathname === '/app/medicos' || 
              location.pathname === '/app/enfermeria' 
                ? 'bg-primary-100 text-primary-600' 
                : ''
            }`}
          >
            <i className="fas fa-chart-line w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
            <span className="ms-3">Dashboard</span>
          </Link>
        </li>
        <li>
          <Link
            to="/app/residentes"
            className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname.includes('/app/residentes') ? 'bg-primary-100 text-primary-600' : ''}`}
          >
            <i className="fas fa-users w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
            <span className="ms-3">Pacientes</span>
          </Link>
        </li>
        {/* Signos Vitales - Visible para enfermeras y admin */}
        {(role === 'enfermera' || role === 'admin') && (
          <li>
            <Link
              to="/app/signos-vitales"
              className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname === '/app/signos-vitales' ? 'bg-primary-100 text-primary-600' : ''}`}
            >
              <i className="fas fa-heartbeat w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
              <span className="ms-3">Signos Vitales</span>
            </Link>
          </li>
        )}
        {/* Órdenes Médicas - Visible para médicos y admin */}
        {(role === 'medico' || role === 'admin') && (
          <li>
            <Link
              to="/app/ordenes-medicas"
              className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname === '/app/ordenes-medicas' ? 'bg-primary-100 text-primary-600' : ''}`}
            >
              <i className="fas fa-prescription w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
              <span className="ms-3">Órdenes Médicas</span>
            </Link>
          </li>
        )}
        {/* Evoluciones - Visible para médicos, enfermeras y admin */}
        <li>
          <Link
            to="/app/evoluciones"
            className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname === '/app/evoluciones' ? 'bg-primary-100 text-primary-600' : ''}`}
          >
            <i className="fas fa-file-medical w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
            <span className="ms-3">Evoluciones</span>
          </Link>
        </li>
        {/* Donaciones - Solo visible para admin */}
        {role === 'admin' && (
          <li>
            <Link
              to="/app/donaciones"
              className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname === '/app/donaciones' ? 'bg-primary-100 text-primary-600' : ''}`}
            >
              <i className="fas fa-hand-holding-heart w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
              <span className="ms-3">Donaciones</span>
            </Link>
          </li>
        )}
        {/* Reportes - Solo visible para admin */}
        {role === 'admin' && (
          <li>
            <Link
              to="/app/reportes"
              className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname === '/app/reportes' ? 'bg-primary-100 text-primary-600' : ''}`}
            >
              <i className="fas fa-chart-bar w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
              <span className="ms-3">Reportes</span>
            </Link>
          </li>
        )}
        
        {/* Administración de Usuarios - Solo para administradores */}
        {role === 'admin' && (
          <li>
            <Link
              to="/app/usuarios"
              className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname.includes('/app/usuarios') ? 'bg-primary-100 text-primary-600' : ''}`}
            >
              <i className="fas fa-user-cog w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
              <span className="ms-3">Administrar Usuarios</span>
            </Link>
          </li>
        )}

        {/* Diagnóstico del Sistema - Solo para administradores */}
        {role === 'admin' && (
          <li>
            <Link
              to="/app/diagnostico"
              className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname.includes('/app/diagnostico') ? 'bg-primary-100 text-primary-600' : ''}`}
            >
              <i className="fas fa-stethoscope w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
              <span className="ms-3">Diagnóstico del Sistema</span>
            </Link>
          </li>
        )}
        
        <li>
          <button
            onClick={handleLogout}
            className="flex w-full items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
          >
            <i className="fas fa-sign-out-alt w-5 h-5 text-red-500 group-hover:text-red-700"></i>
            <span className="ms-3 text-red-500 group-hover:text-red-700">Cerrar Sesión</span>
          </button>
        </li>
      </ul>
    );
  };

  // Función para renderizar modal de estado del sistema
  const renderStatusModal = () => {
    if (!showStatusModal) return null;
    
    const getBadgeColor = (status) => {
      switch(status) {
        case 'online': return 'bg-green-100 text-green-800';
        case 'offline': return 'bg-red-100 text-red-800';
        case 'pending': 
        case 'unknown':
        default: return 'bg-yellow-100 text-yellow-800';
      }
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-xl font-semibold text-gray-900">Estado del Sistema</h3>
            <button 
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5"
              onClick={() => setShowStatusModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-lg font-medium mb-2">Estado de Conexión</h4>
              
              <div className="mb-3 flex justify-between items-center">
                <span className="font-medium">Frontend:</span>
                <span className={`px-2 py-1 rounded-full ${getBadgeColor('online')}`}>
                  Online
                </span>
              </div>
              
              <div className="mb-3 flex justify-between items-center">
                <span className="font-medium">BFF:</span>
                <span className={`px-2 py-1 rounded-full ${getBadgeColor(systemStatus.bff)}`}>
                  {systemStatus.bff === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="mb-3 flex justify-between items-center">
                <span className="font-medium">Backend:</span>
                <span className={`px-2 py-1 rounded-full ${getBadgeColor(systemStatus.backend)}`}>
                  {systemStatus.backend === 'online' ? 'Online' : 'Offline/Desconocido'}
                </span>
              </div>
            </div>
            
            {(systemStatus.bff !== 'online' || systemStatus.backend !== 'online') && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4">
                <p className="text-yellow-700 mb-2">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Se detectaron problemas de conectividad
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {systemStatus.bff !== 'online' && (
                    <li>No se puede conectar con el BFF. Verifique que el servicio esté en funcionamiento.</li>
                  )}
                  {systemStatus.backend !== 'online' && (
                    <li>No se puede conectar con el Backend. Verifique que el servicio esté en funcionamiento.</li>
                  )}
                </ul>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button 
                className="mr-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                onClick={() => setShowStatusModal(false)}
              >
                Cerrar
              </button>
              <button 
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                onClick={() => {
                  setShowStatusModal(false);
                  checkSystemStatus().then(() => setShowStatusModal(true));
                }}
              >
                Comprobar de nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-primary-50">
      {/* Modal de estado del sistema */}
      {renderStatusModal()}
      
      {/* Overlay para cerrar sidebar en móviles */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar para escritorio */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-all duration-300 ease-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white border-r border-primary-200 shadow-lg`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <img src={logo} alt="Logo La Misericordia" className="h-8" />
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 flex items-center justify-center"
            style={{ minWidth: '40px', minHeight: '40px' }}
            title="Cerrar menú"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="px-3 py-4 overflow-y-auto h-full" 
             style={{
               scrollbarWidth: 'thin',
               scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
             }}>
          {renderMenuItems()}
        </div>
      </aside>

      {/* Contenido principal */}
      <div 
        className={`flex-1 transition-all duration-300 ease-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'margin-left',
          backfaceVisibility: 'hidden'
        }}
      >
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg hover:bg-gray-100 mr-2 flex items-center justify-center transition-colors duration-200 ${
                !isSidebarOpen ? 'bg-primary-50 text-primary-600' : ''
              }`}
              style={{ minWidth: '40px', minHeight: '40px' }}
              title={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 className="text-xl font-semibold">La Misericordia</h1>
          </div>
          
          <div className="flex items-center">
            {/* Indicador de estado del sistema */}
            <button 
              onClick={() => setShowStatusModal(true)} 
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 flex items-center"
              title="Estado del sistema"
            >
              {systemStatus.bff === 'online' && systemStatus.backend === 'online' ? (
                <i className="fas fa-circle text-green-500 mr-1"></i>
              ) : (
                <i className="fas fa-circle text-red-500 mr-1"></i>
              )}
              <span className="hidden md:inline text-sm">Estado</span>
            </button>
            
            {currentUser && (
              <div className="flex items-center">
                <span className="text-sm font-medium hidden md:block mr-2">
                  {currentUser?.nombre || currentUser?.username || 'Usuario'}
                </span>
                <div 
                  className="w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center"
                  title={currentUser?.nombre || currentUser?.username}
                >
                  {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 bg-primary-50 overflow-auto" style={{ height: 'calc(100vh - 64px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
