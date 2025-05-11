const db = require('../config/db');

/**
 * Obtener todas las evoluciones de un residente
 * Con opción para filtrar por tipo y fecha
 */
exports.getEvolucionesByResidente = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipoEvolucion, fechaInicio, fechaFin } = req.query;
    
    let query = `
      SELECT e.*, u.nombre as usuario_nombre, u.rol as usuario_rol
      FROM evoluciones e
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE e.anciano_id = $1
    `;
    
    const params = [id];
    let paramIndex = 2;
    
    // Filtrar por tipo
    if (tipoEvolucion) {
      query += ` AND e.tipo_evolucion = $${paramIndex++}`;
      params.push(tipoEvolucion);
    }
    
    // Filtrar por rango de fechas
    if (fechaInicio && fechaFin) {
      query += ` AND e.fecha_registro BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      query += ` AND e.fecha_registro >= $${paramIndex++}`;
      params.push(fechaInicio);
    } else if (fechaFin) {
      query += ` AND e.fecha_registro <= $${paramIndex++}`;
      params.push(fechaFin);
    }
    
    // Ordenar por fecha de registro descendente (más reciente primero)
    query += ` ORDER BY e.fecha_registro DESC`;
    
    const result = await db.query(query, params);
    
    // Para cada evolución que tenga orden_medica_id, obtener los detalles básicos de la orden
    for (const evolucion of result.rows) {
      if (evolucion.orden_medica_id) {
        const ordenQuery = `
          SELECT id, descripcion, fecha_orden
          FROM ordenes_medicas
          WHERE id = $1
        `;
        const ordenResult = await db.query(ordenQuery, [evolucion.orden_medica_id]);
        if (ordenResult.rows.length > 0) {
          evolucion.orden_medica = ordenResult.rows[0];
        }
      }
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener evoluciones:', err);
    res.status(500).json({ message: 'Error al obtener evoluciones', error: err.message });
  }
};

/**
 * Crear una nueva evolución para un residente
 */
exports.createEvolucion = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, tipo_evolucion, orden_medica_id } = req.body;
    
    // Verificar si el residente existe
    const checkResidente = await db.query('SELECT id FROM ancianos WHERE id = $1', [id]);
    if (checkResidente.rows.length === 0) {
      return res.status(404).json({ message: `Residente con ID ${id} no encontrado` });
    }
    
    // Validar datos
    if (!descripcion) {
      return res.status(400).json({ 
        message: 'La descripción es obligatoria', 
        requiredFields: ['descripcion'] 
      });
    }
    
    // Si hay orden_medica_id, verificar que existe y pertenece a este residente
    if (orden_medica_id) {
      const checkOrden = await db.query(
        'SELECT id FROM ordenes_medicas WHERE id = $1 AND anciano_id = $2',
        [orden_medica_id, id]
      );
      
      if (checkOrden.rows.length === 0) {
        return res.status(400).json({ 
          message: `La orden médica con ID ${orden_medica_id} no existe o no pertenece a este residente` 
        });
      }
    }
    
    const query = `
      INSERT INTO evoluciones (
        anciano_id,
        descripcion,
        tipo_evolucion,
        usuario_id,
        orden_medica_id
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      id,
      descripcion,
      tipo_evolucion || null,
      req.user.id,
      orden_medica_id || null
    ];
    
    const result = await db.query(query, values);
    
    // Obtener datos del usuario que creó la evolución
    const usuarioQuery = `
      SELECT nombre, rol 
      FROM usuarios 
      WHERE id = $1
    `;
    
    const usuarioResult = await db.query(usuarioQuery, [req.user.id]);
    
    // Combinar resultados
    const evolucionConUsuario = {
      ...result.rows[0],
      usuario_nombre: usuarioResult.rows[0].nombre,
      usuario_rol: usuarioResult.rows[0].rol
    };
    
    res.status(201).json(evolucionConUsuario);
  } catch (err) {
    console.error('Error al crear evolución:', err);
    res.status(500).json({ message: 'Error al crear evolución', error: err.message });
  }
};

/**
 * Actualizar una evolución
 * Solo permite actualizar evoluciones creadas en el mismo día por el mismo usuario
 * o por un administrador
 */
exports.updateEvolucion = async (req, res) => {
  try {
    const { id, evolucionId } = req.params;
    const { descripcion } = req.body;
    
    // Verificar si la evolución existe y pertenece a este residente
    const checkEvolucion = await db.query(
      'SELECT * FROM evoluciones WHERE id = $1 AND anciano_id = $2',
      [evolucionId, id]
    );
    
    if (checkEvolucion.rows.length === 0) {
      return res.status(404).json({ message: `Evolución no encontrada` });
    }
    
    // Verificar si el usuario tiene permisos para modificar
    // Solo el usuario que creó la evolución (el mismo día) o un admin puede modificarla
    const evolucion = checkEvolucion.rows[0];
    const fechaEvolucion = new Date(evolucion.fecha_registro);
    const hoy = new Date();
    
    const esMismoDia = 
      fechaEvolucion.getDate() === hoy.getDate() &&
      fechaEvolucion.getMonth() === hoy.getMonth() &&
      fechaEvolucion.getFullYear() === hoy.getFullYear();
    
    if (req.user.id !== evolucion.usuario_id && req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'No tiene permisos para modificar esta evolución' 
      });
    }
    
    if (req.user.id === evolucion.usuario_id && !esMismoDia && req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'Solo puede modificar evoluciones del día actual' 
      });
    }
    
    // Validar datos
    if (!descripcion) {
      return res.status(400).json({ 
        message: 'La descripción es obligatoria', 
        requiredFields: ['descripcion'] 
      });
    }
    
    const query = `
      UPDATE evoluciones
      SET descripcion = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [descripcion, evolucionId]);
    
    // Obtener datos del usuario que creó la evolución
    const usuarioQuery = `
      SELECT nombre, rol 
      FROM usuarios 
      WHERE id = $1
    `;
    
    const usuarioResult = await db.query(usuarioQuery, [evolucion.usuario_id]);
    
    // Combinar resultados
    const evolucionActualizada = {
      ...result.rows[0],
      usuario_nombre: usuarioResult.rows[0].nombre,
      usuario_rol: usuarioResult.rows[0].rol
    };
    
    res.json(evolucionActualizada);
  } catch (err) {
    console.error('Error al actualizar evolución:', err);
    res.status(500).json({ message: 'Error al actualizar evolución', error: err.message });
  }
};

/**
 * Eliminar una evolución
 * Solo administradores pueden eliminar evoluciones
 */
exports.deleteEvolucion = async (req, res) => {
  try {
    const { id, evolucionId } = req.params;
    
    // Verificar que sea administrador
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'Solo administradores pueden eliminar evoluciones' 
      });
    }
    
    // Verificar si la evolución existe y pertenece a este residente
    const checkEvolucion = await db.query(
      'SELECT * FROM evoluciones WHERE id = $1 AND anciano_id = $2',
      [evolucionId, id]
    );
    
    if (checkEvolucion.rows.length === 0) {
      return res.status(404).json({ message: `Evolución no encontrada` });
    }
    
    await db.query('DELETE FROM evoluciones WHERE id = $1', [evolucionId]);
    
    res.json({ message: 'Evolución eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar evolución:', err);
    res.status(500).json({ message: 'Error al eliminar evolución', error: err.message });
  }
};