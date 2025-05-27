const axios = require('axios');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const soutConfig = require('../config/sout');
const { generateToken } = require('../middlewares/auth.middleware');

/**
 * Controlador para el inicio de sesión con SOUT
 */
exports.loginSout = (req, res) => {
  const authUrl = `${soutConfig.authUrl}?response_type=code&client_id=${soutConfig.clientId}&redirect_uri=${soutConfig.redirectUri}`;
  res.redirect(authUrl);
};

/**
 * Controlador para el callback de autenticación SOUT
 */
exports.soutCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ message: 'Código de autorización no proporcionado' });
    }

    // Obtener token de acceso desde SOUT
    const tokenResponse = await axios.post(soutConfig.tokenUrl, {
      code,
      client_id: soutConfig.clientId,
      client_secret: soutConfig.clientSecret,
      redirect_uri: soutConfig.redirectUri,
      grant_type: 'authorization_code'
    });

    // Obtener información del usuario desde SOUT
    const userInfo = await axios.get(soutConfig.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    });

    // Verificar si el usuario existe en nuestra base de datos
    const { rows } = await db.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [userInfo.data.email]
    );

    let userData;
    
    if (rows.length === 0) {
      // Usuario no existe, crear uno nuevo
      const result = await db.query(
        'INSERT INTO usuarios (username, nombre, apellido, email, rol, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [
          userInfo.data.username || userInfo.data.email.split('@')[0],
          userInfo.data.nombre || userInfo.data.given_name || 'Usuario',
          userInfo.data.apellido || userInfo.data.family_name || 'SOUT',
          userInfo.data.email,
          'cuidador', // Rol por defecto para usuarios SOUT
          'SOUT_AUTH' // Contraseña ficticia para usuarios SOUT
        ]
      );
      userData = result.rows[0];
    } else {
      userData = rows[0];
    }

    // Generar token JWT para nuestra aplicación
    const token = generateToken(userData);

    // Devolver token y datos básicos del usuario
    res.json({
      token,
      user: {
        id: userData.id,
        username: userData.username,
        nombre: userData.nombre,
        apellido: userData.apellido,
        rol: userData.rol,
        email: userData.email
      }
    });
    
  } catch (error) {
    console.error('Error en autenticación SOUT:', error);
    res.status(401).json({ 
      message: 'Error en la autenticación con SOUT',
      error: error.message
    });
  }
};

/**
 * Login con credenciales locales
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    // Obtener usuario por nombre de usuario
    const { rows } = await db.query(
      'SELECT * FROM usuarios WHERE username = $1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const userData = rows[0];
    
    // Verificar la contraseña con bcrypt
    let passwordIsValid = false;
    
    if (
      userData.password.startsWith('$2a$') ||
      userData.password.startsWith('$2b$') ||
      userData.password.startsWith('$2y$')
    ) {
      // Formato bcrypt
      passwordIsValid = bcrypt.compareSync(password, userData.password);
    } else {
      // Formato pgcrypto (mantener compatibilidad con usuarios existentes)
      const cryptResult = await db.query(
        'SELECT (password = crypt($1, password)) as is_valid FROM usuarios WHERE id = $2',
        [password, userData.id]
      );
      passwordIsValid = cryptResult.rows[0]?.is_valid || false;
    }
    
    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = generateToken(userData);

    res.json({
      token,
      user: {
        id: userData.id,
        username: userData.username,
        nombre: userData.nombre,
        apellido: userData.apellido,
        rol: userData.rol,
        email: userData.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      message: 'Error en el servidor durante la autenticación',
      error: error.message
    });
  }
};

/**
 * Validar token JWT
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 */
exports.validateToken = (req, res) => {
  try {
    // Si llega a este punto, el middleware ya verificó el token
    // Solo necesitamos devolver una respuesta exitosa
    res.status(200).json({
      valid: true,
      message: 'Token válido',
      user: {
        id: req.user.id,
        username: req.user.username,
        rol: req.user.rol
      }
    });
  } catch (error) {
    console.error('Error al validar token:', error);
    res.status(401).json({
      valid: false,
      message: 'Error al validar token',
      error: error.message
    });
  }
};

/**
 * Refrescar token JWT
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 */
exports.refreshToken = (req, res) => {
  try {
    // El middleware ya verificó que el token es válido
    // Generar un nuevo token con la misma información pero nueva fecha de expiración
    const newToken = generateToken(req.user);
    
    res.status(200).json({
      token: newToken,
      message: 'Token actualizado correctamente',
      user: {
        id: req.user.id,
        username: req.user.username,
        rol: req.user.rol
      }
    });
  } catch (error) {
    console.error('Error al refrescar token:', error);
    res.status(500).json({
      message: 'Error al refrescar token',
      error: error.message
    });
  }
};