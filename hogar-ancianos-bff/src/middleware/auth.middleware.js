const authService = require('../services/auth.service');

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
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ 
          message: 'Permisos insuficientes para acceder a este recurso',
          error: 'insufficient_permissions',
          requiredRoles: roles,
          userRole: decoded.role
        });
      }
      
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
