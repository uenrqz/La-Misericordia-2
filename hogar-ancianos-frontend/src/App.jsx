import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  return (
    <SystemProvider>
      <Router>
        <Routes>
          {/* Ruta pública para el login */}
          <Route path="/login" element={<Login />} />
        
          {/* Redirección de la ruta raíz */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Navigate to="/login" replace />} />
        
          {/* Rutas protegidas */}
          <Route path="/app" element={<RequireAuth><MainLayout /></RequireAuth>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="enfermeria" element={<EnfermeriaDashboard />} />
            <Route path="medicos" element={<MedicosDashboard />} />
            <Route path="residentes" element={<Residentes />} />
            <Route path="residentes/:id" element={<DetalleResidente />} />
            <Route path="signos-vitales" element={<SignosVitales />} />
            <Route path="ordenes-medicas" element={<OrdenesMedicas />} />
            <Route path="evoluciones" element={<Evoluciones />} />
            <Route path="donaciones" element={<Donaciones />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="usuarios" element={<UsuariosAdmin />} />
            <Route path="diagnostico" element={
              <RequireAuth>
                {(() => {
                  const user = JSON.parse(localStorage.getItem('user') || '{}');
                  const isAdmin = user?.role === 'admin' || user?.rol === 'admin';
                  return isAdmin ? <SystemDiagnostic /> : <Navigate to="/app/dashboard" replace />;
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
