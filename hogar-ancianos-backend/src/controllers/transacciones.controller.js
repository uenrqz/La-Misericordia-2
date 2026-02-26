const { pool } = require('../config/db');

/**
 * Obtener todas las transacciones con filtros
 */
exports.getTransacciones = async (req, res) => {
  try {
    const { 
      tipo, 
      categoria_id, 
      fecha_inicio, 
      fecha_fin, 
      busqueda,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = `
      SELECT 
        t.*,
        c.nombre as categoria_nombre,
        c.icono as categoria_icono,
        c.color as categoria_color,
        u.username as usuario_registro
      FROM transacciones_financieras t
      LEFT JOIN categorias_transacciones c ON t.categoria_id = c.id
      LEFT JOIN usuarios u ON t.usuario_registro_id = u.id
      WHERE t.estado != 'cancelada'
    `;
    
    const params = [];
    let paramIndex = 1;

    if (tipo) {
      query += ` AND t.tipo = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }

    if (categoria_id) {
      query += ` AND t.categoria_id = $${paramIndex}`;
      params.push(categoria_id);
      paramIndex++;
    }

    if (fecha_inicio) {
      query += ` AND t.fecha_transaccion >= $${paramIndex}`;
      params.push(fecha_inicio);
      paramIndex++;
    }

    if (fecha_fin) {
      query += ` AND t.fecha_transaccion <= $${paramIndex}`;
      params.push(fecha_fin);
      paramIndex++;
    }

    if (busqueda) {
      query += ` AND (t.concepto ILIKE $${paramIndex} OR t.descripcion ILIKE $${paramIndex} OR t.proveedor ILIKE $${paramIndex})`;
      params.push(`%${busqueda}%`);
      paramIndex++;
    }

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].total);

    // Paginación
    query += ` ORDER BY t.fecha_transaccion DESC, t.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit));
    params.push((page - 1) * parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      transacciones: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error al obtener transacciones:', err);
    res.status(500).json({ message: 'Error al obtener transacciones', error: err.message });
  }
};

/**
 * Obtener una transacción por ID
 */
exports.getTransaccionById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        t.*,
        c.nombre as categoria_nombre,
        c.icono as categoria_icono,
        c.color as categoria_color,
        u.username as usuario_registro
      FROM transacciones_financieras t
      LEFT JOIN categorias_transacciones c ON t.categoria_id = c.id
      LEFT JOIN usuarios u ON t.usuario_registro_id = u.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener transacción:', err);
    res.status(500).json({ message: 'Error al obtener transacción', error: err.message });
  }
};

/**
 * Crear nueva transacción
 */
exports.createTransaccion = async (req, res) => {
  try {
    const {
      tipo,
      categoria_id,
      concepto,
      descripcion,
      monto,
      fecha_transaccion,
      metodo_pago,
      referencia,
      comprobante_url,
      proveedor,
      beneficiario,
      es_recurrente,
      frecuencia_dias,
      notas
    } = req.body;

    // Validaciones
    if (!tipo || !concepto || !monto) {
      return res.status(400).json({ message: 'Tipo, concepto y monto son obligatorios' });
    }

    if (!['ingreso', 'egreso'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo debe ser "ingreso" o "egreso"' });
    }

    // Insertar transacción
    const result = await pool.query(`
      INSERT INTO transacciones_financieras (
        tipo, categoria_id, concepto, descripcion, monto,
        fecha_transaccion, metodo_pago, referencia, comprobante_url,
        proveedor, beneficiario, usuario_registro_id,
        es_recurrente, frecuencia_dias, notas
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      tipo, categoria_id, concepto, descripcion, monto,
      fecha_transaccion || new Date(), metodo_pago, referencia, comprobante_url,
      proveedor, beneficiario, req.user.id,
      es_recurrente || false, frecuencia_dias, notas
    ]);

    const transaccion = result.rows[0];

    // Actualizar predicciones si es recurrente
    if (es_recurrente && frecuencia_dias) {
      await pool.query(`
        INSERT INTO predicciones_gastos (
          categoria_id, concepto_sugerido, monto_promedio,
          frecuencia_dias_promedio, ultima_transaccion_fecha,
          proxima_fecha_sugerida, confianza_prediccion,
          total_transacciones_analizadas, proveedor_frecuente
        )
        VALUES ($1, $2, $3, $4, $5, $6, 0.5, 1, $7)
        ON CONFLICT (categoria_id, concepto_sugerido) 
        DO UPDATE SET
          monto_promedio = (predicciones_gastos.monto_promedio + $3) / 2,
          ultima_transaccion_fecha = $5,
          proxima_fecha_sugerida = $6,
          total_transacciones_analizadas = predicciones_gastos.total_transacciones_analizadas + 1
      `, [
        categoria_id,
        concepto,
        monto,
        frecuencia_dias,
        fecha_transaccion || new Date(),
        new Date(Date.now() + frecuencia_dias * 24 * 60 * 60 * 1000),
        proveedor
      ]);
    }

    res.status(201).json({
      message: 'Transacción creada exitosamente',
      transaccion
    });
  } catch (err) {
    console.error('Error al crear transacción:', err);
    res.status(500).json({ message: 'Error al crear transacción', error: err.message });
  }
};

/**
 * Actualizar transacción
 */
exports.updateTransaccion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      concepto,
      descripcion,
      monto,
      fecha_transaccion,
      metodo_pago,
      referencia,
      comprobante_url,
      proveedor,
      beneficiario,
      notas
    } = req.body;

    const result = await pool.query(`
      UPDATE transacciones_financieras
      SET 
        concepto = COALESCE($1, concepto),
        descripcion = COALESCE($2, descripcion),
        monto = COALESCE($3, monto),
        fecha_transaccion = COALESCE($4, fecha_transaccion),
        metodo_pago = COALESCE($5, metodo_pago),
        referencia = COALESCE($6, referencia),
        comprobante_url = COALESCE($7, comprobante_url),
        proveedor = COALESCE($8, proveedor),
        beneficiario = COALESCE($9, beneficiario),
        notas = COALESCE($10, notas),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [
      concepto, descripcion, monto, fecha_transaccion,
      metodo_pago, referencia, comprobante_url,
      proveedor, beneficiario, notas, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    res.json({
      message: 'Transacción actualizada exitosamente',
      transaccion: result.rows[0]
    });
  } catch (err) {
    console.error('Error al actualizar transacción:', err);
    res.status(500).json({ message: 'Error al actualizar transacción', error: err.message });
  }
};

/**
 * Eliminar transacción (marcar como cancelada)
 */
exports.deleteTransaccion = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE transacciones_financieras
      SET estado = 'cancelada', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    res.json({ message: 'Transacción eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar transacción:', err);
    res.status(500).json({ message: 'Error al eliminar transacción', error: err.message });
  }
};

/**
 * Obtener resumen financiero
 */
exports.getResumenFinanciero = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    const fechaInicioQuery = fecha_inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fechaFinQuery = fecha_fin || new Date();

    // Resumen general
    const resumenResult = await pool.query(`
      SELECT 
        tipo,
        COUNT(*) as total_transacciones,
        SUM(monto) as monto_total,
        AVG(monto) as monto_promedio
      FROM transacciones_financieras
      WHERE fecha_transaccion BETWEEN $1 AND $2
      AND estado = 'completada'
      GROUP BY tipo
    `, [fechaInicioQuery, fechaFinQuery]);

    // Resumen por categoría
    const categoriasResult = await pool.query(`
      SELECT 
        c.nombre,
        c.icono,
        c.color,
        t.tipo,
        COUNT(*) as total_transacciones,
        SUM(t.monto) as monto_total
      FROM transacciones_financieras t
      JOIN categorias_transacciones c ON t.categoria_id = c.id
      WHERE t.fecha_transaccion BETWEEN $1 AND $2
      AND t.estado = 'completada'
      GROUP BY c.id, c.nombre, c.icono, c.color, t.tipo
      ORDER BY monto_total DESC
    `, [fechaInicioQuery, fechaFinQuery]);

    // Calcular balance
    const ingresos = resumenResult.rows.find(r => r.tipo === 'ingreso')?.monto_total || 0;
    const egresos = resumenResult.rows.find(r => r.tipo === 'egreso')?.monto_total || 0;
    const balance = parseFloat(ingresos) - parseFloat(egresos);

    res.json({
      periodo: {
        fecha_inicio: fechaInicioQuery,
        fecha_fin: fechaFinQuery
      },
      resumen: {
        ingresos: parseFloat(ingresos),
        egresos: parseFloat(egresos),
        balance,
        total_transacciones: resumenResult.rows.reduce((acc, r) => acc + parseInt(r.total_transacciones), 0)
      },
      por_categoria: categoriasResult.rows,
      por_tipo: resumenResult.rows
    });
  } catch (err) {
    console.error('Error al obtener resumen financiero:', err);
    res.status(500).json({ message: 'Error al obtener resumen financiero', error: err.message });
  }
};

/**
 * Obtener predicciones y sugerencias
 */
exports.getPredicciones = async (req, res) => {
  try {
    // Actualizar predicciones primero
    await pool.query('SELECT calcular_predicciones_gastos()');

    // Obtener predicciones activas ordenadas por proximidad
    const result = await pool.query(`
      SELECT 
        p.*,
        c.nombre as categoria_nombre,
        c.icono as categoria_icono,
        c.color as categoria_color,
        p.proxima_fecha_sugerida - CURRENT_DATE as dias_hasta_sugerencia
      FROM predicciones_gastos p
      JOIN categorias_transacciones c ON p.categoria_id = c.id
      WHERE p.activo = true
      AND p.proxima_fecha_sugerida >= CURRENT_DATE - INTERVAL '7 days'
      AND p.proxima_fecha_sugerida <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY p.proxima_fecha_sugerida ASC
    `);

    res.json({
      predicciones: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error al obtener predicciones:', err);
    res.status(500).json({ message: 'Error al obtener predicciones', error: err.message });
  }
};

/**
 * Obtener categorías de transacciones
 */
exports.getCategorias = async (req, res) => {
  try {
    const { tipo } = req.query;

    let query = 'SELECT * FROM categorias_transacciones WHERE activo = true';
    const params = [];

    if (tipo) {
      query += ' AND tipo = $1';
      params.push(tipo);
    }

    query += ' ORDER BY nombre ASC';

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ message: 'Error al obtener categorías', error: err.message });
  }
};

/**
 * Obtener estadísticas del día
 */
exports.getEstadisticasHoy = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        tipo,
        COUNT(*) as total,
        SUM(monto) as monto_total
      FROM transacciones_financieras
      WHERE fecha_transaccion = CURRENT_DATE
      AND estado = 'completada'
      GROUP BY tipo
    `);

    const ingresos = result.rows.find(r => r.tipo === 'ingreso')?.monto_total || 0;
    const egresos = result.rows.find(r => r.tipo === 'egreso')?.monto_total || 0;

    res.json({
      fecha: new Date(),
      ingresos: parseFloat(ingresos),
      egresos: parseFloat(egresos),
      balance: parseFloat(ingresos) - parseFloat(egresos),
      transacciones: result.rows
    });
  } catch (err) {
    console.error('Error al obtener estadísticas del día:', err);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: err.message });
  }
};

/**
 * Exportar transacciones (simula un export CSV/Excel)
 */
exports.exportarTransacciones = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, tipo } = req.query;

    let query = `
      SELECT 
        t.fecha_transaccion,
        t.tipo,
        c.nombre as categoria,
        t.concepto,
        t.descripcion,
        t.monto,
        t.metodo_pago,
        t.referencia,
        t.proveedor,
        t.beneficiario,
        u.username as registrado_por
      FROM transacciones_financieras t
      LEFT JOIN categorias_transacciones c ON t.categoria_id = c.id
      LEFT JOIN usuarios u ON t.usuario_registro_id = u.id
      WHERE t.estado = 'completada'
    `;

    const params = [];
    let paramIndex = 1;

    if (fecha_inicio) {
      query += ` AND t.fecha_transaccion >= $${paramIndex}`;
      params.push(fecha_inicio);
      paramIndex++;
    }

    if (fecha_fin) {
      query += ` AND t.fecha_transaccion <= $${paramIndex}`;
      params.push(fecha_fin);
      paramIndex++;
    }

    if (tipo) {
      query += ` AND t.tipo = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }

    query += ` ORDER BY t.fecha_transaccion DESC`;

    const result = await pool.query(query, params);

    res.json({
      total: result.rows.length,
      transacciones: result.rows,
      formato: 'json' // En el frontend se puede convertir a CSV/Excel
    });
  } catch (err) {
    console.error('Error al exportar transacciones:', err);
    res.status(500).json({ message: 'Error al exportar transacciones', error: err.message });
  }
};
