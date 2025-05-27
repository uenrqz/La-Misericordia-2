import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import logoImage from '../assets/images/logo.png';
import authService from '../services/auth.service';
import CambioPasswordObligatorio from '../components/CambioPasswordObligatorio';
import { useSystem } from '../contexts/SystemContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCambioPassword, setShowCambioPassword] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña
  // Usamos try-catch para manejar el caso de que el contexto no esté disponible
  const systemContext = { showNotification: () => {} };
  try {
    Object.assign(systemContext, useSystem());
  } catch (err) {
    console.warn('SystemContext no disponible en Login');
  }
  const { showNotification } = systemContext;
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validar entrada
      if (!username || !password) {
        setError('Por favor ingrese usuario y contraseña');
        setIsLoading(false);
        return;
      }
      
      // Usar el servicio de autenticación 
      const result = await authService.login(username, password);
      
      // Verificar que tenemos un token válido
      if (!result || !result.token) {
        setError('Respuesta de autenticación inválida. Contacte al administrador.');
        console.error('Respuesta de login sin token:', result);
        setIsLoading(false);
        return;
      }
      
      console.log('Login exitoso, verificando si requiere cambio de contraseña...');
      
      // Verificar si el usuario necesita cambiar su contraseña
      if (result.user && result.user.cambio_password_requerido) {
        setUsuarioActual(result.user);
        setShowCambioPassword(true);
        setIsLoading(false);
        return;
      }
      
      // Si llegamos aquí, la autenticación fue exitosa y no requiere cambio de contraseña
      try {
        showNotification('success', 'Inicio de sesión exitoso', `Bienvenido, ${result.user.nombre}`);
      } catch (e) {
        console.log(`Inicio de sesión exitoso. Bienvenido, ${result.user.nombre}`);
      }
      
      // Navegar al dashboard específico según el rol del usuario
      const userRole = result.user.role || result.user.rol;
      if (userRole === 'medico') {
        navigate('/app/medicos');
      } else if (userRole === 'enfermera') {
        navigate('/app/enfermeria');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      console.error('Error en el login:', err);
      
      // Manejar diferentes tipos de errores
      if (err.response) {
        // Error con respuesta del servidor
        if (err.response.status === 401) {
          setError('Credenciales inválidas. Por favor verifique su usuario y contraseña.');
        } else if (err.response.status === 500) {
          setError('Error en el servidor. Por favor contacte al administrador del sistema.');
        } else {
          setError(`Error ${err.response.status}: ${err.response.data?.message || 'Error de conexión'}`);
        }
      } else if (err.message) {
        // Error con mensaje específico
        setError(err.message);
      } else {
        // Error genérico
        setError('Error al intentar iniciar sesión. Por favor intente de nuevo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar la finalización del cambio de contraseña obligatorio
  const handleCambioPasswordCompletado = () => {
    setShowCambioPassword(false);
    showNotification('success', 'Contraseña actualizada', 'Su contraseña ha sido actualizada correctamente');
    
    // Navegar al dashboard específico según el rol del usuario
    const user = authService.getCurrentUser();
    const userRole = user?.role || user?.rol;
    if (userRole === 'medico') {
      navigate('/app/medicos');
    } else if (userRole === 'enfermera') {
      navigate('/app/enfermeria');
    } else {
      navigate('/app/dashboard');
    }
  };

  return (
    <div className="login-container">
      {/* Mostrar cambio de contraseña obligatorio si es necesario */}
      {showCambioPassword && usuarioActual && (
        <CambioPasswordObligatorio 
          usuario={usuarioActual} 
          onCompletado={handleCambioPasswordCompletado} 
        />
      )}
      
      <div className="login-form-container">
        {/* Logo y título */}
        <div className="login-logo-section">
          <img 
            src={logoImage} 
            alt="Logo La Misericordia" 
            className="login-logo"
          />
          <h1 className="login-title">Hogar de Ancianos</h1>
          <h2 className="login-subtitle">LA MISERICORDIA</h2>
          <p className="login-description">Sistema de Administración y Control Médico</p>
        </div>
        
        {/* Formulario */}
        <div className="login-form">
          <h2 className="login-form-title">
            Iniciar Sesión
          </h2>
          
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label htmlFor="username" className="login-label">
                Usuario
              </label>
              <div className="login-input-wrapper">
                <FaUser className="login-input-icon" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>
            </div>
            
            <div className="login-input-group">
              <label htmlFor="password" className="login-label">
                Contraseña
              </label>
              <div className="login-input-wrapper relative">
                <FaLock className="login-input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input pr-10"
                  placeholder="Ingrese su contraseña"
                  required
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5" />
                  ) : (
                    <FaEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : (
                  <FaSignInAlt className="mr-2" />
                )}
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
          
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                <strong>Credenciales por defecto:</strong> usuario administrador configurado en sistema
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;