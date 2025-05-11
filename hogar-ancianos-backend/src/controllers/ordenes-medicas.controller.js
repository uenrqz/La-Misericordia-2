const db = require('../config/db');

/**
 * Obtener todas las órdenes médicas de un residente
 * Con opción para filtrar por estado (activo/inactivo/todas)
 */
exports.getOrdenesMedicasByResidente = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado = 'activo' } = req.query;
    
    let query = `
      SELECT om.*, u.nombre as medico_nombre
      FROM ordenes_medicas om
      JOIN usuarios u ON om.medico_id = u.id
      WHERE om.anciano_id = $1
    `;
    
    const params = [id];
    
    // Filtrar por estado si no es 'todas'
    if (estado !== 'todas') {
      query += ` AND om.estado = $2`;
      params.push(estado);
    }
    
    // Ordenar por fecha más reciente primero
    query += ` ORDER BY om.fecha_orden DESC`;
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener órdenes médicas:', err);
    res.status(500).json({ message: 'Error al obtener órdenes médicas', error: err.message });
  }
};

/**
 * Obtener una orden médica específica
 */
exports.getOrdenMedicaById = async (req, res) => {
  try {
    const { id, ordenId } = req.params;
    
    const query = `
      SELECT om.*, u.nombre as medico_nombre
      FROM ordenes_medicas om
      JOIN usuarios u ON om.medico_id = u.id
      WHERE om.id = $1 AND om.anciano_id = $2
    `;
    
    const result = await db.query(query, [ordenId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Orden médica no encontrada` });
    }
    
    // Obtener los medicamentos asociados a esta orden médica
    const medicamentosQuery = `
      SELECT mr.*, m.nombre as medicamento_nombre
      FROM medicamentos_residentes mr
      JOIN medicamentos m ON mr.medicamento_id = m.id
      WHERE mr.orden_medica_id = $1
    `;
    
    const medicamentosResult = await db.query(medicamentosQuery, [ordenId]);
    
    // Combinar resultados
    const ordenMedica = {
      ...result.rows[0],
      medicamentos: medicamentosResult.rows
    };
    
    res.json(ordenMedica);
  } catch (err) {
    console.error('Error al obtener orden médica:', err);
    res.status(500).json({ message: 'Error al obtener orden médica', error: err.message });
  }
};

/**
 * Crear una nueva orden médica
 * Solo médicos pueden crear órdenes
 */
exports.createOrdenMedica = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      descripcion, 
      indicaciones, 
      fecha_vencimiento,
      medicamentos
    } = req.body;
    
    // Verificar que el usuario sea médico
    if (req.user.rol !== 'medico' && req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'Solo médicos pueden crear órdenes médicas' 
      });
    }
    
    // Verificar si el residente existe
    const checkResidente = await db.query('SELECT id FROM ancianos WHERE id = $1', [id]);
    if (checkResidente.rows.length === 0) {
      return res.status(404).json({ message: `Residente con ID ${id} no encontrado` });
    }
    
    // Validar datos
    if (!descripcion || !indicaciones) {
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios', 
        requiredFields: ['descripcion', 'indicaciones'] 
      });
    }
    
    // Iniciar transacción para insertar orden médica y medicamentos asociados
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Insertar orden médica
      const ordenQuery = `
        INSERT INTO ordenes_medicas (
          anciano_id, 
          fecha_orden, 
          descripcion, 
          indicaciones, 
          estado,
          medico_id,
          fecha_vencimiento
        ) VALUES ($1, NOW(), $2, $3, $4, $5, $6) 
        RETURNING *
      `;
      
      const ordenValues = [
        id,
        descripcion,
        indicaciones,
        'activo',
        req.user.id,
        fecha_vencimiento || null
      ];
      
      const ordenResult = await client.query(ordenQuery, ordenValues);
      const ordenMedicaId = ordenResult.rows[0].id;
      
      // Si hay medicamentos, insertarlos
      if (medicamentos && medicamentos.length > 0) {
        for (const med of medicamentos) {
          const medicamentoQuery = `
            INSERT INTO medicamentos_residentes (
              anciano_id,
              medicamento_id,
              dosis,
              frecuencia,
              hora_administracion,
              via_administracion,
              fecha_inicio,
              fecha_fin,
              estado,
              orden_medica_id,
              observaciones
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
          `;
          
          const medicamentoValues = [
            id,
            med.medicamento_id,
            med.dosis,
            med.frecuencia,
            med.hora_administracion || null,
            med.via_administracion || null,
            med.fecha_inicio || new Date(),
            med.fecha_fin || null,
            'activo',
            ordenMedicaId,
            med.observaciones || null
          ];
          
          await client.query(medicamentoQuery, medicamentoValues);
        }
      }
      
      // Registrar en evolución
      const evolucionQuery = `
        INSERT INTO evoluciones (
          anciano_id,
          descripcion,
          tipo_evolucion,
          usuario_id,
          orden_medica_id
        ) VALUES ($1, $2, $3, $4, $5)
      `;
      
      const evolucionValues = [
        id,
        `Nueva orden médica: ${descripcion}`,
        'orden_medica',
        req.user.id,
        ordenMedicaId
      ];
      
      await client.query(evolucionQuery, evolucionValues);
      
      // Crear notificación para enfermeras sobre nueva orden médica
      const enfermeras = await client.query(`SELECT id FROM usuarios WHERE rol = 'enfermera'`);
      
      if (enfermeras.rows.length > 0) {
        // Obtener datos del residente para la notificación
        const residente = await client.query(`SELECT nombre, apellido FROM ancianos WHERE id = $1`, [id]);
        
        // Para cada enfermera, crear una notificación
        for (const enfermera of enfermeras.rows) {
          await client.query(
            `INSERT INTO notificaciones 
            (usuario_id, mensaje, tipo, enlace) 
            VALUES ($1, $2, 'nueva_orden_medica', $3)`,
            [
              enfermera.id,
              `Nueva orden médica para ${residente.rows[0].nombre} ${residente.rows[0].apellido}`,
              `/residentes/${id}/ordenes/${ordenMedicaId}`
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Obtener la orden médica completa con medicamentos para devolver
      const ordenCompleta = {
        ...ordenResult.rows[0],
        medicamentos: medicamentos || []
      };
      
      res.status(201).json(ordenCompleta);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al crear orden médica:', err);
    res.status(500).json({ message: 'Error al crear orden médica', error: err.message });
  }
};

/**
 * Actualizar una orden médica
 * Solo el médico que la creó o un admin pueden actualizarla
 */
exports.updateOrdenMedica = async (req, res) => {
  try {
    const { id, ordenId } = req.params;
    const { 
      descripcion, 
      indicaciones, 
      estado,
      fecha_vencimiento
    } = req.body;
    
    // Verificar si la orden existe y pertenece a este residente
    const checkOrden = await db.query(
      'SELECT * FROM ordenes_medicas WHERE id = $1 AND anciano_id = $2',
      [ordenId, id]
    );
    
    if (checkOrden.rows.length === 0) {
      return res.status(404).json({ message: `Orden médica no encontrada` });
    }
    
    // Verificar que el usuario tenga permisos (médico que creó la orden o admin)
    if (req.user.rol !== 'admin' && req.user.id !== checkOrden.rows[0].medico_id) {
      return res.status(403).json({ message: 'No tiene permisos para modificar esta orden' });
    }
    
    // Preparar campos a actualizar
    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;
    
    if (descripcion) {
      fieldsToUpdate.push(`descripcion = $${paramIndex++}`);
      values.push(descripcion);
    }
    
    if (indicaciones) {
      fieldsToUpdate.push(`indicaciones = $${paramIndex++}`);
      values.push(indicaciones);
    }
    
    if (estado) {
      fieldsToUpdate.push(`estado = $${paramIndex++}`);
      values.push(estado);
    }
    
    if (fecha_vencimiento !== undefined) {
      fieldsToUpdate.push(`fecha_vencimiento = $${paramIndex++}`);
      values.push(fecha_vencimiento);
    }
    
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }
    
    // Añadir ID al final de los valores
    values.push(ordenId);
    
    const query = `
      UPDATE ordenes_medicas 
      SET ${fieldsToUpdate.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    
    // Si se cambió el estado a inactivo, actualizar estado de medicamentos asociados
    if (estado === 'inactivo') {
      await db.query(
        `UPDATE medicamentos_residentes 
         SET estado = 'inactivo' 
         WHERE orden_medica_id = $1`,
        [ordenId]
      );
      
      // Registrar en evolución
      await db.query(
        `INSERT INTO evoluciones (
          anciano_id,
          descripcion,
          tipo_evolucion,
          usuario_id,
          orden_medica_id
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          `Orden médica desactivada: ${result.rows[0].descripcion}`,
          'orden_medica_desactivada',
          req.user.id,
          ordenId
        ]
      );
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar orden médica:', err);
    res.status(500).json({ message: 'Error al actualizar orden médica', error: err.message });
  }
};

/**
 * Eliminar una orden médica
 * Solo admin puede eliminar
 */
exports.deleteOrdenMedica = async (req, res) => {
  try {
    const { id, ordenId } = req.params;
    
    // Verificar si es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden eliminar órdenes médicas' });
    }
    
    // Verificar si la orden existe y pertenece a este residente
    const checkOrden = await db.query(
      'SELECT * FROM ordenes_medicas WHERE id = $1 AND anciano_id = $2',
      [ordenId, id]
    );
    
    if (checkOrden.rows.length === 0) {
      return res.status(404).json({ message: `Orden médica no encontrada` });
    }
    
    // Eliminar en cascada (los medicamentos asociados se eliminarán por la restricción ON DELETE CASCADE)
    await db.query('DELETE FROM ordenes_medicas WHERE id = $1', [ordenId]);
    
    res.json({ message: `Orden médica eliminada correctamente` });
  } catch (err) {
    console.error('Error al eliminar orden médica:', err);
    res.status(500).json({ message: 'Error al eliminar orden médica', error: err.message });
  }
};