import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import authService from '../services/auth.service';
import { initFlowbite } from 'flowbite';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    initFlowbite();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderMenuItems = () => (
    <ul className="space-y-2 font-medium">
      <li>
        <Link
          to="/app/dashboard"
          className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname === '/app/dashboard' ? 'bg-primary-100 text-primary-600' : ''}`}
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
      <li>
        <Link
          to="/app/signos-vitales"
          className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname === '/app/signos-vitales' ? 'bg-primary-100 text-primary-600' : ''}`}
        >
          <i className="fas fa-heartbeat w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
          <span className="ms-3">Signos Vitales</span>
        </Link>
      </li>
      <li>
        <Link
          to="/app/ordenes-medicas"
          className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname === '/app/ordenes-medicas' ? 'bg-primary-100 text-primary-600' : ''}`}
        >
          <i className="fas fa-prescription w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
          <span className="ms-3">Órdenes Médicas</span>
        </Link>
      </li>
      <li>
        <Link
          to="/app/evoluciones"
          className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname === '/app/evoluciones' ? 'bg-primary-100 text-primary-600' : ''}`}
        >
          <i className="fas fa-file-medical w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
          <span className="ms-3">Evoluciones</span>
        </Link>
      </li>
      <li>
        <Link
          to="/app/donaciones"
          className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname === '/app/donaciones' ? 'bg-primary-100 text-primary-600' : ''}`}
        >
          <i className="fas fa-hand-holding-heart w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
          <span className="ms-3">Donaciones</span>
        </Link>
      </li>
      <li>
        <Link
          to="/app/reportes"
          className={`flex items-center p-2 text-dark-500 rounded-lg hover:bg-primary-50 group ${location.pathname === '/app/reportes' ? 'bg-primary-100 text-primary-600' : ''}`}
        >
          <i className="fas fa-chart-bar w-5 h-5 text-dark-300 group-hover:text-primary-600"></i>
          <span className="ms-3">Reportes</span>
        </Link>
      </li>
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

  return (
    <div className="flex h-screen bg-primary-50">
      {/* Sidebar para escritorio */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-primary-200 md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <img src={logo} alt="Logo La Misericordia" className="h-8" />
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="px-3 py-4 overflow-y-auto">
          {renderMenuItems()}
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 md:ml-64">
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <i className="fas fa-bars"></i>
          </button>
          <h1 className="text-xl font-semibold">La Misericordia</h1>
        </header>
        <main className="p-4 bg-primary-50 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;