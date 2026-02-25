const { pool } = require('../config/db');
const path = require('path');
const fs = require('fs');

/**
 * Obtener todos los residentes con posibilidad de filtrar por edad
 */
exports.getResidentes = async (req, res) => {
  try {
    const { minEdad, maxEdad, nombre } = req.query;
    
    // Construir consulta base
    let query = `
      SELECT id, nombre, apellido, fecha_nacimiento, 
      EXTRACT(YEAR FROM AGE(fecha_nacimiento)) as edad,
      direccion_anterior, fecha_ingreso, estado_salud, medicamentos, alergias, 
      contacto_emergencia, telefono_emergencia
      FROM ancianos
    `;
    
    // Aplicar filtros si existen
    const params = [];
    const whereConditions = [];
    
    if (minEdad && maxEdad) {
      whereConditions.push('EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN $1 AND $2');
      params.push(minEdad, maxEdad);
    } else if (minEdad) {
      whereConditions.push('EXTRACT(YEAR FROM AGE(fecha_nacimiento)) >= $1');
      params.push(minEdad);
    } else if (maxEdad) {
      whereConditions.push('EXTRACT(YEAR FROM AGE(fecha_nacimiento)) <= $1');
      params.push(maxEdad);
    }
    
    if (nombre) {
      whereConditions.push(`nombre ILIKE $${params.length + 1}`);
      params.push(`%${nombre}%`);
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    // Ordenar por nombre
    query += ' ORDER BY nombre ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener residentes:', err);
    res.status(500).json({ message: 'Error al obtener residentes', error: err.message });
  }
};

/**
 * Obtener un residente por su ID
 */
exports.getResidenteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT id, nombre, apellido, fecha_nacimiento, 
      EXTRACT(YEAR FROM AGE(fecha_nacimiento)) as edad,
      direccion_anterior, fecha_ingreso, estado_salud, medicamentos, alergias, 
      contacto_emergencia, telefono_emergencia
      FROM ancianos WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Residente con ID ${id} no encontrado` });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener residente por ID:', err);
    res.status(500).json({ message: 'Error al obtener residente', error: err.message });
  }
};

/**
 * Crear un nuevo residente
 */
exports.createResidente = async (req, res) => {
  try {
    const { 
      nombre, apellido, fecha_nacimiento, direccion_anterior, 
      fecha_ingreso, estado_salud, medicamentos, alergias,
      contacto_emergencia, telefono_emergencia 
    } = req.body;
    
    // Validar datos
    if (!nombre || !apellido || !fecha_nacimiento || !estado_salud) {
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios', 
        requiredFields: ['nombre', 'apellido', 'fecha_nacimiento', 'estado_salud'] 
      });
    }
    
    // Validar que la fecha de nacimiento sea de al menos 60 años atrás
    const fechaNacimiento = new Date(fecha_nacimiento);
    const hoy = new Date();
    const edadMinima = new Date(hoy);
    edadMinima.setFullYear(hoy.getFullYear() - 60);
    
    if (fechaNacimiento > edadMinima) {
      return res.status(400).json({ 
        message: 'La fecha de nacimiento debe ser de al menos 60 años atrás'
      });
    }

    const query = `
      INSERT INTO ancianos (
        nombre, apellido, fecha_nacimiento, direccion_anterior, 
        fecha_ingreso, estado_salud, medicamentos, alergias,
        contacto_emergencia, telefono_emergencia
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
    `;
    
    const values = [
      nombre, 
      apellido, 
      fecha_nacimiento, 
      direccion_anterior || null, 
      fecha_ingreso || new Date(), 
      estado_salud, 
      medicamentos || null, 
      alergias || null,
      contacto_emergencia || null, 
      telefono_emergencia || null
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear residente:', err);
    res.status(500).json({ message: 'Error al crear residente', error: err.message });
  }
};

/**
 * Actualizar un residente existente
 */
exports.updateResidente = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, apellido, fecha_nacimiento, direccion_anterior, 
      fecha_ingreso, estado_salud, medicamentos, alergias,
      contacto_emergencia, telefono_emergencia
    } = req.body;
    
    // Verificar si el residente existe
    const checkResult = await pool.query('SELECT * FROM ancianos WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: `Residente con ID ${id} no encontrado` });
    }
    
    // Preparar campos a actualizar
    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;
    
    if (nombre) {
      fieldsToUpdate.push(`nombre = $${paramIndex++}`);
      values.push(nombre);
    }
    
    if (apellido) {
      fieldsToUpdate.push(`apellido = $${paramIndex++}`);
      values.push(apellido);
    }
    
    if (fecha_nacimiento) {
      fieldsToUpdate.push(`fecha_nacimiento = $${paramIndex++}`);
      values.push(fecha_nacimiento);
    }
    
    if (direccion_anterior !== undefined) {
      fieldsToUpdate.push(`direccion_anterior = $${paramIndex++}`);
      values.push(direccion_anterior);
    }
    
    if (fecha_ingreso) {
      fieldsToUpdate.push(`fecha_ingreso = $${paramIndex++}`);
      values.push(fecha_ingreso);
    }
    
    if (estado_salud) {
      fieldsToUpdate.push(`estado_salud = $${paramIndex++}`);
      values.push(estado_salud);
    }
    
    if (medicamentos !== undefined) {
      fieldsToUpdate.push(`medicamentos = $${paramIndex++}`);
      values.push(medicamentos);
    }
    
    if (alergias !== undefined) {
      fieldsToUpdate.push(`alergias = $${paramIndex++}`);
      values.push(alergias);
    }
    
    if (contacto_emergencia !== undefined) {
      fieldsToUpdate.push(`contacto_emergencia = $${paramIndex++}`);
      values.push(contacto_emergencia);
    }
    
    if (telefono_emergencia !== undefined) {
      fieldsToUpdate.push(`telefono_emergencia = $${paramIndex++}`);
      values.push(telefono_emergencia);
    }
    
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }
    
    // Añadir ID al final de los valores
    values.push(id);
    
    const query = `
      UPDATE ancianos 
      SET ${fieldsToUpdate.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar residente:', err);
    res.status(500).json({ message: 'Error al actualizar residente', error: err.message });
  }
};

/**
 * Eliminar un residente
 */
exports.deleteResidente = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el residente existe
    const checkResult = await pool.query('SELECT * FROM ancianos WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: `Residente con ID ${id} no encontrado` });
    }
    
    await pool.query('DELETE FROM ancianos WHERE id = $1', [id]);
    res.json({ message: `Residente con ID ${id} eliminado correctamente` });
  } catch (err) {
    console.error('Error al eliminar residente:', err);
    res.status(500).json({ message: 'Error al eliminar residente', error: err.message });
  }
};

/**
 * Subir una foto para un residente
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el residente existe
    const checkResult = await pool.query('SELECT * FROM ancianos WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      // Si hay un archivo cargado pero el residente no existe, eliminar el archivo
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error al eliminar archivo temporal:', err);
        });
      }
      return res.status(404).json({ message: `Residente con ID ${id} no encontrado` });
    }
    
    // Verificar si se ha subido un archivo
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
    }
    
    // Verificar y eliminar la foto anterior si existe
    const residente = checkResult.rows[0];
    if (residente.foto_url) {
      const oldPhotoPath = path.join(__dirname, '../../uploads', path.basename(residente.foto_url));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlink(oldPhotoPath, (err) => {
          if (err) console.error('Error al eliminar foto anterior:', err);
        });
      }
    }
    
    // Generar la URL para la foto (podría ser relativa al servidor)
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    // Actualizar la URL de la foto en la base de datos
    const result = await pool.query(
      'UPDATE ancianos SET foto_url = $1 WHERE id = $2 RETURNING *',
      [photoUrl, id]
    );
    
    res.json({
      message: 'Foto actualizada correctamente',
      residente: result.rows[0]
    });
  } catch (err) {
    console.error('Error al subir foto de residente:', err);
    res.status(500).json({ message: 'Error al subir foto', error: err.message });
  }
};

/**
 * Eliminar la foto de un residente
 */
exports.deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el residente existe
    const checkResult = await pool.query('SELECT * FROM ancianos WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: `Residente con ID ${id} no encontrado` });
    }
    
    const residente = checkResult.rows[0];
    
    // Verificar si el residente tiene una foto asignada
    if (!residente.foto_url) {
      return res.status(404).json({ message: 'El residente no tiene una foto asignada' });
    }
    
    // Eliminar el archivo físico
    const photoPath = path.join(__dirname, '../../uploads', path.basename(residente.foto_url));
    if (fs.existsSync(photoPath)) {
      fs.unlink(photoPath, (err) => {
        if (err) console.error('Error al eliminar foto:', err);
      });
    }
    
    // Actualizar la URL de la foto en la base de datos a NULL
    const result = await pool.query(
      'UPDATE ancianos SET foto_url = NULL WHERE id = $1 RETURNING *',
      [id]
    );
    
    res.json({
      message: 'Foto eliminada correctamente',
      residente: result.rows[0]
    });
  } catch (err) {
    console.error('Error al eliminar foto de residente:', err);
    res.status(500).json({ message: 'Error al eliminar foto', error: err.message });
  }
};

/**
 * Obtener estadísticas de residentes
 */
exports.getStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado_salud = 'Estable' THEN 1 END) as activos,
        COUNT(CASE WHEN estado_salud != 'Estable' THEN 1 END) as inactivos
      FROM ancianos
    `);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener estadísticas de residentes:', err);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: err.message });
  }
};

/**
 * Obtener datos de ocupación
 */
exports.getOcupacion = async (req, res) => {
  try {
    const totalCapacidad = 50; // Capacidad total del hogar
    
    const result = await pool.query(`
      SELECT COUNT(*) as ocupados
      FROM ancianos
      WHERE estado_salud = 'Estable'
    `);
    
    const ocupados = parseInt(result.rows[0].ocupados);
    const disponibles = totalCapacidad - ocupados;
    
    res.json({
      total: totalCapacidad,
      ocupados,
      disponibles
    });
  } catch (err) {
    console.error('Error al obtener datos de ocupación:', err);
    res.status(500).json({ message: 'Error al obtener ocupación', error: err.message });
  }
};

/**
 * Obtener signos vitales recientes
 */
exports.getSignosVitalesRecientes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sv.*, a.nombre, a.apellido
      FROM signos_vitales sv
      JOIN ancianos a ON sv.anciano_id = a.id
      WHERE sv.fecha >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY sv.fecha DESC
      LIMIT 20
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener signos vitales recientes:', err);
    res.status(500).json({ message: 'Error al obtener signos vitales', error: err.message });
  }
};