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
    console.log('[BFF Auth Route] Procesando petición de login para:', req.body.username);
    
    // Autenticar con el backend
    const backendAuth = await authService.login(req.body);
    
    console.log('[BFF Auth Route] Autenticación exitosa con backend');
    
    // Generar token del BFF
    const bffToken = authService.generateBffToken(backendAuth);
    
    console.log('[BFF Auth Route] Token BFF generado exitosamente');
    
    // Devolver respuesta con nuevo token y datos de usuario
    res.json({
      token: bffToken,
      user: backendAuth.user
    });
  } catch (error) {
    console.error('[BFF Auth Route] Error en login:', {
      status: error.status || 500,
      message: error.message,
      data: error.data,
      code: error.code
    });
    
    // Mejorar el mensaje de error para el cliente
    let clientMessage = error.message || 'Error de autenticación';
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      clientMessage = 'El servidor de autenticación no está disponible. Por favor intente más tarde.';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      clientMessage = 'El servidor tardó demasiado en responder. Por favor intente nuevamente.';
    }
    
    res.status(error.status || 500).json({
      message: clientMessage,
      data: error.data,
      code: error.code
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

/**
 * @route POST /api/bff/auth/refresh
 * @desc Refrescar el token BFF usando el token original del backend
 * @access Privado
 */
router.post('/refresh', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  const bffToken = authHeader.split(' ')[1];
  try {
    // Decodificar el token BFF
    const decoded = authService.verifyToken(bffToken);
    const originalToken = decoded.originalToken;
    // Llamar al backend para refrescar el token original
    const backendResponse = await authService.refreshBackendToken(originalToken);
    // Generar nuevo token BFF con el nuevo token del backend
    const newBffToken = authService.generateBffToken({
      user: backendResponse.user,
      token: backendResponse.token
    });
    res.json({
      token: newBffToken,
      user: backendResponse.user
    });
  } catch (error) {
    res.status(error.status || 401).json({
      message: error.message || 'No se pudo refrescar el token',
      data: error.data
    });
  }
});

/**
 * @route POST /api/bff/auth/logout
 * @desc Cerrar sesión del usuario
 * @access Privado
 */
router.post('/logout', async (req, res) => {
  try {
    // Solo confirmar que el logout fue exitoso
    // El frontend se encarga de limpiar el almacenamiento local
    res.json({ 
      success: true, 
      message: 'Sesión cerrada exitosamente' 
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al cerrar sesión',
      error: error.message
    });
  }
});

module.exports = router;
