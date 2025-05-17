import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { path: '/app/dashboard', name: 'Dashboard', icon: '📊' },
    { path: '/app/enfermeria', name: 'Enfermería', icon: '👩‍⚕️' },
    { path: '/app/medicos', name: 'Médicos', icon: '👨‍⚕️' },
    { path: '/app/residentes', name: 'Residentes', icon: '👥' },
    { path: '/app/signos-vitales', name: 'Signos Vitales', icon: '💓' },
    { path: '/app/ordenes-medicas', name: 'Órdenes Médicas', icon: '📋' },
    { path: '/app/evoluciones', name: 'Evoluciones', icon: '📈' },
    { path: '/app/donaciones', name: 'Donaciones', icon: '🎁' },
    { path: '/app/reportes', name: 'Reportes', icon: '📊' },
  ];

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