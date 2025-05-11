const db = require('../config/db');

/**
 * Obtener los signos vitales de un residente específico
 * Puede filtrar por rango de fechas
 */
exports.getSignosVitalesByResidente = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.query;
    
    let query = `
      SELECT sv.*, u.nombre as usuario_nombre
      FROM signos_vitales sv
      JOIN usuarios u ON sv.usuario_id = u.id
      WHERE sv.anciano_id = $1
    `;
    
    const params = [id];
    
    if (fechaInicio && fechaFin) {
      query += ` AND sv.fecha_registro BETWEEN $2 AND $3`;
      params.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      query += ` AND sv.fecha_registro >= $2`;
      params.push(fechaInicio);
    } else if (fechaFin) {
      query += ` AND sv.fecha_registro <= $2`;
      params.push(fechaFin);
    }
    
    query += ` ORDER BY sv.fecha_registro DESC`;
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: `No se encontraron signos vitales para el residente con ID ${id}` });
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener signos vitales:', err);
    res.status(500).json({ message: 'Error al obtener signos vitales', error: err.message });
  }
};

/**
 * Registrar nuevos signos vitales para un residente
 */
exports.createSignosVitales = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      temperatura, 
      presion_arterial, 
      frecuencia_cardiaca, 
      frecuencia_respiratoria,
      saturacion_oxigeno,
      glucosa,
      peso,
      observaciones
    } = req.body;
    
    // Verificar si el residente existe
    const checkResidente = await db.query('SELECT id FROM ancianos WHERE id = $1', [id]);
    if (checkResidente.rows.length === 0) {
      return res.status(404).json({ message: `Residente con ID ${id} no encontrado` });
    }
    
    // Validar datos
    if (!temperatura && !presion_arterial && !frecuencia_cardiaca) {
      return res.status(400).json({ 
        message: 'Debe proporcionar al menos un signo vital (temperatura, presión arterial o frecuencia cardiaca)'
      });
    }
    
    const query = `
      INSERT INTO signos_vitales (
        anciano_id, 
        temperatura, 
        presion_arterial, 
        frecuencia_cardiaca, 
        frecuencia_respiratoria,
        saturacion_oxigeno,
        glucosa,
        peso,
        observaciones,
        usuario_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *
    `;
    
    const values = [
      id,
      temperatura || null,
      presion_arterial || null,
      frecuencia_cardiaca || null,
      frecuencia_respiratoria || null,
      saturacion_oxigeno || null,
      glucosa || null,
      peso || null,
      observaciones || null,
      req.user.id // ID del usuario que registra los signos vitales
    ];
    
    const result = await db.query(query, values);
    
    // Registrar en tabla de notificaciones si algún signo vital está fuera de rango
    let requiereNotificacion = false;
    const mensajesAlerta = [];
    
    if (temperatura && (temperatura > 37.5 || temperatura < 35.5)) {
      requiereNotificacion = true;
      mensajesAlerta.push(`Temperatura anormal: ${temperatura}°C`);
    }
    
    if (frecuencia_cardiaca && (frecuencia_cardiaca > 100 || frecuencia_cardiaca < 60)) {
      requiereNotificacion = true;
      mensajesAlerta.push(`Frecuencia cardíaca anormal: ${frecuencia_cardiaca} lpm`);
    }
    
    // Si hay valores fuera de rango, crear notificación para el médico
    if (requiereNotificacion) {
      // Obtener IDs de usuarios con rol médico
      const medicos = await db.query(`SELECT id FROM usuarios WHERE rol = 'medico'`);
      
      if (medicos.rows.length > 0) {
        // Obtener datos del residente para la notificación
        const residente = await db.query(`SELECT nombre, apellido FROM ancianos WHERE id = $1`, [id]);
        
        // Para cada médico, crear una notificación
        for (const medico of medicos.rows) {
          await db.query(
            `INSERT INTO notificaciones 
            (usuario_id, mensaje, tipo, enlace) 
            VALUES ($1, $2, 'alerta_signos_vitales', $3)`,
            [
              medico.id,
              `¡Alerta! ${residente.rows[0].nombre} ${residente.rows[0].apellido} presenta: ${mensajesAlerta.join(', ')}`,
              `/residentes/${id}/historial-medico`
            ]
          );
        }
      }
    }
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al registrar signos vitales:', err);
    res.status(500).json({ message: 'Error al registrar signos vitales', error: err.message });
  }
};

/**
 * Actualizar registro de signos vitales
 * Solo se permite actualizar registros del mismo día
 */
exports.updateSignosVitales = async (req, res) => {
  try {
    const { id, signoVitalId } = req.params;
    const { 
      temperatura, 
      presion_arterial, 
      frecuencia_cardiaca, 
      frecuencia_respiratoria,
      saturacion_oxigeno,
      glucosa,
      peso,
      observaciones
    } = req.body;
    
    // Verificar si el registro existe y es del mismo día
    const checkSignoVital = await db.query(
      `SELECT * FROM signos_vitales 
       WHERE id = $1 AND anciano_id = $2 
       AND DATE(fecha_registro) = CURRENT_DATE`,
      [signoVitalId, id]
    );
    
    if (checkSignoVital.rows.length === 0) {
      return res.status(404).json({ 
        message: `No se encontró el registro o no se puede modificar porque no es del día actual`
      });
    }
    
    // Verificar si el usuario actual es quien registró los signos vitales o es un admin
    if (req.user.rol !== 'admin' && req.user.id !== checkSignoVital.rows[0].usuario_id) {
      return res.status(403).json({ 
        message: `No tiene permisos para modificar este registro`
      });
    }
    
    // Preparar campos a actualizar
    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;
    
    if (temperatura !== undefined) {
      fieldsToUpdate.push(`temperatura = $${paramIndex++}`);
      values.push(temperatura);
    }
    
    if (presion_arterial !== undefined) {
      fieldsToUpdate.push(`presion_arterial = $${paramIndex++}`);
      values.push(presion_arterial);
    }
    
    if (frecuencia_cardiaca !== undefined) {
      fieldsToUpdate.push(`frecuencia_cardiaca = $${paramIndex++}`);
      values.push(frecuencia_cardiaca);
    }
    
    if (frecuencia_respiratoria !== undefined) {
      fieldsToUpdate.push(`frecuencia_respiratoria = $${paramIndex++}`);
      values.push(frecuencia_respiratoria);
    }
    
    if (saturacion_oxigeno !== undefined) {
      fieldsToUpdate.push(`saturacion_oxigeno = $${paramIndex++}`);
      values.push(saturacion_oxigeno);
    }
    
    if (glucosa !== undefined) {
      fieldsToUpdate.push(`glucosa = $${paramIndex++}`);
      values.push(glucosa);
    }
    
    if (peso !== undefined) {
      fieldsToUpdate.push(`peso = $${paramIndex++}`);
      values.push(peso);
    }
    
    if (observaciones !== undefined) {
      fieldsToUpdate.push(`observaciones = $${paramIndex++}`);
      values.push(observaciones);
    }
    
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }
    
    // Añadir ID al final de los valores
    values.push(signoVitalId);
    
    const query = `
      UPDATE signos_vitales 
      SET ${fieldsToUpdate.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar signos vitales:', err);
    res.status(500).json({ message: 'Error al actualizar signos vitales', error: err.message });
  }
};

/**
 * Obtener estadísticas de signos vitales para un residente
 * (útil para gráficas y seguimiento)
 */
exports.getEstadisticasSignosVitales = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipoEstadistica, dias = 7 } = req.query;
    
    // Verificar si el residente existe
    const checkResidente = await db.query('SELECT id FROM ancianos WHERE id = $1', [id]);
    if (checkResidente.rows.length === 0) {
      return res.status(404).json({ message: `Residente con ID ${id} no encontrado` });
    }
    
    let query;
    
    // Estadísticas por tipo
    if (tipoEstadistica === 'temperatura') {
      query = `
        SELECT 
          DATE(fecha_registro) as fecha,
          ROUND(AVG(temperatura)::numeric, 1) as promedio,
          MAX(temperatura) as maximo,
          MIN(temperatura) as minimo
        FROM signos_vitales
        WHERE anciano_id = $1
          AND fecha_registro >= NOW() - INTERVAL '${dias} days'
          AND temperatura IS NOT NULL
        GROUP BY DATE(fecha_registro)
        ORDER BY fecha DESC
      `;
    } else if (tipoEstadistica === 'presion') {
      // Para presión arterial, devolvemos los registros individuales
      query = `
        SELECT 
          id,
          fecha_registro,
          presion_arterial
        FROM signos_vitales
        WHERE anciano_id = $1
          AND fecha_registro >= NOW() - INTERVAL '${dias} days'
          AND presion_arterial IS NOT NULL
        ORDER BY fecha_registro DESC
      `;
    } else if (tipoEstadistica === 'peso') {
      query = `
        SELECT 
          DATE(fecha_registro) as fecha,
          ROUND(AVG(peso)::numeric, 2) as promedio
        FROM signos_vitales
        WHERE anciano_id = $1
          AND fecha_registro >= NOW() - INTERVAL '${dias} days'
          AND peso IS NOT NULL
        GROUP BY DATE(fecha_registro)
        ORDER BY fecha DESC
      `;
    } else {
      // Por defecto devolver todos los tipos de signos agrupados por día
      query = `
        SELECT 
          DATE(fecha_registro) as fecha,
          ROUND(AVG(temperatura)::numeric, 1) as temperatura_promedio,
          ROUND(AVG(frecuencia_cardiaca)::numeric, 0) as frecuencia_cardiaca_promedio,
          ROUND(AVG(frecuencia_respiratoria)::numeric, 0) as frecuencia_respiratoria_promedio,
          ROUND(AVG(saturacion_oxigeno)::numeric, 0) as saturacion_oxigeno_promedio,
          ROUND(AVG(glucosa)::numeric, 0) as glucosa_promedio
        FROM signos_vitales
        WHERE anciano_id = $1
          AND fecha_registro >= NOW() - INTERVAL '${dias} days'
        GROUP BY DATE(fecha_registro)
        ORDER BY fecha DESC
      `;
    }
    
    const result = await db.query(query, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener estadísticas de signos vitales:', err);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: err.message });
  }
};