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
      'SELECT id, username, nombre, apellido, email, rol, cambio_password_requerido, activo, created_at, updated_at FROM usuarios ORDER BY created_at DESC'
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
      'SELECT id, username, nombre, apellido, email, rol, activo, cambio_password_requerido, created_at, updated_at FROM usuarios WHERE id = $1',
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
    
    // Validar que el rol sea válido (admin, enfermera, doctor/medico)
    const rolesValidos = ['admin', 'enfermera', 'doctor', 'medico'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ message: 'Rol no válido. Los roles permitidos son: admin, enfermera, doctor/medico' });
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
    
    // Para el caso de creación de usuario administrador, verificar si el usuario actual es admin
    // y si se requiere la aprobación de otros administradores
    if (rol === 'admin') {
      // Contar cuántos administradores activos hay en el sistema
      const { rows: adminCount } = await db.query(
        'SELECT COUNT(*) FROM usuarios WHERE rol = $1 AND activo = true',
        ['admin']
      );
      
      // Si ya hay administradores en el sistema, necesitamos crear una solicitud
      if (adminCount[0].count > 0) {
        // Primero creamos el usuario pero con rol temporal
        const tempRol = 'pendiente';
        
        const newUser = await db.query(
          'INSERT INTO usuarios (username, nombre, apellido, email, password, rol, cambio_password_requerido, activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, username, nombre, apellido, email, rol',
          [username, nombre, apellido, email, hashedPassword, tempRol, true, true]
        );
        
        // Crear la solicitud de administrador
        await db.query(
          'INSERT INTO solicitudes_admin (usuario_id, solicitante_id, mensaje) VALUES ($1, $2, $3)',
          [newUser.rows[0].id, req.user.id, `Usuario ${username} solicita permisos de administrador`]
        );
        
        return res.status(201).json({
          message: 'Usuario creado. Pendiente de aprobación por administradores existentes',
          usuario: newUser.rows[0],
          requiereAprobacion: true
        });
      }
    }
    
    // Insertar el nuevo usuario con cambio de contraseña obligatorio
    const result = await db.query(
      'INSERT INTO usuarios (username, nombre, apellido, email, password, rol, cambio_password_requerido, activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, username, nombre, apellido, email, rol, cambio_password_requerido, created_at',
      [username, nombre, apellido, email, hashedPassword, rol, true, true]
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
    const { nombre, apellido, email, rol } = req.body;
    
    // Verificar permisos (solo admin puede modificar a otros usuarios)
    if (req.user.id !== parseInt(id) && req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para modificar este usuario' });
    }
    
    // Si no es admin, no puede cambiar su rol
    if (req.user.rol !== 'admin' && rol) {
      return res.status(403).json({ message: 'No tienes permisos para cambiar el rol' });
    }
    
    // Validar que el rol sea válido si se está cambiando
    if (rol) {
      const rolesValidos = ['admin', 'enfermera', 'doctor', 'medico'];
      if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ message: 'Rol no válido. Los roles permitidos son: admin, enfermera, doctor/medico' });
      }
    }
    
    // Obtener el usuario actual para verificar que exista
    const { rows: usuarios } = await db.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (usuarios.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Construir la consulta de actualización dinámicamente
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (nombre) {
      updateFields.push(`nombre = $${paramIndex}`);
      queryParams.push(nombre);
      paramIndex++;
    }
    
    if (apellido) {
      updateFields.push(`apellido = $${paramIndex}`);
      queryParams.push(apellido);
      paramIndex++;
    }
    
    if (email) {
      updateFields.push(`email = $${paramIndex}`);
      queryParams.push(email);
      paramIndex++;
    }
    
    if (rol && req.user.rol === 'admin') {
      updateFields.push(`rol = $${paramIndex}`);
      queryParams.push(rol);
      paramIndex++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }
    
    // Agregar el ID del usuario como último parámetro
    queryParams.push(id);
    
    // Ejecutar la actualización
    const query = `
      UPDATE usuarios 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, username, nombre, apellido, email, rol, cambio_password_requerido, activo, created_at, updated_at
    `;
    
    const result = await db.query(query, queryParams);
    
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
    
    // Solo los administradores pueden eliminar usuarios
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar usuarios' });
    }
    
    // No permitir eliminar el propio usuario administrador
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }
    
    // Verificar si el usuario existe
    const { rows } = await db.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // En lugar de eliminar físicamente, marcar como inactivo (soft delete)
    await db.query(
      'UPDATE usuarios SET activo = false WHERE id = $1',
      [id]
    );
    
    res.json({
      message: 'Usuario eliminado exitosamente',
      id: parseInt(id)
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ 
      message: 'Error al eliminar usuario', 
      error: error.message 
    });
  }
};

/**
 * Obtener todas las solicitudes de administrador pendientes
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getSolicitudesAdmin = async (req, res) => {
  try {
    // Solo administradores pueden ver solicitudes
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tiene permisos para ver solicitudes de administrador' });
    }
    
    // Obtener solicitudes pendientes con información de usuarios
    const { rows } = await db.query(`
      SELECT sa.id, sa.usuario_id, sa.solicitante_id, sa.fecha_solicitud, sa.estado, sa.mensaje,
             u.username, u.nombre, u.apellido, u.email,
             s.username as solicitante_username, s.nombre as solicitante_nombre, s.apellido as solicitante_apellido
      FROM solicitudes_admin sa
      JOIN usuarios u ON sa.usuario_id = u.id
      JOIN usuarios s ON sa.solicitante_id = s.id
      WHERE sa.estado = 'pendiente'
      ORDER BY sa.fecha_solicitud DESC
    `);
    
    // Para cada solicitud, verificar si el admin actual ya ha votado
    const solicitudesConEstado = await Promise.all(rows.map(async (solicitud) => {
      const { rows: aprobaciones } = await db.query(
        'SELECT * FROM aprobaciones_admin WHERE solicitud_id = $1 AND admin_id = $2',
        [solicitud.id, req.user.id]
      );
      
      return {
        ...solicitud,
        yaVotado: aprobaciones.length > 0,
        miAprobacion: aprobaciones.length > 0 ? aprobaciones[0].aprobado : null
      };
    }));
    
    res.json(solicitudesConEstado);
  } catch (error) {
    console.error('Error al obtener solicitudes de administrador:', error);
    res.status(500).json({ 
      message: 'Error al obtener solicitudes de administrador', 
      error: error.message 
    });
  }
};

/**
 * Aprobar o rechazar una solicitud de administrador
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.responderSolicitudAdmin = async (req, res) => {
  try {
    const { solicitudId } = req.params;
    const { aprobado, comentario } = req.body;
    
    // Solo administradores pueden aprobar o rechazar
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tiene permisos para responder a solicitudes de administrador' });
    }
    
    // Verificar que la solicitud exista y esté pendiente
    const { rows: solicitudes } = await db.query(
      'SELECT * FROM solicitudes_admin WHERE id = $1 AND estado = $2',
      [solicitudId, 'pendiente']
    );
    
    if (solicitudes.length === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada o ya procesada' });
    }
    
    // Verificar que el admin no haya votado ya
    const { rows: aprobacionesExistentes } = await db.query(
      'SELECT * FROM aprobaciones_admin WHERE solicitud_id = $1 AND admin_id = $2',
      [solicitudId, req.user.id]
    );
    
    if (aprobacionesExistentes.length > 0) {
      return res.status(400).json({ message: 'Ya has respondido a esta solicitud' });
    }
    
    // Registrar la aprobación o rechazo
    await db.query(
      'INSERT INTO aprobaciones_admin (solicitud_id, admin_id, aprobado, comentario) VALUES ($1, $2, $3, $4)',
      [solicitudId, req.user.id, aprobado, comentario || '']
    );
    
    // La actualización del estado se hace automáticamente mediante el trigger de la DB
    // Pero verificamos si fue rechazada por este administrador
    if (!aprobado) {
      // Si un admin rechaza, automáticamente rechazamos la solicitud
      await db.query(
        'UPDATE solicitudes_admin SET estado = $1 WHERE id = $2',
        ['rechazado', solicitudId]
      );
    }
    
    // Verificar estado actual después de la votación
    const { rows: solicitudActualizada } = await db.query(
      'SELECT * FROM solicitudes_admin WHERE id = $1',
      [solicitudId]
    );
    
    res.json({
      message: aprobado ? 'Solicitud aprobada exitosamente' : 'Solicitud rechazada',
      solicitud: solicitudActualizada[0]
    });
  } catch (error) {
    console.error('Error al responder solicitud de administrador:', error);
    res.status(500).json({ 
      message: 'Error al procesar la respuesta', 
      error: error.message 
    });
  }
};

/**
 * Cambiar la contraseña de un usuario (para el primer ingreso o actualización)
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { passwordActual, passwordNueva, passwordConfirmacion } = req.body;
    
    // Verificar que el usuario tenga permisos
    if (req.user.id !== parseInt(id) && req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para cambiar esta contraseña' });
    }
    
    // Verificar que las contraseñas nuevas coincidan
    if (passwordNueva !== passwordConfirmacion) {
      return res.status(400).json({ message: 'Las contraseñas nuevas no coinciden' });
    }
    
    // Verificar que la contraseña nueva tenga al menos 8 caracteres
    if (passwordNueva.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }
    
    // Obtener la información del usuario
    const { rows: usuarios } = await db.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (usuarios.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    const usuario = usuarios[0];
    
    // Si no es admin, verificar la contraseña actual
    if (req.user.id === parseInt(id)) {
      const passwordValida = bcrypt.compareSync(passwordActual, usuario.password);
      if (!passwordValida) {
        return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
      }
    }
    
    // Hash de la nueva contraseña
    const hashedPassword = bcrypt.hashSync(passwordNueva, 10);
    
    // Actualizar la contraseña y marcar que ya no necesita cambio
    await db.query(
      'UPDATE usuarios SET password = $1, cambio_password_requerido = false, ultima_actualizacion_password = NOW() WHERE id = $2',
      [hashedPassword, id]
    );
    
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ 
      message: 'Error al cambiar la contraseña', 
      error: error.message 
    });
  }
};

/**
 * Actualizar el estado activo/inactivo de un usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.toggleEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    // Solo admin puede cambiar el estado
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para cambiar el estado del usuario' });
    }
    
    // No permitir desactivarse a sí mismo
    if (parseInt(id) === req.user.id && activo === false) {
      return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
    }
    
    // Actualizar estado
    await db.query(
      'UPDATE usuarios SET activo = $1 WHERE id = $2',
      [activo, id]
    );
    
    res.json({ 
      message: activo ? 'Usuario activado exitosamente' : 'Usuario desactivado exitosamente',
      id: parseInt(id),
      activo
    });
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({ 
      message: 'Error al cambiar el estado del usuario', 
      error: error.message 
    });
  }
};