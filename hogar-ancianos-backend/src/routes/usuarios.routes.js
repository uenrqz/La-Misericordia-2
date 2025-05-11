const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');

// Aquí se importará el controlador de usuarios cuando se implemente
// const usuariosController = require('../controllers/usuarios.controller');

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios (solo admin)
 * @access  Private
 */
router.get('/', authenticate(['admin']), (req, res) => {
  // Implementación temporal
  res.json({ message: 'Endpoint para obtener usuarios - Por implementar' });
});

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener un usuario por su ID
 * @access  Private (admin o el mismo usuario)
 */
router.get('/:id', authenticate(['admin']), (req, res) => {
  // Implementación temporal
  res.json({ message: `Endpoint para obtener usuario con ID ${req.params.id} - Por implementar` });
});

/**
 * @route   POST /api/usuarios
 * @desc    Crear un nuevo usuario
 * @access  Private (solo admin)
 */
router.post('/', authenticate(['admin']), (req, res) => {
  // Implementación temporal
  res.json({ message: 'Endpoint para crear usuario - Por implementar' });
});

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar un usuario existente
 * @access  Private (admin o el mismo usuario)
 */
router.put('/:id', authenticate(['admin']), (req, res) => {
  // Implementación temporal
  res.json({ message: `Endpoint para actualizar usuario con ID ${req.params.id} - Por implementar` });
});

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar un usuario
 * @access  Private (solo admin)
 */
router.delete('/:id', authenticate(['admin']), (req, res) => {
  // Implementación temporal
  res.json({ message: `Endpoint para eliminar usuario con ID ${req.params.id} - Por implementar` });
});

module.exports = router;