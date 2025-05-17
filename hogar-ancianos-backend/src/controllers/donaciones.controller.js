const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

// Servicios
const recibosDonacionService = require('../services/facturacion-sat.service');

// Configuración del asilo actualizada con datos SAT
const configuracionAsilo = {
  nit: '65050223',
  nombre: 'ASOCIACION FAMILIA VICENTINA DE LA CIUDAD DE QUETZALTENANGO',
  nombreComercial: 'FAVIQ',
  direccion: '14 AVENIDA 0-11 zona 1',
  municipio: 'QUETZALTENANGO',
  departamento: 'QUETZALTENANGO',
  pais: 'GT'
};

/**
 * Inicia sesión con el servicio de SAT para facturación electrónica
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
exports.iniciarSesionSAT = async (req, res) => {
  try {
    const { usuario, password, nit, certificadorNit } = req.body;
    
    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'El usuario y contraseña son obligatorios para iniciar sesión con SAT'
      });
    }
    
    const credenciales = {
      user: usuario,
      password: password,
      nit: nit || configuracionAsilo.nit,
      certificadorNit: certificadorNit || undefined
    };
    
    const resultado = await recibosDonacionService.iniciarSesion(credenciales);
    
    if (resultado.success) {
      return res.status(200).json(resultado);
    } else {
      return res.status(401).json(resultado);
    }
  } catch (error) {
    console.error('Error al iniciar sesión con SAT:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error interno al intentar iniciar sesión con SAT',
      error: error.message
    });
  }
};

/**
 * Verifica el estado de la sesión con el servicio SAT
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
exports.verificarSesionSAT = async (req, res) => {
  try {
    const estadoSesion = recibosDonacionService.verificarSesion();
    
    return res.status(200).json({
      success: true,
      estadoSesion
    });
  } catch (error) {
    console.error('Error al verificar sesión con SAT:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error interno al verificar estado de sesión con SAT',
      error: error.message
    });
  }
};

/**
 * Cierra la sesión actual con el servicio SAT
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
exports.cerrarSesionSAT = async (req, res) => {
  try {
    const resultado = recibosDonacionService.cerrarSesion();
    
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error al cerrar sesión con SAT:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error interno al cerrar sesión con SAT',
      error: error.message
    });
  }
};

/**
 * Obtiene todas las donaciones con paginación y filtrado
 */
exports.obtenerDonaciones = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      tipo, 
      estado, 
      fechaInicio,
      fechaFin,
      donante
    } = req.query;
    
    // Construir la consulta SQL base
    let sqlQuery = 'SELECT * FROM donaciones WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    // Aplicar filtros si se proporcionan
    if (tipo) {
      sqlQuery += ` AND tipo_donacion = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }
    
    if (estado) {
      sqlQuery += ` AND estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }
    
    if (donante) {
      sqlQuery += ` AND donante_nombre ILIKE $${paramIndex}`;
      params.push(`%${donante}%`);
      paramIndex++;
    }
    
    // Filtro de fechas
    if (fechaInicio) {
      sqlQuery += ` AND fecha_donacion >= $${paramIndex}`;
      params.push(fechaInicio);
      paramIndex++;
    }
    
    if (fechaFin) {
      sqlQuery += ` AND fecha_donacion <= $${paramIndex}`;
      params.push(fechaFin);
      paramIndex++;
    }
    
    // Contar el total de registros que coinciden con el filtro
    const countQuery = `SELECT COUNT(*) as total FROM (${sqlQuery}) AS filtered_donaciones`;
    const totalResult = await query(countQuery, params);
    const total = parseInt(totalResult.rows[0].total);
    
    // Agregar ordenamiento y paginación a la consulta original
    sqlQuery += ` ORDER BY fecha_donacion DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit));
    params.push((page - 1) * parseInt(limit));
    
    // Ejecutar la consulta paginada
    const result = await query(sqlQuery, params);
    
    res.status(200).json({
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      donaciones: result.rows
    });
  } catch (error) {
    console.error('Error al obtener donaciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener donaciones', error: error.message });
  }
};

/**
 * Obtiene una donación específica por su ID
 */
exports.obtenerDonacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('SELECT * FROM donaciones WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Donación no encontrada' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener donación:', error);
    res.status(500).json({ mensaje: 'Error al obtener detalles de la donación', error: error.message });
  }
};

/**
 * Crea una nueva donación
 */
exports.crearDonacion = async (req, res) => {
  try {
    // Extraer datos del cuerpo de la solicitud
    const {
      tipo_donacion,
      monto,
      valor_estimado,
      donante_nombre,
      donante_nit,
      donante_direccion,
      descripcion,
      metodo_pago,
      detalle_especie,
      detalle_servicio,
      notas,
      fecha_donacion,
      estado,
      generar_recibo
    } = req.body;
    
    // Preparar variables para la consulta SQL
    const campos = ['tipo_donacion', 'donante_nombre', 'fecha_donacion', 'estado'];
    const valores = [tipo_donacion, donante_nombre, fecha_donacion ? new Date(fecha_donacion) : new Date(), estado || 'Pendiente'];
    
    // Agregar campos opcionales si existen
    if (donante_nit) {
      campos.push('donante_nit');
      valores.push(donante_nit);
    }
    
    if (donante_direccion) {
      campos.push('donante_direccion');
      valores.push(donante_direccion);
    }
    
    if (descripcion) {
      campos.push('descripcion');
      valores.push(descripcion);
    }
    
    if (notas) {
      campos.push('notas');
      valores.push(notas);
    }
    
    // Agregar campos específicos según el tipo de donación
    if (tipo_donacion === 'monetaria') {
      campos.push('monto');
      valores.push(parseFloat(monto));
      
      campos.push('metodo_pago');
      valores.push(metodo_pago);
    } else {
      campos.push('valor_estimado');
      valores.push(parseFloat(valor_estimado));
      
      if (tipo_donacion === 'especie') {
        campos.push('detalle_especie');
        valores.push(detalle_especie);
      } else if (tipo_donacion === 'servicios') {
        campos.push('detalle_servicio');
        valores.push(detalle_servicio);
      }
    }
    
    // Si hay un archivo de comprobante adjunto, guardarlo
    let rutaComprobante = null;
    if (req.files && req.files.comprobante) {
      const comprobante = req.files.comprobante;
      const extensionArchivo = path.extname(comprobante.name).toLowerCase();
      const nombreArchivo = `${uuidv4()}${extensionArchivo}`;
      const rutaArchivo = path.join(__dirname, '../../uploads/comprobantes', nombreArchivo);
      
      // Crear directorio si no existe
      const directorioDestino = path.dirname(rutaArchivo);
      if (!fs.existsSync(directorioDestino)) {
        fs.mkdirSync(directorioDestino, { recursive: true });
      }
      
      // Mover el archivo subido al destino
      await comprobante.mv(rutaArchivo);
      
      // Guardar la ruta relativa del archivo
      rutaComprobante = `/uploads/comprobantes/${nombreArchivo}`;
      campos.push('comprobante');
      valores.push(rutaComprobante);
    }
    
    // Crear placeholders para la consulta SQL ($1, $2, ...)
    const placeholders = valores.map((_, index) => `$${index + 1}`).join(', ');
    
    // Construir la consulta SQL con RETURNING para obtener el registro insertado
    const sqlQuery = `
      INSERT INTO donaciones (${campos.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    // Ejecutar la consulta
    const result = await query(sqlQuery, valores);
    const nuevaDonacion = result.rows[0];
    
    // Si se solicita generar recibo de donación
    if (generar_recibo === 'true' || generar_recibo === true) {
      await generarReciboDonacion(nuevaDonacion, res);
    } else {
      // Responder con la donación creada
      res.status(201).json(nuevaDonacion);
    }
    
  } catch (error) {
    console.error('Error al crear donación:', error);
    res.status(500).json({ mensaje: 'Error al registrar la donación', error: error.message });
  }
};

/**
 * Actualiza una donación existente
 */
exports.actualizarDonacion = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = { ...req.body };
    
    // Buscar la donación existente
    const donacionResult = await query('SELECT * FROM donaciones WHERE id = $1', [id]);
    
    if (donacionResult.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Donación no encontrada' });
    }
    
    const donacionExistente = donacionResult.rows[0];
    
    // Preparar los campos a actualizar
    const actualizaciones = [];
    const valores = [];
    let paramIndex = 1;
    
    // Recorrer los datos que se desean actualizar
    for (const [campo, valor] of Object.entries(datosActualizados)) {
      // Ignorar el campo generar_recibo que es solo para control
      if (campo === 'generar_recibo') continue;
      
      // Procesar campos específicos
      if (campo === 'fecha_donacion' && valor) {
        actualizaciones.push(`${campo} = $${paramIndex}`);
        valores.push(new Date(valor));
        paramIndex++;
      } else if ((campo === 'monto' || campo === 'valor_estimado') && valor) {
        actualizaciones.push(`${campo} = $${paramIndex}`);
        valores.push(parseFloat(valor));
        paramIndex++;
      } else if (valor !== undefined) {
        actualizaciones.push(`${campo} = $${paramIndex}`);
        valores.push(valor);
        paramIndex++;
      }
    }
    
    // Si hay un archivo de comprobante nuevo, procesarlo
    if (req.files && req.files.comprobante) {
      const comprobante = req.files.comprobante;
      const extensionArchivo = path.extname(comprobante.name).toLowerCase();
      const nombreArchivo = `${uuidv4()}${extensionArchivo}`;
      const rutaArchivo = path.join(__dirname, '../../uploads/comprobantes', nombreArchivo);
      
      // Crear directorio si no existe
      const directorioDestino = path.dirname(rutaArchivo);
      if (!fs.existsSync(directorioDestino)) {
        fs.mkdirSync(directorioDestino, { recursive: true });
      }
      
      // Mover el archivo subido al destino
      await comprobante.mv(rutaArchivo);
      
      // Eliminar archivo anterior si existe
      if (donacionExistente.comprobante) {
        const rutaAnterior = path.join(__dirname, '../..', donacionExistente.comprobante);
        if (fs.existsSync(rutaAnterior)) {
          fs.unlinkSync(rutaAnterior);
        }
      }
      
      // Agregar la actualización del campo comprobante
      actualizaciones.push(`comprobante = $${paramIndex}`);
      valores.push(`/uploads/comprobantes/${nombreArchivo}`);
      paramIndex++;
    }
    
    // Agregar timestamp de actualización
    actualizaciones.push(`updated_at = $${paramIndex}`);
    valores.push(new Date());
    paramIndex++;
    
    // Añadir el ID a los parámetros
    valores.push(id);
    
    // Si no hay campos para actualizar, devolver la donación actual
    if (actualizaciones.length === 0) {
      return res.status(200).json(donacionExistente);
    }
    
    // Construir y ejecutar la consulta SQL
    const sqlQuery = `
      UPDATE donaciones
      SET ${actualizaciones.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await query(sqlQuery, valores);
    const donacionActualizada = result.rows[0];
    
    // Si se solicita generar recibo de donación
    if (datosActualizados.generar_recibo === 'true' || datosActualizados.generar_recibo === true) {
      await generarReciboDonacion(donacionActualizada, res);
    } else {
      // Responder con la donación actualizada
      res.status(200).json(donacionActualizada);
    }
    
  } catch (error) {
    console.error('Error al actualizar donación:', error);
    res.status(500).json({ mensaje: 'Error al actualizar la donación', error: error.message });
  }
};

/**
 * Elimina una donación
 */
exports.eliminarDonacion = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar la donación
    const donacionResult = await query('SELECT * FROM donaciones WHERE id = $1', [id]);
    
    if (donacionResult.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Donación no encontrada' });
    }
    
    const donacion = donacionResult.rows[0];
    
    // Si tiene recibo generado, no permitir eliminar
    if (donacion.recibo_generado) {
      return res.status(400).json({ 
        mensaje: 'No se puede eliminar una donación con recibo generado',
        detalle: 'Las donaciones con recibos de donación electrónicos no pueden ser eliminadas por normativas SAT'
      });
    }
    
    // Eliminar archivo de comprobante si existe
    if (donacion.comprobante) {
      const rutaArchivo = path.join(__dirname, '../..', donacion.comprobante);
      if (fs.existsSync(rutaArchivo)) {
        fs.unlinkSync(rutaArchivo);
      }
    }
    
    // Eliminar la donación
    await query('DELETE FROM donaciones WHERE id = $1', [id]);
    
    res.status(200).json({ mensaje: 'Donación eliminada correctamente' });
    
  } catch (error) {
    console.error('Error al eliminar donación:', error);
    res.status(500).json({ mensaje: 'Error al eliminar la donación', error: error.message });
  }
};

/**
 * Genera recibo de donación para una donación existente
 */
exports.generarReciboDonacion = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar la donación
    const donacionResult = await query('SELECT * FROM donaciones WHERE id = $1', [id]);
    
    if (donacionResult.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Donación no encontrada' });
    }
    
    const donacion = donacionResult.rows[0];
    
    // Si ya tiene recibo generado, devolver los datos
    if (donacion.recibo_generado) {
      return res.status(200).json({
        mensaje: 'La donación ya tiene un recibo generado',
        recibo: {
          serie: donacion.serie_recibo,
          numero: donacion.numero_recibo,
          uuid: donacion.uuid_recibo,
          url_pdf: donacion.url_recibo
        }
      });
    }
    
    await generarReciboDonacion(donacion, res);
    
  } catch (error) {
    console.error('Error al generar recibo de donación:', error);
    res.status(500).json({ mensaje: 'Error al generar recibo de donación', error: error.message });
  }
};

/**
 * Función auxiliar para generar recibo de donación
 */
async function generarReciboDonacion(donacion, res) {
  try {
    // Verificar datos requeridos para el recibo
    if (!donacion.donante_nit) {
      return res.status(400).json({ 
        mensaje: 'Datos incompletos para generar recibo de donación',
        detalle: 'Se requiere NIT del donante'
      });
    }
    
    if (!donacion.donante_direccion) {
      return res.status(400).json({
        mensaje: 'Datos incompletos para generar recibo de donación',
        detalle: 'Se requiere dirección del donante'
      });
    }
    
    // Preparar datos para el recibo
    const donacionData = {
      donante: {
        nit: donacion.donante_nit,
        nombre: donacion.donante_nombre,
        direccion: donacion.donante_direccion
      },
      monto: donacion.monto || 0,
      valorEstimado: donacion.valor_estimado || 0,
      descripcion: donacion.descripcion,
      tipo: donacion.tipo_donacion.charAt(0).toUpperCase() + donacion.tipo_donacion.slice(1)
    };
    
    // Llamar al servicio para generar el recibo
    const reciboService = new recibosDonacionService();
    const resultado = await reciboService.procesarReciboDonacion(donacionData);
    
    if (!resultado.success) {
      return res.status(400).json({
        mensaje: 'Error al generar el recibo de donación',
        detalle: resultado.mensaje,
        error: resultado.error
      });
    }
    
    // Actualizar la donación con los datos del recibo en PostgreSQL
    const updateQuery = `
      UPDATE donaciones
      SET recibo_generado = true,
          serie_recibo = $1,
          numero_recibo = $2,
          uuid_recibo = $3,
          url_recibo = $4,
          fecha_recibo = $5,
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;
    
    const updateResult = await query(updateQuery, [
      resultado.recibo.serie,
      resultado.recibo.numero,
      resultado.recibo.uuid,
      resultado.recibo.xml_url,
      new Date(),
      donacion.id
    ]);
    
    const donacionActualizada = updateResult.rows[0];
    
    res.status(200).json({
      mensaje: 'Recibo de donación generado correctamente',
      recibo: {
        serie: resultado.recibo.serie,
        numero: resultado.recibo.numero,
        uuid: resultado.recibo.uuid,
        url_pdf: resultado.recibo.xml_url
      },
      donacion: donacionActualizada
    });
  } catch (error) {
    console.error('Error en proceso de generación de recibo:', error);
    
    if (res) {
      res.status(500).json({ 
        mensaje: 'Error al generar recibo de donación', 
        error: error.message
      });
    }
    
    throw error;
  }
}