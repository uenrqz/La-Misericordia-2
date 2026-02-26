const authService = require('../services/auth.service');

/**
 * Mapea un rol a su formato estandarizado
 * @param {string} rol - Rol a mapear
 * @returns {string} - Rol estandarizado
 */
exports.mapearRol = (rol) => {
  // Verificar que rol no sea nulo o indefinido
  if (!rol) {
    console.warn('Intento de mapear un rol nulo o indefinido, usando "enfermero" por defecto');
    return 'enfermero';
  }
  
  // Asegurar que es una cadena de texto
  const rolStr = String(rol).toLowerCase().trim();
  
  // Mapa de equivalencias para estandarizar los roles
  const mapaRoles = {
    'enfermera': 'enfermero',
    'enfermero': 'enfermero',
    'doctor': 'medico',
    'médico': 'medico',
    'medico': 'medico',
    'admin': 'admin',
    'administrador': 'admin',
    'secretaria': 'secretaria',
    'cuidador': 'cuidador'
  };
  
  // Buscar primero coincidencia exacta en el mapa
  if (mapaRoles[rolStr]) {
    return mapaRoles[rolStr];
  }
  
  // Si no hay coincidencia exacta, buscar por inclusión
  if (rolStr.includes('admin')) return 'admin';
  if (rolStr.includes('medic') || rolStr.includes('doctor') || rolStr.includes('médic')) return 'medico';
  if (rolStr.includes('enfermer')) return 'enfermero';
  if (rolStr.includes('secretar')) return 'secretaria';
  if (rolStr.includes('cuida')) return 'cuidador';
  
  console.warn(`No se pudo mapear el rol "${rolStr}", usando "enfermero" por defecto`);
  return 'enfermero'; // Default seguro si no se encuentra coincidencia
};

/**
 * Verifica si dos roles son equivalentes
 * @param {string} rol1 - Primer rol
 * @param {string} rol2 - Segundo rol
 * @returns {boolean} - true si son equivalentes
 */
exports.rolesEquivalentes = (rol1, rol2) => {
  const mapearRol = exports.mapearRol; // Usar referencia directa a la función exportada
  return mapearRol(rol1) === mapearRol(rol2);
};

/**
 * Middleware para verificar autenticación y roles
 * @param {Array} roles - Roles permitidos (opcional)
 * @returns {Function} - Middleware de Express
 */
exports.authenticate = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          message: 'Acceso no autorizado. Se requiere token de autenticación',
          error: 'missing_token'
        });
      }

      const token = authHeader.split(' ')[1];
      
      // Verificar que el token del BFF es válido
      const decoded = authService.verifyToken(token);
      
      // Verificar roles si se especificaron
      // Normalizar los roles para manejar casos como 'enfermero' y 'enfermera' 
      // o 'medico' y 'doctor' como equivalentes
      let userRole = decoded.role || decoded.rol;
      
      // Acceder a las funciones exportadas mediante reference explícita
      const { mapearRol, rolesEquivalentes } = exports;
      
      // Asegurarse de que el rol sea uno de los aceptados por el backend
      const rolMapeado = mapearRol(userRole);
      
      if (roles.length && !roles.some(rol => rolesEquivalentes(rol, rolMapeado))) {
        console.log(`Acceso denegado: Usuario con rol ${userRole} (mapeado a ${rolMapeado}) intentó acceder a recurso que requiere: ${roles.join(', ')}`);
        return res.status(403).json({ 
          message: 'Permisos insuficientes para acceder a este recurso',
          error: 'insufficient_permissions',
          requiredRoles: roles,
          userRole: rolMapeado
        });
      }
      
      // Actualizar el rol al formato esperado por el backend
      decoded.role = rolMapeado;
      decoded.permisos = Array.isArray(decoded.permisos) ? decoded.permisos : [];
      
      // Validación del token del backend (opcional, solo si se solicita verificación estricta)
      if (req.query.strict === 'true') {
        const isBackendTokenValid = await authService.validateBackendToken(decoded.originalToken);
        if (!isBackendTokenValid) {
          return res.status(401).json({
            message: 'La sesión con el backend ha expirado',
            error: 'backend_token_expired'
          });
        }
      }
      
      // Añadir datos del usuario al request
      req.user = decoded;
      
      next();
    } catch (error) {
      console.error('Error de autenticación:', error);
      return res.status(error.status || 401).json({ 
        message: error.message || 'Token inválido',
        error: error.name || 'authentication_error'
      });
    }
  };
};
