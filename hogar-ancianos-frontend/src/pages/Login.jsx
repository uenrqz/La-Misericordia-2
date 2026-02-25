import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import logoImg from '../assets/images/logo.png';
import usuariosService from '../services/usuarios.service';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userType, setUserType] = useState('admin'); // admin, enfermero, doctor
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Cargar usuarios reales desde la base de datos - Optimizado para reducir consumo de memoria
  useEffect(() => {
    // Función para cargar usuarios de manera optimizada
    const cargarUsuariosAsync = async () => {
      try {
        setIsLoadingUsers(true);
        // Reducir logs en producción para ahorrar memoria
        const isDev = process.env.NODE_ENV !== 'production';
        
        if (isDev) {
          console.log('� Cargando usuarios...');
        }
        
        const usuariosData = await usuariosService.getUsuariosPublicos();
        
        if (usuariosData && Array.isArray(usuariosData) && usuariosData.length > 0) {
          // Evitamos crear nuevas copias de los datos innecesariamente
          setUsuarios(usuariosData);
          
          // Filtrar usuarios - usando técnicas de optimización
          filterUsuariosByTypeLocal(usuariosData, 'admin');
          
          // Mostrar toast solo en la primera carga, no en actualizaciones
          if (isDev || !window._initialLoadDone) {
            toast.success('Usuarios cargados correctamente');
            window._initialLoadDone = true;
          }
        } else {
          setUsuarios([]);
          setUsuariosFiltrados([]);
          toast.warning('No se encontraron usuarios');
        }
      } catch (error) {
        console.error('❌ Error al cargar usuarios:', error);
        toast.error('No se pudieron cargar los usuarios. Verifique la conexión con el servidor.');
        setUsuarios([]);
        setUsuariosFiltrados([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    // Añadir un pequeño retraso para asegurarnos de que el BFF esté listo
    const timer = setTimeout(() => {
      cargarUsuariosAsync();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Filtrar usuarios por tipo seleccionado
  const filterUsuariosByTypeLocal = (usuariosLista, tipo) => {
    if (!usuariosLista || usuariosLista.length === 0) {
      console.log('No hay usuarios para filtrar');
      setUsuariosFiltrados([]);
      setUsername('');
      return;
    }
    
    console.log(`Filtrando ${usuariosLista.length} usuarios para tipo: ${tipo}`);
    console.log('Roles disponibles:', [...new Set(usuariosLista.map(u => u.rol))].join(', '));
    
    let filtrados = [];
    if (tipo === 'admin') {
      filtrados = usuariosLista.filter(user => {
        const rol = user.rol ? user.rol.toLowerCase() : '';
        return rol.includes('admin');
      });
    } else if (tipo === 'enfermero') {
      filtrados = usuariosLista.filter(user => {
        const rol = user.rol ? user.rol.toLowerCase() : '';
        return rol.includes('enferm') || rol.includes('cuida');
      });
    } else if (tipo === 'doctor') {
      filtrados = usuariosLista.filter(user => {
        const rol = user.rol ? user.rol.toLowerCase() : '';
        return rol.includes('med') || rol.includes('doc');
      });
    }
    
    setUsuariosFiltrados(filtrados);
    
    // Si hay usuarios filtrados, seleccionar el primero por defecto
    if (filtrados.length > 0) {
      setUsername(filtrados[0].username || '');
    } else {
      setUsername('');
    }
  }
  
  // Filtrar usuarios por tipo seleccionado
  const filterUsuariosByType = (tipo) => {
    filterUsuariosByTypeLocal(usuarios, tipo);
  };

  // Cambiar el tipo de usuario
  const handleUserTypeChange = (e) => {
    const tipo = e.target.value;
    setUserType(tipo);
    filterUsuariosByType(tipo);
  };

  // Cambiar el usuario seleccionado
  const handleUserChange = (e) => {
    setUsername(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    // Validación básica
    if (!username) {
      setErrorMessage('Por favor, ingrese su nombre de usuario.');
      toast.error('Por favor, ingrese su nombre de usuario.');
      setIsLoading(false);
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('La contraseña debe tener al menos 4 caracteres.');
      toast.error('La contraseña debe tener al menos 4 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Intentando iniciar sesión con:', username);
      
      // Enviar directamente el username y password al backend
      // El BFF se encargará de procesar correctamente la autenticación
      const response = await login(username, password);
      
      if (response && response.ok) {
        toast.success('¡Inicio de sesión exitoso!');
        
        // Redirección después de un breve tiempo para permitir que se muestre el toast
        setTimeout(() => {
          navigate('/app/dashboard');
        }, 300);
      } else {
        // Si la respuesta existe pero no es OK
        setErrorMessage('Credenciales inválidas o problema al iniciar sesión');
        toast.error('Credenciales inválidas o problema al iniciar sesión');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      
      // Verificar si hay un mensaje específico de error del servidor
      const errorMsg = 
        (error.response?.data?.data?.error) || 
        (error.response?.data?.message) || 
        'Error al iniciar sesión. Por favor, intente nuevamente.';
        
      setErrorMessage(errorMsg);
      
      // Mostrar mensaje con toast
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-logo-section">
          <img
            className="login-logo"
            src={logoImg}
            alt="Hogar de Ancianos Varones"
          />
          <h2 className="login-title">
            Hogar de Ancianos Varones
          </h2>
          <h1 className="login-subtitle">
            LA MISERICORDIA
          </h1>
          <p className="login-description">
            Sistema de Administración y Control Médico
          </p>
        </div>
        
        <h3 className="login-form-title">
          Iniciar Sesión
        </h3>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="login-error">
              <p>{errorMessage}</p>
            </div>
          )}
          
          <div className="login-input-group">
            <label htmlFor="userType" className="login-label">
              Tipo de Usuario
            </label>
            <div className="login-select-wrapper">
              <select
                id="userType"
                name="userType"
                className="login-select"
                value={userType}
                onChange={handleUserTypeChange}
              >
                <option value="admin">Administrador</option>
                <option value="enfermero">Enfermero/a</option>
                <option value="doctor">Doctor</option>
              </select>
              <span className="login-select-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
          
          <div className="login-input-group">
            <label htmlFor="username" className="login-label">
              Seleccionar Usuario
            </label>
            <div className="login-select-wrapper">
              {isLoadingUsers ? (
                <div className="login-loading">Cargando usuarios...</div>
              ) : (
                <select
                  id="username"
                  name="username"
                  className="login-select"
                  value={username}
                  onChange={handleUserChange}
                  disabled={usuariosFiltrados.length === 0}
                >
                  {usuariosFiltrados.length > 0 ? (
                    usuariosFiltrados.map((user) => {
                      return (
                        <option key={user.id || user.username} value={user.username}>
                          {`${user.nombre || ''} ${user.apellido || ''} ${user.username ? `(${user.username})` : ''}`}
                        </option>
                      );
                    })
                  ) : (
                    <option value="">No hay usuarios registrados con este rol</option>
                  )}
                </select>
              )}
              <span className="login-select-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
          
          <div className="login-input-group">
            <label htmlFor="password" className="login-label">
              Contraseña
            </label>
            <div className="login-input-wrapper" style={{ position: 'relative' }}>
              <span className="login-input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="login-input"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                tabIndex="-1"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="login-button-container">
            <button
              type="submit"
              disabled={isLoading}
              className="login-button"
            >
              <span className="login-button-icon">
                {isLoading ? '⌛' : '🔐'}
              </span>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
          
          <div className="login-default-credentials">
            {isLoadingUsers ? (
              <p>Cargando usuarios del sistema...</p>
            ) : usuariosFiltrados.length > 0 ? (
              <p>Por favor seleccione su usuario y escriba su contraseña</p>
            ) : usuarios.length > 0 ? (
              <p>No hay usuarios con el rol seleccionado. Pruebe con otro tipo de usuario.</p>
            ) : (
              <p>No se pudieron cargar los usuarios del sistema. Contacte al administrador.</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;