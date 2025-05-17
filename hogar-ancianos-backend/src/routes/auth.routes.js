const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/auth/sout
 * @desc    Redireccionar a la autenticación SOUT
 * @access  Public
 */
router.get('/sout', authController.loginSout);

/**
 * @route   GET /api/auth/sout/callback
 * @desc    Callback desde SOUT tras autenticación exitosa
 * @access  Public
 */
router.get('/sout/callback', authController.soutCallback);

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuario con credenciales locales
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/validate
 * @desc    Validar el token JWT (utilizado por el BFF)
 * @access  Private
 */
router.get('/validate', authenticate(), authController.validateToken);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refrescar el token JWT (utilizado por el BFF)
 * @access  Private
 */
router.post('/refresh', authenticate(), authController.refreshToken);

module.exports = router;