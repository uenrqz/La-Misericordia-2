import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api.service';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadStorageData() {
      setLoading(true);
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing stored user:', e);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    }
    
    loadStorageData();
  }, []);
  
  async function login(username, password) {
    try {
      // Aceptar tanto username como email
      const credentials = { username, password };
      console.log('Intentando login con credenciales:', { username });
      
      const response = await api.post('/auth/login', credentials);
      
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        
        console.log('Respuesta completa del servidor:', response);
        
        // Preparar roles adicionales
        const rolesAdicionales = response.user.roles_adicionales || [];
        console.log('Roles adicionales detectados:', rolesAdicionales);
        
        // Guardar información del usuario
        const userData = {
          id: response.user.id,
          name: response.user.name || `${response.user.nombre} ${response.user.apellido}`,
          email: response.user.email,
          role: response.user.role || response.user.rol,
          roles: [response.user.role || response.user.rol, ...rolesAdicionales],
          // Permisos basados en rol principal y roles adicionales
          permisos_admin: response.user.rol === 'admin' || rolesAdicionales.includes('admin'),
          permisos_medico: response.user.rol === 'medico' || rolesAdicionales.includes('medico'),
          permisos_enfermero: response.user.rol === 'enfermero' || response.user.rol === 'cuidador' || 
                            rolesAdicionales.includes('enfermero') || rolesAdicionales.includes('cuidador'),
        };
        
        console.log('Información de usuario guardada:', userData);
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { ok: true, user: userData };
      } else {
        throw new Error('Respuesta de login inválida');
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { ok: false, error: error.message || 'Error al iniciar sesión' };
    }
  }
  
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }
  
  return (
    <AuthContext.Provider value={{ 
      signed: !!user, 
      user, 
      loading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
}

export default AuthContext;