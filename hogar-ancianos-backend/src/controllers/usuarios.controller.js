const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Obtener todos los usuarios
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getUsuarios = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, username, nombre, apellido, email, rol, created_at, updated_at FROM usuarios ORDER BY created_at DESC'
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      message: 'Error al obtener usuarios', 
      error: error.message 
    });
  }
};

/**
 * Obtener un usuario por ID
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar permisos (solo admin puede ver cualquier usuario, otros solo pueden verse a sí mismos)
    if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'No tiene permisos para ver este usuario' });
    }
    
    const { rows } = await db.query(
      'SELECT id, username, nombre, apellido, email, rol, created_at, updated_at FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ 
      message: 'Error al obtener usuario', 
      error: error.message 
    });
  }
};

/**
 * Crear un nuevo usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.createUsuario = async (req, res) => {
  try {
    const { username, nombre, apellido, email, password, rol } = req.body;
    
    // Validaciones básicas
    if (!username || !nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    
    // Validar que el rol sea válido (admin, enfermera, doctor)
    const rolesValidos = ['admin', 'enfermera', 'doctor'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ message: 'Rol no válido. Los roles permitidos son: admin, enfermera, doctor' });
    }
    
    // Verificar si ya existe un usuario con ese username o email
    const checkExistente = await db.query(
      'SELECT id FROM usuarios WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (checkExistente.rows.length > 0) {
      return res.status(400).json({ message: 'El nombre de usuario o email ya está en uso' });
    }
    
    // Hash de la contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Insertar el nuevo usuario
    const result = await db.query(
      'INSERT INTO usuarios (username, nombre, apellido, email, password, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, nombre, apellido, email, rol, created_at',
      [username, nombre, apellido, email, hashedPassword, rol]
    );
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ 
      message: 'Error al crear usuario', 
      error: error.message 
    });
  }
};

/**
 * Actualizar un usuario existente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, rol, password } = req.body;
    
    // Solo el admin puede cambiar roles
    if (req.user.rol !== 'admin' && rol && rol !== req.user.rol) {
      return res.status(403).json({ message: 'No tiene permisos para cambiar el rol del usuario' });
    }
    
    // Verificar que el usuario existe
    const checkUsuario = await db.query(
      'SELECT id, rol FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (checkUsuario.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Si no es admin, solo puede modificar su propio usuario
    if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'No tiene permisos para modificar este usuario' });
    }
    
    // Actualizar los campos proporcionados
    let query = 'UPDATE usuarios SET ';
    let params = [];
    let paramIndex = 1;
    
    if (nombre) {
      query += `nombre = $${paramIndex}, `;
      params.push(nombre);
      paramIndex++;
    }
    
    if (apellido) {
      query += `apellido = $${paramIndex}, `;
      params.push(apellido);
      paramIndex++;
    }
    
    if (email) {
      query += `email = $${paramIndex}, `;
      params.push(email);
      paramIndex++;
    }
    
    if (rol) {
      query += `rol = $${paramIndex}, `;
      params.push(rol);
      paramIndex++;
    }
    
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      query += `password = $${paramIndex}, `;
      params.push(hashedPassword);
      paramIndex++;
    }
    
    query += `updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, username, nombre, apellido, email, rol, updated_at`;
    params.push(id);
    
    const result = await db.query(query, params);
    
    res.json({
      message: 'Usuario actualizado exitosamente',
      usuario: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ 
      message: 'Error al actualizar usuario', 
      error: error.message 
    });
  }
};

/**
 * Eliminar un usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Solo admin puede eliminar usuarios
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tiene permisos para eliminar usuarios' });
    }
    
    // Verificar que el usuario existe
    const checkUsuario = await db.query(
      'SELECT id FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (checkUsuario.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // No permitir que un admin se elimine a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'No puede eliminar su propio usuario' });
    }
    
    // Eliminar el usuario
    await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
    
    res.json({ message: 'Usuario eliminado exitosamente' });
    
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ 
      message: 'Error al eliminar usuario', 
      error: error.message 
    });
  }
};