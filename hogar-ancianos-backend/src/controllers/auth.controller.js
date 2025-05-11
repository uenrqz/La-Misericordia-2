const axios = require('axios');
const db = require('../config/db');
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

    // Verificar credenciales con pgcrypto
    const { rows } = await db.query(
      'SELECT * FROM usuarios WHERE username = $1 AND password = crypt($2, password)',
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const userData = rows[0];
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