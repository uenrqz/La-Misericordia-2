import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import logoImage from '../assets/images/logo.svg';
import authService from '../services/auth.service';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Usar el servicio de autenticación real
      await authService.login(username, password);
      
      // Si llegamos aquí, la autenticación fue exitosa
      navigate('/app');
    } catch (err) {
      console.error('Error en el login:', err);
      if (err.response && err.response.status === 401) {
        setError('Credenciales inválidas. Por favor verifique su usuario y contraseña.');
      } else {
        setError('Error al intentar iniciar sesión. Por favor intente de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
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
              <div className="login-input-wrapper">
                <FaLock className="login-input-icon" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  placeholder="Ingrese su contraseña"
                  required
                />
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
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Para acceso de prueba: <strong>admin / admin123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;