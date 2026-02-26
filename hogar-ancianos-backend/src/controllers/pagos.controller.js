const { pool } = require('../config/db');

/**
 * Obtener todos los pagos programados
 */
exports.getPagosProgramados = async (req, res) => {
  try {
    const { activo, frecuencia } = req.query;

    let query = `
      SELECT 
        pp.*,
        c.nombre as categoria_nombre,
        c.icono as categoria_icono,
        c.color as categoria_color,
        u.username as usuario_responsable
      FROM pagos_programados pp
      LEFT JOIN categorias_transacciones c ON pp.categoria_id = c.id
      LEFT JOIN usuarios u ON pp.usuario_responsable_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (activo !== undefined) {
      query += ` AND pp.activo = $${paramIndex}`;
      params.push(activo === 'true');
      paramIndex++;
    }

    if (frecuencia) {
      query += ` AND pp.frecuencia = $${paramIndex}`;
      params.push(frecuencia);
      paramIndex++;
    }

    query += ` ORDER BY pp.fecha_inicio DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener pagos programados:', err);
    res.status(500).json({ message: 'Error al obtener pagos programados', error: err.message });
  }
};

/**
 * Obtener un pago programado por ID
 */
exports.getPagoProgramadoById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        pp.*,
        c.nombre as categoria_nombre,
        u.username as usuario_responsable,
        COUNT(ip.id) as total_instancias,
        COUNT(CASE WHEN ip.estado = 'pagado' THEN 1 END) as pagados,
        COUNT(CASE WHEN ip.estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN ip.estado = 'atrasado' THEN 1 END) as atrasados
      FROM pagos_programados pp
      LEFT JOIN categorias_transacciones c ON pp.categoria_id = c.id
      LEFT JOIN usuarios u ON pp.usuario_responsable_id = u.id
      LEFT JOIN instancias_pagos ip ON pp.id = ip.pago_programado_id
      WHERE pp.id = $1
      GROUP BY pp.id, c.nombre, u.username
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pago programado no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener pago programado:', err);
    res.status(500).json({ message: 'Error al obtener pago programado', error: err.message });
  }
};

/**
 * Crear pago programado
 */
exports.createPagoProgramado = async (req, res) => {
  try {
    const {
      concepto,
      descripcion,
      monto,
      categoria_id,
      frecuencia,
      dia_pago,
      fecha_inicio,
      fecha_fin,
      proveedor,
      metodo_pago_preferido,
      dias_anticipacion_recordatorio,
      notas
    } = req.body;

    // Validaciones
    if (!concepto || !monto || !frecuencia || !fecha_inicio) {
      return res.status(400).json({ 
        message: 'Concepto, monto, frecuencia y fecha de inicio son obligatorios' 
      });
    }

    const frecuenciasValidas = ['diario', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual'];
    if (!frecuenciasValidas.includes(frecuencia)) {
      return res.status(400).json({ 
        message: 'Frecuencia no válida' 
      });
    }

    // Insertar pago programado
    const result = await pool.query(`
      INSERT INTO pagos_programados (
        concepto, descripcion, monto, categoria_id, frecuencia,
        dia_pago, fecha_inicio, fecha_fin, proveedor,
        metodo_pago_preferido, dias_anticipacion_recordatorio,
        usuario_responsable_id, notas
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      concepto, descripcion, monto, categoria_id, frecuencia,
      dia_pago, fecha_inicio, fecha_fin, proveedor,
      metodo_pago_preferido, dias_anticipacion_recordatorio || 3,
      req.user.id, notas
    ]);

    const pagoProgramado = result.rows[0];

    // Generar instancias de pago automáticamente
    await pool.query('SELECT generar_instancias_pagos()');

    res.status(201).json({
      message: 'Pago programado creado exitosamente',
      pago_programado: pagoProgramado
    });
  } catch (err) {
    console.error('Error al crear pago programado:', err);
    res.status(500).json({ message: 'Error al crear pago programado', error: err.message });
  }
};

/**
 * Actualizar pago programado
 */
exports.updatePagoProgramado = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      concepto,
      descripcion,
      monto,
      categoria_id,
      dia_pago,
      fecha_fin,
      proveedor,
      metodo_pago_preferido,
      dias_anticipacion_recordatorio,
      activo,
      notas
    } = req.body;

    const result = await pool.query(`
      UPDATE pagos_programados
      SET 
        concepto = COALESCE($1, concepto),
        descripcion = COALESCE($2, descripcion),
        monto = COALESCE($3, monto),
        categoria_id = COALESCE($4, categoria_id),
        dia_pago = COALESCE($5, dia_pago),
        fecha_fin = COALESCE($6, fecha_fin),
        proveedor = COALESCE($7, proveedor),
        metodo_pago_preferido = COALESCE($8, metodo_pago_preferido),
        dias_anticipacion_recordatorio = COALESCE($9, dias_anticipacion_recordatorio),
        activo = COALESCE($10, activo),
        notas = COALESCE($11, notas),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `, [
      concepto, descripcion, monto, categoria_id, dia_pago,
      fecha_fin, proveedor, metodo_pago_preferido,
      dias_anticipacion_recordatorio, activo, notas, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pago programado no encontrado' });
    }

    res.json({
      message: 'Pago programado actualizado exitosamente',
      pago_programado: result.rows[0]
    });
  } catch (err) {
    console.error('Error al actualizar pago programado:', err);
    res.status(500).json({ message: 'Error al actualizar pago programado', error: err.message });
  }
};

/**
 * Eliminar/Desactivar pago programado
 */
exports.deletePagoProgramado = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanente } = req.query;

    if (permanente === 'true') {
      // Eliminar permanentemente
      await pool.query('DELETE FROM pagos_programados WHERE id = $1', [id]);
    } else {
      // Solo desactivar
      await pool.query('UPDATE pagos_programados SET activo = false WHERE id = $1', [id]);
    }

    res.json({ message: 'Pago programado eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar pago programado:', err);
    res.status(500).json({ message: 'Error al eliminar pago programado', error: err.message });
  }
};

/**
 * Obtener instancias de pagos (calendario)
 */
exports.getInstanciasPagos = async (req, res) => {
  try {
    const { 
      fecha_inicio, 
      fecha_fin, 
      estado,
      pago_programado_id,
      page = 1,
      limit = 50
    } = req.query;

    let query = `
      SELECT 
        ip.*,
        pp.concepto,
        pp.descripcion,
        pp.proveedor,
        pp.frecuencia,
        pp.metodo_pago_preferido,
        c.nombre as categoria_nombre,
        c.icono as categoria_icono,
        c.color as categoria_color,
        CASE 
          WHEN ip.estado = 'atrasado' THEN CURRENT_DATE - ip.fecha_vencimiento
          ELSE ip.fecha_vencimiento - CURRENT_DATE
        END as dias_diferencia
      FROM instancias_pagos ip
      JOIN pagos_programados pp ON ip.pago_programado_id = pp.id
      LEFT JOIN categorias_transacciones c ON pp.categoria_id = c.id
      WHERE pp.activo = true
    `;

    const params = [];
    let paramIndex = 1;

    if (pago_programado_id) {
      query += ` AND ip.pago_programado_id = $${paramIndex}`;
      params.push(pago_programado_id);
      paramIndex++;
    }

    if (fecha_inicio) {
      query += ` AND ip.fecha_vencimiento >= $${paramIndex}`;
      params.push(fecha_inicio);
      paramIndex++;
    }

    if (fecha_fin) {
      query += ` AND ip.fecha_vencimiento <= $${paramIndex}`;
      params.push(fecha_fin);
      paramIndex++;
    }

    if (estado) {
      query += ` AND ip.estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].total);

    // Paginación y ordenamiento
    query += ` ORDER BY ip.fecha_vencimiento ASC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit));
    params.push((page - 1) * parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      instancias: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error al obtener instancias de pagos:', err);
    res.status(500).json({ message: 'Error al obtener instancias de pagos', error: err.message });
  }
};

/**
 * Marcar pago como pagado (crea transacción)
 */
exports.marcarComoPagado = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      fecha_pago,
      monto_pagado,
      metodo_pago,
      referencia,
      comprobante_url,
      notas
    } = req.body;

    // Obtener instancia de pago
    const instanciaResult = await client.query(`
      SELECT ip.*, pp.*
      FROM instancias_pagos ip
      JOIN pagos_programados pp ON ip.pago_programado_id = pp.id
      WHERE ip.id = $1
    `, [id]);

    if (instanciaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Instancia de pago no encontrada' });
    }

    const instancia = instanciaResult.rows[0];

    // Crear transacción financiera
    const transaccionResult = await client.query(`
      INSERT INTO transacciones_financieras (
        tipo, categoria_id, concepto, descripcion, monto,
        fecha_transaccion, metodo_pago, referencia, comprobante_url,
        proveedor, usuario_registro_id, notas, estado
      )
      VALUES ('egreso', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'completada')
      RETURNING *
    `, [
      instancia.categoria_id,
      instancia.concepto,
      instancia.descripcion,
      monto_pagado || instancia.monto,
      fecha_pago || new Date(),
      metodo_pago || instancia.metodo_pago_preferido,
      referencia,
      comprobante_url,
      instancia.proveedor,
      req.user.id,
      notas || `Pago programado: ${instancia.concepto}`
    ]);

    const transaccion = transaccionResult.rows[0];

    // Actualizar instancia de pago
    await client.query(`
      UPDATE instancias_pagos
      SET 
        estado = 'pagado',
        fecha_pago = $1,
        transaccion_id = $2,
        notas = COALESCE($3, notas),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [fecha_pago || new Date(), transaccion.id, notas, id]);

    await client.query('COMMIT');

    res.json({
      message: 'Pago registrado exitosamente',
      transaccion,
      instancia_id: id
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al marcar pago como pagado:', err);
    res.status(500).json({ message: 'Error al registrar pago', error: err.message });
  } finally {
    client.release();
  }
};

/**
 * Obtener pagos próximos y atrasados (para dashboard)
 */
exports.getPagosAtencion = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ip.*,
        pp.concepto,
        pp.proveedor,
        pp.frecuencia,
        c.nombre as categoria_nombre,
        c.icono as categoria_icono,
        c.color as categoria_color,
        CASE 
          WHEN ip.estado = 'atrasado' THEN CURRENT_DATE - ip.fecha_vencimiento
          ELSE ip.fecha_vencimiento - CURRENT_DATE
        END as dias_diferencia
      FROM instancias_pagos ip
      JOIN pagos_programados pp ON ip.pago_programado_id = pp.id
      LEFT JOIN categorias_transacciones c ON pp.categoria_id = c.id
      WHERE ip.estado IN ('atrasado', 'proximo', 'pendiente')
      AND pp.activo = true
      AND ip.fecha_vencimiento <= CURRENT_DATE + INTERVAL '15 days'
      ORDER BY 
        CASE ip.estado 
          WHEN 'atrasado' THEN 1
          WHEN 'proximo' THEN 2
          ELSE 3
        END,
        ip.fecha_vencimiento ASC
      LIMIT 20
    `);

    // Resumen
    const resumenResult = await pool.query(`
      SELECT 
        ip.estado,
        COUNT(*) as total,
        SUM(ip.monto) as monto_total
      FROM instancias_pagos ip
      JOIN pagos_programados pp ON ip.pago_programado_id = pp.id
      WHERE ip.estado IN ('atrasado', 'proximo', 'pendiente')
      AND pp.activo = true
      GROUP BY ip.estado
    `);

    res.json({
      pagos: result.rows,
      resumen: resumenResult.rows
    });
  } catch (err) {
    console.error('Error al obtener pagos de atención:', err);
    res.status(500).json({ message: 'Error al obtener pagos de atención', error: err.message });
  }
};

/**
 * Generar instancias de pagos manualmente
 */
exports.generarInstanciasPagos = async (req, res) => {
  try {
    await pool.query('SELECT generar_instancias_pagos()');

    res.json({ message: 'Instancias de pagos generadas exitosamente' });
  } catch (err) {
    console.error('Error al generar instancias de pagos:', err);
    res.status(500).json({ message: 'Error al generar instancias de pagos', error: err.message });
  }
};

/**
 * Actualizar estados de pagos (atrasados, próximos)
 */
exports.actualizarEstadosPagos = async (req, res) => {
  try {
    // Marcar como atrasados
    await pool.query(`
      UPDATE instancias_pagos
      SET estado = 'atrasado'
      WHERE fecha_vencimiento < CURRENT_DATE
      AND estado IN ('pendiente', 'proximo')
    `);

    // Marcar como próximos (dentro de los días de anticipación)
    await pool.query(`
      UPDATE instancias_pagos ip
      SET estado = 'proximo'
      FROM pagos_programados pp
      WHERE ip.pago_programado_id = pp.id
      AND ip.fecha_vencimiento >= CURRENT_DATE
      AND ip.fecha_vencimiento <= CURRENT_DATE + pp.dias_anticipacion_recordatorio
      AND ip.estado = 'pendiente'
    `);

    res.json({ message: 'Estados de pagos actualizados' });
  } catch (err) {
    console.error('Error al actualizar estados de pagos:', err);
    res.status(500).json({ message: 'Error al actualizar estados', error: err.message });
  }
};

/**
 * Cancelar instancia de pago específica
 */
exports.cancelarInstanciaPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const result = await pool.query(`
      UPDATE instancias_pagos
      SET 
        estado = 'cancelado',
        notas = COALESCE(notas || ' - ', '') || 'Cancelado: ' || $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [motivo || 'Sin motivo especificado', id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Instancia de pago no encontrada' });
    }

    res.json({
      message: 'Instancia de pago cancelada',
      instancia: result.rows[0]
    });
  } catch (err) {
    console.error('Error al cancelar instancia de pago:', err);
    res.status(500).json({ message: 'Error al cancelar instancia', error: err.message });
  }
};
