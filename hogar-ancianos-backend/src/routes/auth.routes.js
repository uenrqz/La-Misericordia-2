const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

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

module.exports = router;