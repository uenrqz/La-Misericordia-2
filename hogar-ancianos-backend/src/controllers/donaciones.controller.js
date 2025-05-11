const db = require('../config/db');

/**
 * Obtener todas las donaciones con opciones de filtrado
 */
exports.getDonaciones = async (req, res) => {
  try {
    const { 
      fechaInicio, 
      fechaFin, 
      tipoDonacion, 
      reciboGenerado,
      donante,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT d.*, u.nombre as usuario_registro_nombre
      FROM donaciones d
      JOIN usuarios u ON d.usuario_registro_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Aplicar filtros
    if (fechaInicio && fechaFin) {
      query += ` AND d.fecha_donacion BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      query += ` AND d.fecha_donacion >= $${paramIndex++}`;
      params.push(fechaInicio);
    } else if (fechaFin) {
      query += ` AND d.fecha_donacion <= $${paramIndex++}`;
      params.push(fechaFin);
    }
    
    if (tipoDonacion) {
      query += ` AND d.tipo_donacion = $${paramIndex++}`;
      params.push(tipoDonacion);
    }
    
    if (reciboGenerado !== undefined) {
      query += ` AND d.recibo_generado = $${paramIndex++}`;
      params.push(reciboGenerado === 'true' || reciboGenerado === true);
    }
    
    if (donante) {
      query += ` AND d.donante_nombre ILIKE $${paramIndex++}`;
      params.push(`%${donante}%`);
    }
    
    // Ordenar por fecha más reciente primero
    query += ` ORDER BY d.fecha_donacion DESC, d.id DESC`;
    
    // Aplicar paginación
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Contar total de registros para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM donaciones d
      WHERE 1=1
    `;
    
    // Aplicar los mismos filtros al conteo
    let countParams = [];
    let countParamIndex = 1;
    let countQueryWithFilters = countQuery;
    
    if (fechaInicio && fechaFin) {
      countQueryWithFilters += ` AND d.fecha_donacion BETWEEN $${countParamIndex++} AND $${countParamIndex++}`;
      countParams.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      countQueryWithFilters += ` AND d.fecha_donacion >= $${countParamIndex++}`;
      countParams.push(fechaInicio);
    } else if (fechaFin) {
      countQueryWithFilters += ` AND d.fecha_donacion <= $${countParamIndex++}`;
      countParams.push(fechaFin);
    }
    
    if (tipoDonacion) {
      countQueryWithFilters += ` AND d.tipo_donacion = $${countParamIndex++}`;
      countParams.push(tipoDonacion);
    }
    
    if (reciboGenerado !== undefined) {
      countQueryWithFilters += ` AND d.recibo_generado = $${countParamIndex++}`;
      countParams.push(reciboGenerado === 'true' || reciboGenerado === true);
    }
    
    if (donante) {
      countQueryWithFilters += ` AND d.donante_nombre ILIKE $${countParamIndex++}`;
      countParams.push(`%${donante}%`);
    }
    
    const countResult = await db.query(countQueryWithFilters, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Calcular totales por tipo de donación (solo monetarias)
    const totalMonetariasQuery = `
      SELECT SUM(monto) as total
      FROM donaciones
      WHERE tipo_donacion = 'monetaria'
    `;
    
    const totalMonetariasResult = await db.query(totalMonetariasQuery);
    const totalMonetarias = parseFloat(totalMonetariasResult.rows[0].total || 0);
    
    // Calcular totales por tipo de donación (monetarias) con los mismos filtros
    let totalMonetariasFiltradoQuery = `
      SELECT SUM(monto) as total
      FROM donaciones
      WHERE tipo_donacion = 'monetaria'
    `;
    
    let totalMonetariasFiltradoParams = [];
    let totalMonetariasFiltradoParamIndex = 1;
    
    if (fechaInicio && fechaFin) {
      totalMonetariasFiltradoQuery += ` AND fecha_donacion BETWEEN $${totalMonetariasFiltradoParamIndex++} AND $${totalMonetariasFiltradoParamIndex++}`;
      totalMonetariasFiltradoParams.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      totalMonetariasFiltradoQuery += ` AND fecha_donacion >= $${totalMonetariasFiltradoParamIndex++}`;
      totalMonetariasFiltradoParams.push(fechaInicio);
    } else if (fechaFin) {
      totalMonetariasFiltradoQuery += ` AND fecha_donacion <= $${totalMonetariasFiltradoParamIndex++}`;
      totalMonetariasFiltradoParams.push(fechaFin);
    }
    
    if (donante) {
      totalMonetariasFiltradoQuery += ` AND donante_nombre ILIKE $${totalMonetariasFiltradoParamIndex++}`;
      totalMonetariasFiltradoParams.push(`%${donante}%`);
    }
    
    if (reciboGenerado !== undefined) {
      totalMonetariasFiltradoQuery += ` AND recibo_generado = $${totalMonetariasFiltradoParamIndex++}`;
      totalMonetariasFiltradoParams.push(reciboGenerado === 'true' || reciboGenerado === true);
    }
    
    const totalMonetariasFiltradoResult = await db.query(totalMonetariasFiltradoQuery, totalMonetariasFiltradoParams);
    const totalMonetariasFiltrado = parseFloat(totalMonetariasFiltradoResult.rows[0].total || 0);
    
    const response = {
      donaciones: result.rows,
      metadata: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        totalMonetarias,
        totalMonetariasFiltrado
      }
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error al obtener donaciones:', err);
    res.status(500).json({ message: 'Error al obtener donaciones', error: err.message });
  }
};

/**
 * Obtener una donación específica por ID
 */
exports.getDonacionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT d.*, u.nombre as usuario_registro_nombre
      FROM donaciones d
      JOIN usuarios u ON d.usuario_registro_id = u.id
      WHERE d.id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Donación con ID ${id} no encontrada` });
    }
    
    // Si es una donación en especie, buscar artículos asociados
    if (result.rows[0].tipo_donacion === 'especie') {
      const articulosQuery = `
        SELECT *
        FROM articulos_tienda
        WHERE donacion_id = $1
      `;
      
      const articulosResult = await db.query(articulosQuery, [id]);
      result.rows[0].articulos = articulosResult.rows;
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener donación:', err);
    res.status(500).json({ message: 'Error al obtener donación', error: err.message });
  }
};

/**
 * Registrar nueva donación
 */
exports.createDonacion = async (req, res) => {
  try {
    const { 
      fecha_donacion = new Date(),
      tipo_donacion,
      monto,
      descripcion,
      donante_nombre,
      donante_nit,
      donante_direccion,
      articulos // Para donaciones en especie
    } = req.body;
    
    // Validar datos según tipo de donación
    if (!tipo_donacion || !['monetaria', 'especie', 'servicios'].includes(tipo_donacion)) {
      return res.status(400).json({ 
        message: 'Tipo de donación no válido. Debe ser: monetaria, especie o servicios', 
      });
    }
    
    if (tipo_donacion === 'monetaria' && !monto) {
      return res.status(400).json({ 
        message: 'Para donaciones monetarias, el monto es obligatorio'
      });
    }
    
    if (tipo_donacion === 'especie' && (!articulos || articulos.length === 0)) {
      return res.status(400).json({ 
        message: 'Para donaciones en especie, debe especificar al menos un artículo'
      });
    }
    
    // Usar transacción para garantizar integridad
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Insertar donación
      const donacionQuery = `
        INSERT INTO donaciones (
          fecha_donacion,
          tipo_donacion,
          monto,
          descripcion,
          donante_nombre,
          donante_nit,
          donante_direccion,
          recibo_generado,
          usuario_registro_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const donacionValues = [
        fecha_donacion,
        tipo_donacion,
        tipo_donacion === 'monetaria' ? monto : null,
        descripcion || null,
        donante_nombre || null,
        donante_nit || null,
        donante_direccion || null,
        false, // recibo_generado
        req.user.id
      ];
      
      const donacionResult = await client.query(donacionQuery, donacionValues);
      const donacionId = donacionResult.rows[0].id;
      
      // Si es donación en especie, insertar artículos
      if (tipo_donacion === 'especie' && articulos && articulos.length > 0) {
        for (const articulo of articulos) {
          const articuloQuery = `
            INSERT INTO articulos_tienda (
              nombre,
              descripcion,
              precio,
              estado,
              fecha_ingreso,
              donacion_id,
              foto_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `;
          
          const articuloValues = [
            articulo.nombre,
            articulo.descripcion || null,
            articulo.precio || 0,
            articulo.estado || 'disponible',
            new Date(),
            donacionId,
            articulo.foto_url || null
          ];
          
          await client.query(articuloQuery, articuloValues);
        }
      }
      
      // Obtener datos del usuario que registró la donación
      const usuarioQuery = `SELECT nombre FROM usuarios WHERE id = $1`;
      const usuarioResult = await client.query(usuarioQuery, [req.user.id]);
      
      // Preparar respuesta completa
      const donacionCompleta = {
        ...donacionResult.rows[0],
        usuario_registro_nombre: usuarioResult.rows[0].nombre,
        articulos: articulos || []
      };
      
      await client.query('COMMIT');
      
      res.status(201).json(donacionCompleta);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al crear donación:', err);
    res.status(500).json({ message: 'Error al crear donación', error: err.message });
  }
};

/**
 * Actualizar donación
 * Solo se permite actualizar si no tiene recibo generado
 */
exports.updateDonacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      fecha_donacion,
      descripcion,
      donante_nombre,
      donante_nit,
      donante_direccion,
      recibo_generado,
      numero_recibo
    } = req.body;
    
    // Verificar si la donación existe
    const checkDonacion = await db.query('SELECT * FROM donaciones WHERE id = $1', [id]);
    
    if (checkDonacion.rows.length === 0) {
      return res.status(404).json({ message: `Donación con ID ${id} no encontrada` });
    }
    
    const donacionActual = checkDonacion.rows[0];
    
    // Solo administrativos y contadores pueden actualizar donaciones
    if (
      req.user.rol !== 'admin' && 
      req.user.rol !== 'administrativo' && 
      req.user.rol !== 'contador'
    ) {
      return res.status(403).json({ 
        message: 'No tiene permisos para actualizar donaciones'
      });
    }
    
    // Si ya tiene recibo generado, solo el contador puede actualizar el número de recibo
    if (
      donacionActual.recibo_generado && 
      req.user.rol !== 'contador' && 
      req.user.rol !== 'admin'
    ) {
      return res.status(403).json({ 
        message: 'La donación ya tiene recibo generado. Solo contadores pueden actualizar'
      });
    }
    
    // Preparar campos a actualizar
    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;
    
    if (fecha_donacion) {
      fieldsToUpdate.push(`fecha_donacion = $${paramIndex++}`);
      values.push(fecha_donacion);
    }
    
    if (descripcion !== undefined) {
      fieldsToUpdate.push(`descripcion = $${paramIndex++}`);
      values.push(descripcion);
    }
    
    if (donante_nombre !== undefined) {
      fieldsToUpdate.push(`donante_nombre = $${paramIndex++}`);
      values.push(donante_nombre);
    }
    
    if (donante_nit !== undefined) {
      fieldsToUpdate.push(`donante_nit = $${paramIndex++}`);
      values.push(donante_nit);
    }
    
    if (donante_direccion !== undefined) {
      fieldsToUpdate.push(`donante_direccion = $${paramIndex++}`);
      values.push(donante_direccion);
    }
    
    // Solo contador puede cambiar estado de recibo_generado y número de recibo
    if (req.user.rol === 'contador' || req.user.rol === 'admin') {
      if (recibo_generado !== undefined) {
        fieldsToUpdate.push(`recibo_generado = $${paramIndex++}`);
        values.push(recibo_generado);
      }
      
      if (numero_recibo !== undefined) {
        fieldsToUpdate.push(`numero_recibo = $${paramIndex++}`);
        values.push(numero_recibo);
      }
    }
    
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }
    
    // Añadir ID al final de los valores
    values.push(id);
    
    const query = `
      UPDATE donaciones 
      SET ${fieldsToUpdate.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    
    // Obtener datos del usuario que registró la donación
    const usuarioQuery = `SELECT nombre FROM usuarios WHERE id = $1`;
    const usuarioResult = await db.query(usuarioQuery, [result.rows[0].usuario_registro_id]);
    
    // Preparar respuesta completa
    const donacionActualizada = {
      ...result.rows[0],
      usuario_registro_nombre: usuarioResult.rows[0].nombre
    };
    
    res.json(donacionActualizada);
  } catch (err) {
    console.error('Error al actualizar donación:', err);
    res.status(500).json({ message: 'Error al actualizar donación', error: err.message });
  }
};

/**
 * Generar informe de donaciones para SAT
 * Solo para contadores y admin
 */
exports.generarInformeSAT = async (req, res) => {
  try {
    // Verificar permisos
    if (req.user.rol !== 'contador' && req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'Solo contadores pueden generar informes para SAT'
      });
    }
    
    const { fechaInicio, fechaFin } = req.query;
    
    // Validar fechas
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        message: 'Debe proporcionar fechas de inicio y fin para el informe'
      });
    }
    
    // Obtener donaciones sin recibo generado
    const query = `
      SELECT *
      FROM donaciones
      WHERE fecha_donacion BETWEEN $1 AND $2
        AND tipo_donacion = 'monetaria'
        AND recibo_generado = false
      ORDER BY fecha_donacion ASC
    `;
    
    const result = await db.query(query, [fechaInicio, fechaFin]);
    
    // Calcular totales
    let totalMonto = 0;
    result.rows.forEach(donacion => {
      totalMonto += parseFloat(donacion.monto || 0);
    });
    
    // Generar informe
    const informe = {
      periodo: {
        fechaInicio,
        fechaFin
      },
      donaciones: result.rows,
      totales: {
        cantidadDonaciones: result.rows.length,
        montoTotal: totalMonto
      },
      generadoPor: req.user.id,
      fechaGeneracion: new Date()
    };
    
    res.json(informe);
  } catch (err) {
    console.error('Error al generar informe SAT:', err);
    res.status(500).json({ message: 'Error al generar informe SAT', error: err.message });
  }
};

/**
 * Marcar múltiples donaciones como con recibo generado
 * Solo para contadores y admin
 */
exports.marcarRecibosGenerados = async (req, res) => {
  try {
    // Verificar permisos
    if (req.user.rol !== 'contador' && req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'Solo contadores pueden marcar recibos como generados'
      });
    }
    
    const { donacionIds, numeroReciboBase } = req.body;
    
    // Validar datos
    if (!donacionIds || !Array.isArray(donacionIds) || donacionIds.length === 0) {
      return res.status(400).json({ 
        message: 'Debe proporcionar un array de IDs de donaciones'
      });
    }
    
    if (!numeroReciboBase) {
      return res.status(400).json({ 
        message: 'Debe proporcionar un número de recibo base'
      });
    }
    
    // Usar transacción para actualizar todas las donaciones
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      let donacionesActualizadas = [];
      
      // Actualizar cada donación
      for (let i = 0; i < donacionIds.length; i++) {
        const id = donacionIds[i];
        const numeroRecibo = `${numeroReciboBase}-${i + 1}`;
        
        const updateQuery = `
          UPDATE donaciones
          SET recibo_generado = true,
              numero_recibo = $1
          WHERE id = $2
          RETURNING *
        `;
        
        const result = await client.query(updateQuery, [numeroRecibo, id]);
        
        if (result.rows.length > 0) {
          donacionesActualizadas.push(result.rows[0]);
        }
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        message: `${donacionesActualizadas.length} donaciones marcadas con recibo generado`,
        donaciones: donacionesActualizadas
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al marcar recibos como generados:', err);
    res.status(500).json({ message: 'Error al marcar recibos', error: err.message });
  }
};