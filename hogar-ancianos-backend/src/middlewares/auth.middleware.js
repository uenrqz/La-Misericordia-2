const jwt = require('jsonwebtoken');
const { normalizarPermisos, parsePermisos } = require('../config/permisos');

/**
 * Middleware de autenticación
 * @param {Array} roles - Roles permitidos para acceder a la ruta (opcional)
 * @returns {Function} - Middleware Express
 */
exports.authenticate = (roles = []) => {
  return (req, res, next) => {
    // Obtener el token del header de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acceso no autorizado. Se requiere token de autenticación' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar roles si se especificaron
      if (roles.length && !roles.includes(decoded.rol)) {
        return res.status(403).json({ message: 'Permisos insuficientes para acceder a este recurso' });
      }

      // Normalizar permisos si no vienen en el token
      if (!decoded.permisos) {
        decoded.permisos = normalizarPermisos([], decoded.rol);
      } else {
        decoded.permisos = parsePermisos(decoded.permisos);
      }

      // Agregar la información del usuario decodificada a la petición
      req.user = decoded;
      next();
    } catch (err) {
      console.error('Error en autenticación:', err);
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
  };
};

/**
 * Middleware para autorizar por permisos (con fallback por rol)
 * @param {Object} options - Opciones de autorizacion
 * @param {Array} options.roles - Roles permitidos (fallback si no hay permisos)
 * @param {Array} options.permisos - Permisos requeridos
 * @returns {Function} - Middleware Express
 */
exports.authorizeAccess = ({ roles = [], permisos = [] } = {}) => {
  return (req, res, next) => {
    const user = req.user || {};
    const userRole = user.rol || user.role;
    const userPermisos = Array.isArray(user.permisos) ? user.permisos : [];

    if (userRole === 'admin') {
      return next();
    }

    if (userPermisos.length > 0) {
      if (permisos.length === 0 || permisos.some((permiso) => userPermisos.includes(permiso))) {
        return next();
      }
      return res.status(403).json({
        message: 'Permisos insuficientes para acceder a este recurso',
        requiredPermissions: permisos,
        userPermissions: userPermisos
      });
    }

    if (roles.length && roles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      message: 'Permisos insuficientes para acceder a este recurso',
      requiredRoles: roles,
      userRole
    });
  };
};

/**
 * Middleware para verificación de roles
 * @param {Array} allowedRoles - Array con los roles permitidos
 * @returns {Function} - Middleware Express
 */
exports.hasRole = (allowedRoles = []) => {
  return (req, res, next) => {
    // Si no especificó roles, permitir el acceso
    if (allowedRoles.length === 0) {
      return next();
    }

    // Obtener el token del header de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acceso no autorizado. Se requiere token de autenticación' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar si el rol del usuario está en los roles permitidos
      if (!allowedRoles.includes(decoded.rol)) {
        return res.status(403).json({ 
          message: 'Permisos insuficientes para acceder a este recurso',
          requiredRoles: allowedRoles,
          userRole: decoded.rol
        });
      }

      // Agregar la información del usuario decodificada a la petición
      req.user = decoded;
      next();
    } catch (err) {
      console.error('Error en verificación de roles:', err);
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
  };
};

/**
 * Generar token JWT para el usuario
 * @param {Object} userData - Datos del usuario a incluir en el token
 * @returns {String} - Token JWT generado
 */
exports.generateToken = (userData) => {
  const permisos = normalizarPermisos(userData.permisos || [], userData.rol);
  const payload = {
    id: userData.id,
    username: userData.username,
    nombre: userData.nombre,
    apellido: userData.apellido,
    rol: userData.rol,
    email: userData.email,
    permisos
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
};