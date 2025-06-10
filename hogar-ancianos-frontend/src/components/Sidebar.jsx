import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [userRoles, setUserRoles] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Obtener usuario del localStorage si no está en el contexto
    const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
    console.log("Sidebar - Datos de usuario cargados:", userData);
    
    const roles = userData.roles || [userData.role || userData.rol];
    console.log("Sidebar - Roles detectados:", roles);
    
    setUserRoles(roles);
  }, [user]);

  // Definir todos los menús posibles
  const allMenuItems = [
    { path: '/app/dashboard', name: 'Dashboard (Admin)', icon: '📊', roles: ['admin'] },
    { path: '/app/enfermeria', name: 'Dashboard Enfermería', icon: '👩‍⚕️', roles: ['enfermero', 'cuidador'] },
    { path: '/app/medicos', name: 'Dashboard Médico', icon: '👨‍⚕️', roles: ['medico'] },
    { path: '/app/residentes', name: 'Residentes', icon: '👥', roles: ['admin', 'medico', 'enfermero', 'cuidador'] },
    { path: '/app/signos-vitales', name: 'Signos Vitales', icon: '💓', roles: ['medico', 'enfermero', 'cuidador'] },
    { path: '/app/ordenes-medicas', name: 'Órdenes Médicas', icon: '📋', roles: ['medico', 'enfermero'] },
    { path: '/app/evoluciones', name: 'Evoluciones', icon: '📈', roles: ['medico', 'enfermero'] },
    { path: '/app/donaciones', name: 'Donaciones', icon: '🎁', roles: ['admin'] },
    { path: '/app/reportes', name: 'Reportes', icon: '📊', roles: ['admin', 'medico'] },
    { path: '/app/usuarios', name: 'Gestión Usuarios', icon: '👥', roles: ['admin'] },
  ];

  // Filtrar menús según los roles del usuario
  const menuItems = allMenuItems.filter(item => {
    const hasAccess = userRoles.some(role => item.roles.includes(role));
    console.log(`Verificando acceso a "${item.name}": roles permitidos [${item.roles}], roles usuario [${userRoles}], acceso: ${hasAccess}`);
    return hasAccess;
  });

  return (
    <div className={`bg-gray-800 text-white h-screen ${isOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
      <div className="p-4 flex justify-between items-center">
        <h2 className={`font-bold ${isOpen ? 'block' : 'hidden'}`}>La Misericordia</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center p-4 hover:bg-gray-700 ${location.pathname === item.path ? 'bg-gray-700' : ''}`}
          >
            <span className="text-xl">{item.icon}</span>
            {isOpen && <span className="ml-4">{item.name}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;