const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');

/**
 * @route POST /api/bff/auth/login
 * @desc Autenticar usuario y obtener token BFF
 * @access Público
 */
router.post('/login', async (req, res) => {
  try {
    // Autenticar con el backend
    const backendAuth = await authService.login(req.body);
    
    // Generar token del BFF
    const bffToken = authService.generateBffToken(backendAuth);
    
    // Devolver respuesta con nuevo token y datos de usuario
    res.json({
      token: bffToken,
      user: backendAuth.user
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Error de autenticación',
      data: error.data
    });
  }
});

/**
 * @route GET /api/bff/auth/verify
 * @desc Verificar estado de autenticación
 * @access Público
 */
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = authService.verifyToken(token);
    res.json({ authenticated: true, user: decoded });
  } catch (error) {
    res.status(401).json({ authenticated: false, message: 'Sesión inválida o expirada' });
  }
});

module.exports = router;
