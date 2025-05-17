/**
 * Controlador para funcionalidades de IA Médica
 */

const aiMedicoService = require('../services/ai-medico.service');
const db = require('../config/db');
const logger = require('../config/sout');

/**
 * Analiza tendencias en los signos vitales de un residente
 * @param {Request} req - Solicitud HTTP
 * @param {Response} res - Respuesta HTTP
 */
async function analizarTendenciasVitales(req, res) {
  try {
    const { id_residente } = req.params;
    
    if (!id_residente) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Se requiere el ID del residente'
      });
    }

    // Obtener historial de signos vitales del residente
    const query = `
      SELECT * FROM signos_vitales 
      WHERE id_residente = ? 
      ORDER BY fecha_registro DESC 
      LIMIT 30
    `;

    const [signosVitales] = await db.execute(query, [id_residente]);
    
    if (!signosVitales || signosVitales.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontraron registros de signos vitales para el residente'
      });
    }

    // Analizar tendencias usando el servicio de IA
    const analisis = await aiMedicoService.analizarTendenciasSignosVitales(signosVitales);

    return res.status(200).json({
      ok: true,
      analisis
    });
  } catch (error) {
    logger.error(`Error al analizar tendencias vitales: ${error.message}`);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al procesar el análisis de tendencias',
      error: error.message
    });
  }
}

/**
 * Sugiere protocolos médicos basados en síntomas
 * @param {Request} req - Solicitud HTTP
 * @param {Response} res - Respuesta HTTP
 */
async function sugerirProtocolos(req, res) {
  try {
    const { id_residente } = req.params;
    const { sintomas } = req.body;
    
    if (!id_residente) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Se requiere el ID del residente'
      });
    }

    if (!sintomas || !Array.isArray(sintomas) || sintomas.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Se requiere una lista de síntomas'
      });
    }

    // Obtener información del residente
    const query = `
      SELECT r.*, hm.estado_salud, hm.alergias, hm.medicamentos_actuales as medicamentos
      FROM residentes r
      LEFT JOIN historial_medico hm ON r.id_residente = hm.id_residente
      WHERE r.id_residente = ?
    `;

    const [residentes] = await db.execute(query, [id_residente]);
    
    if (!residentes || residentes.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontró el residente especificado'
      });
    }

    // Generar sugerencias de protocolos médicos
    const sugerencias = await aiMedicoService.sugerirProtocolosMedicos(sintomas, residentes[0]);

    return res.status(200).json({
      ok: true,
      sugerencias
    });
  } catch (error) {
    logger.error(`Error al sugerir protocolos médicos: ${error.message}`);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al procesar la sugerencia de protocolos médicos',
      error: error.message
    });
  }
}

/**
 * Analiza el riesgo de complicaciones de un residente
 * @param {Request} req - Solicitud HTTP
 * @param {Response} res - Respuesta HTTP
 */
async function analizarRiesgo(req, res) {
  try {
    const { id_residente } = req.params;
    
    if (!id_residente) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Se requiere el ID del residente'
      });
    }

    // Obtener información del residente y su historial médico
    const queryResidente = `
      SELECT r.*, hm.* 
      FROM residentes r
      LEFT JOIN historial_medico hm ON r.id_residente = hm.id_residente
      WHERE r.id_residente = ?
    `;

    const [residentes] = await db.execute(queryResidente, [id_residente]);
    
    if (!residentes || residentes.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontró el residente especificado'
      });
    }
    
    // Obtener evoluciones recientes del residente
    const queryEvoluciones = `
      SELECT * FROM evoluciones
      WHERE id_residente = ?
      ORDER BY fecha DESC
      LIMIT 20
    `;
    
    const [historialMedico] = await db.execute(queryEvoluciones, [id_residente]);

    // Analizar riesgo de complicaciones
    const analisis = await aiMedicoService.analizarRiesgoComplicaciones(
      residentes[0], 
      historialMedico || []
    );

    return res.status(200).json({
      ok: true,
      analisis
    });
  } catch (error) {
    logger.error(`Error al analizar riesgo de complicaciones: ${error.message}`);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al procesar el análisis de riesgo',
      error: error.message
    });
  }
}

/**
 * Analiza patrones en evoluciones médicas
 * @param {Request} req - Solicitud HTTP
 * @param {Response} res - Respuesta HTTP
 */
async function analizarEvoluciones(req, res) {
  try {
    const { id_residente } = req.params;
    
    if (!id_residente) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Se requiere el ID del residente'
      });
    }

    // Obtener evoluciones del residente
    const query = `
      SELECT * FROM evoluciones
      WHERE id_residente = ?
      ORDER BY fecha DESC
      LIMIT 50
    `;

    const [evoluciones] = await db.execute(query, [id_residente]);
    
    if (!evoluciones || evoluciones.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontraron evoluciones para el residente'
      });
    }

    // Analizar patrones en evoluciones
    const analisis = await aiMedicoService.analizarPatronesEnEvoluciones(evoluciones);

    return res.status(200).json({
      ok: true,
      analisis
    });
  } catch (error) {
    logger.error(`Error al analizar patrones en evoluciones: ${error.message}`);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al procesar el análisis de evoluciones',
      error: error.message
    });
  }
}

module.exports = {
  analizarTendenciasVitales,
  sugerirProtocolos,
  analizarRiesgo,
  analizarEvoluciones
};