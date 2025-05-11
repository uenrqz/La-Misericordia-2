const jwt = require('jsonwebtoken');

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
 * Generar token JWT para el usuario
 * @param {Object} userData - Datos del usuario a incluir en el token
 * @returns {String} - Token JWT generado
 */
exports.generateToken = (userData) => {
  const payload = {
    id: userData.id,
    username: userData.username,
    nombre: userData.nombre,
    apellido: userData.apellido,
    rol: userData.rol,
    email: userData.email
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
};