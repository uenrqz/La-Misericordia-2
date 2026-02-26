const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const { normalizarPermisos, parsePermisos } = require('../config/permisos');

const puedeGestionarUsuarios = (req) => {
  return req.user?.rol === 'admin' || (Array.isArray(req.user?.permisos) && req.user.permisos.includes('usuarios'));
};

/**
 * Obtener lista pública de usuarios (solo información básica para login)
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getUsuariosPublicos = async (req, res) => {
  try {
    // Obtener solo la información necesaria para el login (sin datos sensibles)
    // Eliminamos la condición de "activo" que no existe en la tabla
    const { rows } = await pool.query(
      'SELECT id, username, nombre, apellido, rol FROM usuarios ORDER BY nombre, apellido'
    );
    
    console.log(`Retornando ${rows.length} usuarios públicos para login`);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios públicos:', error);
    res.status(500).json({ 
      message: 'Error al obtener lista de usuarios', 
      error: error.message 
    });
  }
};

/**
 * Obtener todos los usuarios
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getUsuarios = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, nombre, apellido, email, rol, permisos, cambio_password_requerido, activo, created_at, updated_at FROM usuarios ORDER BY created_at DESC'
    );

    const usuarios = rows.map((usuario) => ({
      ...usuario,
      permisos: parsePermisos(usuario.permisos)
    }));

    res.json(usuarios);
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
    if (!puedeGestionarUsuarios(req) && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'No tiene permisos para ver este usuario' });
    }
    
    const { rows } = await pool.query(
      'SELECT id, username, nombre, apellido, email, rol, permisos, activo, cambio_password_requerido, created_at, updated_at FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({
      ...rows[0],
      permisos: parsePermisos(rows[0].permisos)
    });
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
    const { username, nombre, apellido, email, password, rol, permisos } = req.body;
    
    console.log('Backend: Recibida solicitud para crear usuario:', {
      username,
      nombre, 
      apellido,
      email,
      rol,
      // No mostrar la contraseña en los logs
    });
    
    // Validaciones básicas
    if (!username || !nombre || !apellido || !password || !rol) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios (username, nombre, apellido, password, rol)' });
    }
    
    // Validar que el rol sea válido (admin, medico, enfermero, cuidador, secretaria)
    const rolesValidos = ['admin', 'medico', 'enfermero', 'cuidador', 'secretaria'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ message: `Rol no válido "${rol}". Los roles permitidos son: admin, medico, enfermero, cuidador, secretaria` });
    }
    
    // Verificar si ya existe un usuario con ese username o email
    let query = 'SELECT id FROM usuarios WHERE username = $1';
    let params = [username];
    
    if (email) {
      query += ' OR email = $2';
      params.push(email);
    }
    
    const checkExistente = await pool.query(query, params);
    
    if (checkExistente.rows.length > 0) {
      return res.status(400).json({ message: 'El nombre de usuario o email ya está en uso' });
    }
    
    // Hash de la contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const permisosFinal = normalizarPermisos(permisos, rol);
    const permisosJson = JSON.stringify(permisosFinal);

    // Para el caso de creación de usuario administrador, verificar si el usuario actual es admin
    // y si se requiere la aprobación de otros administradores
    if (rol === 'admin') {
      // Contar cuántos administradores activos hay en el sistema
      const { rows: adminRows } = await pool.query(
        'SELECT COUNT(*) FROM usuarios WHERE rol = $1',
        ['admin']
      );
      
      const adminCount = parseInt(adminRows[0].count);
      console.log(`Backend: Hay ${adminCount} administradores en el sistema`);
      
      // Si ya hay administradores en el sistema, necesitamos crear una solicitud
      if (adminCount > 0) {
        console.log('Backend: Creando usuario con rol temporal pendiente y solicitud de administrador');
        
        try {
          // Verificar si existe la tabla solicitudes_admin
          const { rows: tableRows } = await pool.query(`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_name = 'solicitudes_admin'
            ) as exists`
          );
          
          const solicitudesTableExists = tableRows[0].exists;
          
          if (solicitudesTableExists) {
            // Primero creamos el usuario pero con rol temporal
            const tempRol = 'pendiente';
            
            // Intentar insertar con los campos cambio_password_requerido y activo
            try {
              const newUser = await pool.query(
                'INSERT INTO usuarios (username, nombre, apellido, email, password, rol, permisos, cambio_password_requerido, activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, username, nombre, apellido, email, rol, permisos',
                [username, nombre, apellido, email || null, hashedPassword, tempRol, permisosJson, true, true]
              );
              
              // Crear la solicitud de administrador
              await pool.query(
                'INSERT INTO solicitudes_admin (usuario_id, solicitante_id, mensaje) VALUES ($1, $2, $3)',
                [newUser.rows[0].id, req.user.id, `Usuario ${username} solicita permisos de administrador`]
              );
              
              return res.status(201).json({
                message: 'Usuario creado. Pendiente de aprobación por administradores existentes',
                usuario: newUser.rows[0],
                requiereAprobacion: true
              });
            } catch (insertError) {
              console.error('Backend: Error al insertar con campos cambio_password_requerido y activo:', insertError);
              
              // Si falla, intentar sin esos campos
              const newUser = await pool.query(
                'INSERT INTO usuarios (username, nombre, apellido, email, password, rol, permisos) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, nombre, apellido, email, rol, permisos',
                [username, nombre, apellido, email || null, hashedPassword, tempRol, permisosJson]
              );
              
              // Crear la solicitud de administrador
              await pool.query(
                'INSERT INTO solicitudes_admin (usuario_id, solicitante_id, mensaje) VALUES ($1, $2, $3)',
                [newUser.rows[0].id, req.user.id, `Usuario ${username} solicita permisos de administrador`]
              );
              
              return res.status(201).json({
                message: 'Usuario creado. Pendiente de aprobación por administradores existentes',
                usuario: newUser.rows[0],
                requiereAprobacion: true
              });
            }
          } else {
            // Si no existe la tabla, permitimos la creación directa del administrador
            console.log('Backend: No existe tabla solicitudes_admin, creando admin directamente');
          }
        } catch (checkError) {
          console.error('Backend: Error al verificar tabla solicitudes_admin:', checkError);
          // Si hay un error, procedemos con la creación directa
        }
      }
    }
    
    console.log('Backend: Insertando nuevo usuario con rol:', rol);
    
    // Intentar insertar con diferentes combinaciones de campos según el esquema
    try {
      // Primero intentar con todos los campos
      const result = await pool.query(
        'INSERT INTO usuarios (username, nombre, apellido, email, password, rol, permisos, cambio_password_requerido, activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, username, nombre, apellido, email, rol, permisos, cambio_password_requerido, activo',
        [username, nombre, apellido, email || null, hashedPassword, rol, permisosJson, true, true]
      );
      
      console.log('Backend: Usuario creado exitosamente con todos los campos');
      
      return res.status(201).json({
        message: 'Usuario creado exitosamente',
        usuario: result.rows[0]
      });
    } catch (insertError) {
      console.error('Backend: Error al insertar con todos los campos:', insertError);
      
      try {
        // Si falla, intentar sin cambio_password_requerido ni activo
        const result = await pool.query(
          'INSERT INTO usuarios (username, nombre, apellido, email, password, rol, permisos) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, nombre, apellido, email, rol, permisos',
          [username, nombre, apellido, email || null, hashedPassword, rol, permisosJson]
        );
        
        console.log('Backend: Usuario creado exitosamente con campos básicos');
        
        return res.status(201).json({
          message: 'Usuario creado exitosamente',
          usuario: result.rows[0]
        });
      } catch (insertError2) {
        console.error('Backend: Error al insertar con campos básicos:', insertError2);
        throw new Error('No se pudo insertar el usuario en la base de datos. Revise el esquema de la tabla usuarios.');
      }
    }
  } catch (error) {
    console.error('Backend: Error al crear usuario:', error);
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
    const { nombre, apellido, email, rol, permisos } = req.body;
    
    // Verificar permisos (solo admin puede modificar a otros usuarios)
    if (req.user.id !== parseInt(id) && !puedeGestionarUsuarios(req)) {
      return res.status(403).json({ message: 'No tienes permisos para modificar este usuario' });
    }
    
    // Si no es admin, no puede cambiar su rol
    if (!puedeGestionarUsuarios(req) && rol) {
      return res.status(403).json({ message: 'No tienes permisos para cambiar el rol' });
    }
    
    // Validar que el rol sea válido si se está cambiando
    if (rol) {
      const rolesValidos = ['admin', 'medico', 'doctor', 'enfermero', 'enfermera', 'cuidador', 'secretaria'];
      if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ message: 'Rol no válido. Los roles permitidos son: admin, enfermera, doctor/medico' });
      }
    }
    
    // Obtener el usuario actual para verificar que exista
    const { rows: usuarios } = await pool.query(
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
    
    if (rol && puedeGestionarUsuarios(req)) {
      updateFields.push(`rol = $${paramIndex}`);
      queryParams.push(rol);
      paramIndex++;
    }

    if (puedeGestionarUsuarios(req) && permisos) {
      const permisosFinal = normalizarPermisos(permisos, rol || usuarios[0].rol);
      updateFields.push(`permisos = $${paramIndex}`);
      queryParams.push(JSON.stringify(permisosFinal));
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
      RETURNING id, username, nombre, apellido, email, rol, permisos, cambio_password_requerido, activo, created_at, updated_at
    `;
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      message: 'Usuario actualizado exitosamente',
      usuario: {
        ...result.rows[0],
        permisos: parsePermisos(result.rows[0].permisos)
      }
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
    if (!puedeGestionarUsuarios(req)) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar usuarios' });
    }
    
    // No permitir eliminar el propio usuario administrador
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }
    
    // Verificar si el usuario existe
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // En lugar de eliminar físicamente, marcar como inactivo (soft delete)
    await pool.query(
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
    if (!puedeGestionarUsuarios(req)) {
      return res.status(403).json({ message: 'No tiene permisos para ver solicitudes de administrador' });
    }
    
    // Obtener solicitudes pendientes con información de usuarios
    const { rows } = await pool.query(`
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
      const { rows: aprobaciones } = await pool.query(
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
    if (!puedeGestionarUsuarios(req)) {
      return res.status(403).json({ message: 'No tiene permisos para responder a solicitudes de administrador' });
    }
    
    // Verificar que la solicitud exista y esté pendiente
    const { rows: solicitudes } = await pool.query(
      'SELECT * FROM solicitudes_admin WHERE id = $1 AND estado = $2',
      [solicitudId, 'pendiente']
    );
    
    if (solicitudes.length === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada o ya procesada' });
    }
    
    // Verificar que el admin no haya votado ya
    const { rows: aprobacionesExistentes } = await pool.query(
      'SELECT * FROM aprobaciones_admin WHERE solicitud_id = $1 AND admin_id = $2',
      [solicitudId, req.user.id]
    );
    
    if (aprobacionesExistentes.length > 0) {
      return res.status(400).json({ message: 'Ya has respondido a esta solicitud' });
    }
    
    // Registrar la aprobación o rechazo
    await pool.query(
      'INSERT INTO aprobaciones_admin (solicitud_id, admin_id, aprobado, comentario) VALUES ($1, $2, $3, $4)',
      [solicitudId, req.user.id, aprobado, comentario || '']
    );
    
    // La actualización del estado se hace automáticamente mediante el trigger de la DB
    // Pero verificamos si fue rechazada por este administrador
    if (!aprobado) {
      // Si un admin rechaza, automáticamente rechazamos la solicitud
      await pool.query(
        'UPDATE solicitudes_admin SET estado = $1 WHERE id = $2',
        ['rechazado', solicitudId]
      );
    }
    
    // Verificar estado actual después de la votación
    const { rows: solicitudActualizada } = await pool.query(
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
    if (req.user.id !== parseInt(id) && !puedeGestionarUsuarios(req)) {
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
    const { rows: usuarios } = await pool.query(
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
    await pool.query(
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
    if (!puedeGestionarUsuarios(req)) {
      return res.status(403).json({ message: 'No tienes permisos para cambiar el estado del usuario' });
    }
    
    // No permitir desactivarse a sí mismo
    if (parseInt(id) === req.user.id && activo === false) {
      return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
    }
    
    // Actualizar estado
    await pool.query(
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