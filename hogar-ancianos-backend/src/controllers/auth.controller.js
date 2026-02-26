const axios = require('axios');
const bcrypt = require('bcrypt');
const soutConfig = require('../config/sout');
const { generateToken } = require('../middlewares/auth.middleware');
const { pool } = require('../config/db'); 
const jwt = require('jsonwebtoken');


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
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [userInfo.data.email]
    );

    let userData;
    
    if (rows.length === 0) {
      // Usuario no existe, crear uno nuevo
      const result = await pool.query(
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
    
    console.log(`[Auth] Buscando usuario con username: ${username}`);
    
    // Buscar usuario por username - USANDO pool.query
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1',
      [username]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      console.log(`[Auth] Usuario no encontrado: ${username}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      console.log(`[Auth] Contraseña inválida para usuario: ${username}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        rol: user.rol 
      },
      process.env.JWT_SECRET || 'secreto_temporal',
      { expiresIn: process.env.JWT_EXPIRATION || '8h' }
    );
    
    console.log(`[Auth] Login exitoso para: ${username}`);
    
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
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