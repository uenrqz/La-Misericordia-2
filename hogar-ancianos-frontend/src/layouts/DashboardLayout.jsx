import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import SafariIcon from '../components/ui/SafariIcon';

/**
 * Layout compartido para los dashboards
 */
const DashboardLayout = ({ children, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Estado para controlar si el sidebar está abierto o cerrado
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Función para cerrar sesión
  const handleLogout = () => {
    // Implementar la lógica de logout cuando tengas el contexto de autenticación
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  // Función para obtener iniciales del nombre
  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('');
  };
  
  // Elementos de menú según el rol
  const menuItems = [
    { to: '/app/dashboard', label: 'Dashboard', icon: 'th-large', roles: ['admin', 'medico', 'enfermera'] },
    { to: '/app/residentes', label: 'Pacientes', icon: 'users', roles: ['admin', 'medico', 'enfermera'] },
    
    // Específicos para enfermeras
    { to: '/app/signos-vitales', label: 'Signos Vitales', icon: 'heartbeat', roles: ['enfermera', 'admin'] },
    { to: '/app/kardex', label: 'Medicamentos', icon: 'prescription-bottle-alt', roles: ['enfermera', 'admin'] },
    
    // Específicos para médicos
    { to: '/app/ordenes-medicas', label: 'Órdenes Médicas', icon: 'clipboard-list', roles: ['medico', 'admin'] },
    { to: '/app/evoluciones', label: 'Evoluciones', icon: 'chart-line', roles: ['medico', 'enfermera', 'admin'] },
    
    // Específicos para administradores
    { to: '/app/donaciones', label: 'Donaciones', icon: 'hand-holding-heart', roles: ['admin'] },
    { to: '/app/reportes', label: 'Reportes', icon: 'chart-bar', roles: ['admin'] },
    { to: '/app/usuarios', label: 'Usuarios', icon: 'user-cog', roles: ['admin'] }
  ];
  
  // Filtrar menú según el rol (por ahora mostramos todos, hasta implementar autenticación)
  const userRole = user?.role || 'admin'; // Valor predeterminado para desarrollo
  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200`}>
        {/* Logo y nombre */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
              <span className="font-bold">LM</span>
            </div>
            {sidebarOpen && <span className="font-semibold text-lg">La Misericordia</span>}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 flex items-center justify-center"
            style={{ minWidth: '32px', minHeight: '32px' }}
          >
            <SafariIcon 
              icon={sidebarOpen ? 'chevron-left' : 'chevron-right'} 
              size={16} 
              className="text-gray-500" 
            />
          </button>
        </div>
        
        {/* Menú de navegación */}
        <nav className="p-4">
          <ul className="space-y-1">
            {filteredMenu.map((item) => (
              <li key={item.to}>
                <Link 
                  to={item.to} 
                  className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-md text-sm transition-colors ${
                    location.pathname === item.to || location.pathname.startsWith(item.to + '/') 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={!sidebarOpen ? item.label : ""}
                >
                  <SafariIcon 
                    icon={item.icon} 
                    size={sidebarOpen ? 20 : 24} 
                    className={sidebarOpen ? '' : 'mx-auto'} 
                  />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Perfil del usuario */}
        <div className="mt-auto border-t p-4">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {getInitials(user?.name || 'Usuario Anónimo')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.name || 'Usuario'}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role || 'Sin rol'}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                </button>
              </>
            ) : (
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            )}
          </div>
        </div>
      </aside>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {getCurrentPageTitle(location.pathname, menuItems)}
          </h1>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100">
              <i className="fas fa-bell"></i>
            </button>
          </div>
        </header>
        
        {/* Contenido del dashboard */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Función auxiliar para obtener el título según la ruta actual
function getCurrentPageTitle(pathname, menuItems) {
  // Encuentra la coincidencia más específica primero
  const exactMatch = menuItems.find(item => item.to === pathname);
  if (exactMatch) return exactMatch.label;

  // Encuentra la mejor coincidencia padre (el prefijo coincidente más largo)
  const parentMatches = menuItems
    .filter(item => item.to !== '/app/dashboard' && pathname.startsWith(item.to));
    
  if (parentMatches.length) {
    // Ordena por longitud descendente para obtener la coincidencia más específica
    parentMatches.sort((a, b) => b.to.length - a.to.length);
    return parentMatches[0].label;
  }

  // Predeterminado a 'Dashboard' o un título genérico
  return 'Dashboard';
}

export default DashboardLayout;