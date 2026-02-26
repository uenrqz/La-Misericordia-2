import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Layouts
import MainLayout from './layouts/MainLayout';

// Context Providers
import { SystemProvider } from './contexts/SystemContext';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Residentes from './pages/Residentes';
import SignosVitales from './pages/SignosVitales';
import OrdenesMedicas from './pages/OrdenesMedicas';
import Donaciones from './pages/Donaciones';
import Reportes from './pages/Reportes';
import LibroDiario from './pages/LibroDiario';
import CalendarioPagos from './pages/CalendarioPagos';
import DetalleResidente from './pages/DetalleResidente';
import Evoluciones from './pages/Evoluciones';
import EnfermeriaDashboard from './pages/EnfermeriaDashboard';
import MedicosDashboard from './pages/MedicosDashboard';
import UsuariosAdmin from './pages/UsuariosAdmin';
import SystemDiagnostic from './pages/SystemDiagnostic';

// Protector de rutas
const RequireAuth = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    // Redirigir a la página de login si no hay token
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PERMISOS_POR_ROL = {
  admin: [
    'dashboard_admin',
    'dashboard_medico',
    'dashboard_enfermeria',
    'residentes',
    'signos_vitales',
    'ordenes_medicas',
    'evoluciones',
    'finanzas',
    'usuarios',
    'diagnostico'
  ],
  medico: ['dashboard_medico', 'residentes', 'ordenes_medicas', 'evoluciones'],
  enfermero: ['dashboard_enfermeria', 'residentes', 'signos_vitales', 'evoluciones'],
  cuidador: ['residentes'],
  secretaria: ['residentes']
};

const hasPermiso = (user, permiso) => {
  const role = user?.role || user?.rol;
  if (role === 'admin') return true;
  const permisos = Array.isArray(user?.permisos) ? user.permisos : [];
  if (permisos.length > 0) return permisos.includes(permiso);
  const roleKey = role === 'enfermera' ? 'enfermero' : role;
  const fallback = PERMISOS_POR_ROL[roleKey] || [];
  return fallback.includes(permiso);
};

const RequirePermission = ({ permiso, children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!hasPermiso(user, permiso)) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return children;
};

function App() {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  return (
    <SystemProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        <Routes>
          {/* Ruta pública para el login */}
          <Route path="/login" element={<Login />} />
        
          {/* Redirección de la ruta raíz */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Navigate to="/login" replace />} />
        
          {/* Rutas protegidas */}
          <Route path="/app" element={<RequireAuth><MainLayout /></RequireAuth>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="enfermeria"
              element={
                <RequirePermission permiso="dashboard_enfermeria">
                  <EnfermeriaDashboard />
                </RequirePermission>
              }
            />
            <Route
              path="medicos"
              element={
                <RequirePermission permiso="dashboard_medico">
                  <MedicosDashboard />
                </RequirePermission>
              }
            />
            <Route
              path="residentes"
              element={
                <RequirePermission permiso="residentes">
                  <Residentes />
                </RequirePermission>
              }
            />
            <Route
              path="residentes/:id"
              element={
                <RequirePermission permiso="residentes">
                  <DetalleResidente />
                </RequirePermission>
              }
            />
            <Route
              path="signos-vitales"
              element={
                <RequirePermission permiso="signos_vitales">
                  <SignosVitales />
                </RequirePermission>
              }
            />
            <Route
              path="ordenes-medicas"
              element={
                <RequirePermission permiso="ordenes_medicas">
                  <OrdenesMedicas />
                </RequirePermission>
              }
            />
            <Route
              path="evoluciones"
              element={
                <RequirePermission permiso="evoluciones">
                  <Evoluciones />
                </RequirePermission>
              }
            />
            <Route path="donaciones" element={<Donaciones />} />
            <Route path="reportes" element={<Reportes />} />
            <Route
              path="libro-diario"
              element={
                <RequirePermission permiso="finanzas">
                  <LibroDiario />
                </RequirePermission>
              }
            />
            <Route
              path="calendario-pagos"
              element={
                <RequirePermission permiso="finanzas">
                  <CalendarioPagos />
                </RequirePermission>
              }
            />
            <Route
              path="usuarios"
              element={
                <RequirePermission permiso="usuarios">
                  <UsuariosAdmin />
                </RequirePermission>
              }
            />
            <Route path="diagnostico" element={
              <RequireAuth>
                {(() => {
                  const user = JSON.parse(localStorage.getItem('user') || '{}');
                  return hasPermiso(user, 'diagnostico') ? <SystemDiagnostic /> : <Navigate to="/app/dashboard" replace />;
                })()}
              </RequireAuth>
            } />
          </Route>
        
          {/* Ruta para cualquier otra URL no definida */}
          <Route path="*" element={
            <div className="flex items-center justify-center h-screen bg-gray-100">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-2xl text-gray-600 mb-6">Página no encontrada</p>
                <a href="/" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-300">
                  Volver al inicio
                </a>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </SystemProvider>
  );
}

export default App;
