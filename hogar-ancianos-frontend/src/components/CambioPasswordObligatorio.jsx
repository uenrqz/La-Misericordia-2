import { useState } from 'react';
import { FaLock, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import usuariosService from '../services/usuarios.service';
import { useSystem } from '../contexts/SystemContext';

const CambioPasswordObligatorio = ({ usuario, onCompletado }) => {
  // Usamos try-catch para manejar el caso de que el contexto no esté disponible
  const systemContext = { showNotification: () => {} };
  try {
    Object.assign(systemContext, useSystem());
  } catch (err) {
    console.warn('SystemContext no disponible en CambioPasswordObligatorio');
  }
  const { showNotification } = systemContext;
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validarPassword = () => {
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validarPassword()) {
      return;
    }
    
    setCargando(true);
    try {
      const passwordData = {
        passwordNueva: formData.password,
        passwordConfirmacion: formData.confirmPassword
      };
      
      await usuariosService.cambiarPassword(usuario.id, passwordData);
      
      // Intentar usar showNotification si está disponible, pero no depender de ello
      try {
        showNotification('success', 'Contraseña actualizada', 'Su contraseña ha sido actualizada correctamente');
      } catch (e) {
        console.log('Contraseña actualizada correctamente');
      }
      
      if (onCompletado) {
        onCompletado();
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError(error.message || 'Error al cambiar la contraseña');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-primary-600">
          <FaExclamationTriangle className="text-4xl" />
        </div>
        
        <h2 className="text-xl font-semibold text-center mb-6">
          Es necesario cambiar su contraseña
        </h2>
        
        <p className="text-gray-600 mb-6 text-center">
          Por razones de seguridad, debe cambiar su contraseña temporal antes de continuar.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="pl-10 pr-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="********"
                required
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
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
            <p className="mt-1 text-xs text-gray-500">
              Debe tener al menos 8 caracteres
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Confirmar Nueva Contraseña</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pl-10 pr-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="********"
                required
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="h-5 w-5" />
                ) : (
                  <FaEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={cargando}
            >
              {cargando ? 'Procesando...' : 'Cambiar Contraseña y Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambioPasswordObligatorio;
