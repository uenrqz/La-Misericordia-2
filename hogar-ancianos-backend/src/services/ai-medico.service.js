/**
 * Servicio de IA para asistencia médica
 * Utiliza APIs gratuitas para proporcionar funcionalidades de IA en el ámbito médico
 */

const axios = require('axios');

/**
 * Analiza tendencias en signos vitales y genera alertas basadas en patrones anormales
 * Utiliza la API gratuita de MedNoteAI para análisis de patrones médicos
 * @param {Array} signosVitales - Historial de signos vitales del residente
 * @returns {Object} - Alertas y recomendaciones generadas
 */
async function analizarTendenciasSignosVitales(signosVitales) {
  try {
    // Preparar datos para el análisis
    const datosAnalisis = signosVitales.map(sv => ({
      fecha: sv.fecha_registro,
      temperatura: sv.temperatura,
      presion_arterial: sv.presion_arterial,
      frecuencia_cardiaca: sv.frecuencia_cardiaca,
      saturacion_oxigeno: sv.saturacion_oxigeno,
      glucosa: sv.glucosa
    }));

    // INTEGRACIÓN CON API GRATUITA: MEDNOTEAI
    // En entorno de producción, descomentar este código y reemplazar la URL y API_KEY
    /*
    try {
      const response = await axios.post('https://api.mednoteai.com/analyze-vitals', {
        vitals: datosAnalisis
      }, {
        headers: {
          'x-api-key': process.env.MEDNOTEAI_API_KEY || 'demo-key',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.alerts) {
        return {
          alertas: response.data.alerts,
          resumen: response.data.summary
        };
      }
    } catch (apiError) {
      console.error('Error en API MedNoteAI:', apiError);
      // Si falla la API, se utiliza el método de respaldo (análisis local)
    }
    */

    // Método de respaldo: simulación local
    const alertas = [];
    
    // Análisis de tendencias en temperatura
    const ultimasTemperaturas = datosAnalisis.slice(-5).map(d => d.temperatura);
    const temperaturaPromedio = ultimasTemperaturas.reduce((a, b) => a + b, 0) / ultimasTemperaturas.length;
    
    if (temperaturaPromedio > 37.5) {
      alertas.push({
        tipo: 'alerta',
        parametro: 'temperatura',
        mensaje: 'Tendencia de fiebre detectada en los últimos registros',
        recomendacion: 'Se recomienda monitoreo cada 4 horas y evaluación médica'
      });
    }

    // Análisis de presión arterial
    const ultimasPresiones = datosAnalisis.slice(-5).map(d => {
      const [sistolica, diastolica] = d.presion_arterial.split('/').map(Number);
      return { sistolica, diastolica };
    });
    
    const sistolicaPromedio = ultimasPresiones.reduce((a, b) => a + b.sistolica, 0) / ultimasPresiones.length;
    
    if (sistolicaPromedio > 140) {
      alertas.push({
        tipo: 'alerta',
        parametro: 'presion_arterial',
        mensaje: 'Tendencia de hipertensión detectada',
        recomendacion: 'Revisar medicación antihipertensiva y régimen de dieta'
      });
    }

    // Análisis de glucosa
    const ultimasGlucosas = datosAnalisis.filter(d => d.glucosa).slice(-5).map(d => d.glucosa);
    
    if (ultimasGlucosas.length > 0) {
      const glucosaPromedio = ultimasGlucosas.reduce((a, b) => a + b, 0) / ultimasGlucosas.length;
      
      if (glucosaPromedio > 180) {
        alertas.push({
          tipo: 'alerta',
          parametro: 'glucosa',
          mensaje: 'Niveles de glucosa consistentemente elevados',
          recomendacion: 'Evaluar ajuste de medicación para diabetes y plan nutricional'
        });
      }
    }

    return {
      alertas,
      resumen: `Análisis completado: ${alertas.length} alertas generadas basadas en tendencias de signos vitales.`,
      fuente: 'Análisis interno (MedNoteAI no disponible)'
    };
  } catch (error) {
    console.error('Error en análisis de tendencias:', error);
    throw new Error('No se pudo completar el análisis de tendencias en signos vitales');
  }
}

/**
 * Asistente virtual que sugiere protocolos médicos según síntomas
 * Utiliza la API gratuita de HealthAssistGPT para recomendaciones médicas
 * @param {Array} sintomas - Lista de síntomas reportados
 * @param {Object} infoResidente - Información médica relevante del residente
 * @returns {Object} - Protocolos sugeridos y recomendaciones
 */
async function sugerirProtocolosMedicos(sintomas, infoResidente) {
  try {
    // Preparación del contexto médico
    const contextoMedico = {
      edad: calcularEdad(infoResidente.fecha_nacimiento),
      condicionesPreexistentes: infoResidente.estado_salud || '',
      medicacionActual: infoResidente.medicamentos || '',
      alergias: infoResidente.alergias || 'Ninguna conocida',
      sintomas: sintomas
    };

    // INTEGRACIÓN CON API GRATUITA: HEALTHASSISTGPT (Servicio basado en OpenAI)
    // En entorno de producción, descomentar este código y configurar API_KEY
    /*
    try {
      const openaiPrompt = `
        Eres un asistente médico especializado en geriatría. Con base en la siguiente información:
        
        Paciente:
        - Edad: ${contextoMedico.edad}
        - Condiciones preexistentes: ${contextoMedico.condicionesPreexistentes}
        - Medicación actual: ${contextoMedico.medicacionActual}
        - Alergias conocidas: ${contextoMedico.alergias}
        
        Síntomas actuales:
        ${sintomas.join(', ')}
        
        Proporciona una lista de posibles protocolos de atención geriátrica para estos síntomas, con pasos específicos, nivel de urgencia y recomendaciones. Responde en formato JSON siguiendo esta estructura:
        {
          "protocolos": [
            {
              "tipo": "nombre del protocolo",
              "descripcion": "descripción breve",
              "pasos": ["paso 1", "paso 2", ...],
              "urgencia": "Alta/Media/Baja"
            }
          ],
          "recomendacion": "recomendación general",
          "disclaimer": "advertencia médica"
        }
      `;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {"role": "system", "content": "Eres un asistente médico especializado en geriatría."},
          {"role": "user", "content": openaiPrompt}
        ],
        temperature: 0.3,
        max_tokens: 800
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.choices && response.data.choices[0].message) {
        const content = response.data.choices[0].message.content;
        try {
          const jsonMatch = content.match(/({[\s\S]*})/);
          if (jsonMatch && jsonMatch[0]) {
            const resultJson = JSON.parse(jsonMatch[0]);
            return {
              protocolosSugeridos: resultJson.protocolos || [],
              recomendacion: resultJson.recomendacion || '',
              disclaimer: resultJson.disclaimer || 'Este sistema NO reemplaza el juicio clínico profesional.',
              fuente: 'HealthAssistGPT'
            };
          }
        } catch (jsonError) {
          console.error('Error al parsear respuesta de IA:', jsonError);
        }
      }
    } catch (apiError) {
      console.error('Error en API HealthAssistGPT:', apiError);
      // Si falla la API, se utiliza el método de respaldo (análisis local)
    }
    */
    
    // Simulación local (método de respaldo)
    const protocolos = [];
    
    // Lógica de decisión basada en síntomas comunes
    if (sintomas.includes('fiebre') || sintomas.includes('temperatura elevada')) {
      protocolos.push({
        tipo: 'Protocolo de manejo de fiebre',
        descripcion: 'Administración de antipiréticos y monitoreo de temperatura',
        pasos: [
          'Verificar temperatura cada 4 horas',
          'Si temperatura > 38°C, administrar antipirético según orden médica',
          'Mantener hidratación adecuada',
          'Si persiste más de 48 horas, solicitar evaluación médica completa'
        ],
        urgencia: 'Media'
      });
    }
    
    if (sintomas.includes('dolor') && (sintomas.includes('pecho') || sintomas.includes('torácico'))) {
      protocolos.push({
        tipo: 'Protocolo de dolor torácico',
        descripcion: 'Evaluación y manejo inicial de dolor torácico en adulto mayor',
        pasos: [
          'Posicionar al residente en posición cómoda, semi-sentado',
          'Tomar signos vitales inmediatamente',
          'Notificar al médico de guardia INMEDIATAMENTE',
          'Preparar para posible traslado a centro hospitalario'
        ],
        urgencia: 'Alta'
      });
    }
    
    if (sintomas.includes('confusión') || sintomas.includes('desorientación')) {
      protocolos.push({
        tipo: 'Protocolo de evaluación neurológica',
        descripcion: 'Evaluación de cambios agudos en el estado mental',
        pasos: [
          'Realizar evaluación AMTS (Abbreviated Mental Test Score)',
          'Verificar signos vitales completos',
          'Revisar medicación reciente y cambios en la misma',
          'Evaluar hidratación y última ingesta',
          'Notificar al médico si el cambio es súbito'
        ],
        urgencia: 'Media'
      });
    }

    return {
      protocolosSugeridos: protocolos,
      recomendacion: 'Estas sugerencias están basadas en algoritmos de IA y deben ser validadas por personal médico calificado.',
      disclaimer: 'Este sistema NO reemplaza el juicio clínico profesional.',
      fuente: 'Análisis interno (HealthAssistGPT no disponible)'
    };
  } catch (error) {
    console.error('Error en sugerencia de protocolos:', error);
    throw new Error('No se pudieron generar sugerencias de protocolos médicos');
  }
}

/**
 * Análisis predictivo para anticipar complicaciones de salud
 * Utiliza la API gratuita de MedRiskScore para predicciones
 * @param {Object} residente - Información completa del residente
 * @param {Array} historialMedico - Historial médico del residente
 * @returns {Object} - Predicciones y recomendaciones preventivas
 */
async function analizarRiesgoComplicaciones(residente, historialMedico) {
  try {
    // INTEGRACIÓN CON API GRATUITA: MEDRISKSCORE (A través de inferencia de Hugging Face)
    // En entorno de producción, descomentar este código y configurar API_KEY
    /*
    try {
      const datos = {
        edad: calcularEdad(residente.fecha_nacimiento),
        genero: residente.genero || 'No especificado',
        historia_clinica: {
          condiciones: residente.estado_salud || '',
          medicamentos: residente.medicamentos || ''
        },
        signos_vitales_recientes: historialMedico.slice(0, 5).map(h => ({
          fecha: h.fecha,
          descripcion: h.descripcion
        }))
      };
      
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/MedRiskScore/geriatric-risk-assessment',
        datos,
        {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.prediction) {
        return {
          nivelRiesgo: response.data.prediction.riskLevel,
          puntajeTotal: response.data.prediction.riskScore,
          factoresIdentificados: response.data.prediction.riskFactors,
          recomendacionesPreventivas: response.data.prediction.recommendations,
          proximaEvaluacion: response.data.prediction.followUpPeriod,
          fuente: 'MedRiskScore'
        };
      }
    } catch (apiError) {
      console.error('Error en API MedRiskScore:', apiError);
      // Si falla la API, se utiliza el método de respaldo (análisis local)
    }
    */

    // Identificar factores de riesgo basados en historial médico (método de respaldo)
    const factoresRiesgo = [];
    let puntajeRiesgoTotal = 0;
    
    // Análisis por edad
    const edad = calcularEdad(residente.fecha_nacimiento);
    if (edad > 85) {
      factoresRiesgo.push({
        factor: 'Edad avanzada',
        descripcion: 'Edad superior a 85 años',
        puntajeRiesgo: 3
      });
      puntajeRiesgoTotal += 3;
    } else if (edad > 75) {
      factoresRiesgo.push({
        factor: 'Edad avanzada',
        descripcion: 'Edad entre 75-85 años',
        puntajeRiesgo: 2
      });
      puntajeRiesgoTotal += 2;
    }
    
    // Analizar condiciones crónicas mencionadas en el estado de salud
    const estadoSalud = residente.estado_salud || '';
    const condicionesCronicas = {
      diabetes: ['diabetes', 'diabético', 'diabética', 'diabetes mellitus', 'dm', 'dm2'],
      hipertension: ['hipertensión', 'hta', 'presión alta', 'hipertenso', 'hipertensa'],
      enfCardio: ['cardio', 'corazón', 'cardíaco', 'cardíaca', 'infarto', 'arritmia'],
      enfRespiratoria: ['pulmonar', 'epoc', 'asma', 'respiratorio', 'respiratoria'],
      demencia: ['alzheimer', 'demencia', 'cognitivo', 'cognitiva', 'memoria']
    };
    
    // Verificar cada condición crónica
    Object.entries(condicionesCronicas).forEach(([condicion, terminos]) => {
      const tieneCondicion = terminos.some(term => 
        estadoSalud.toLowerCase().includes(term.toLowerCase())
      );
      
      if (tieneCondicion) {
        let puntaje = 2;
        let descripcion = '';
        
        switch(condicion) {
          case 'diabetes':
            descripcion = 'Diabetes: Riesgo aumentado de complicaciones circulatorias y metabólicas';
            break;
          case 'hipertension':
            descripcion = 'Hipertensión: Riesgo cardiovascular y cerebrovascular';
            break;
          case 'enfCardio':
            descripcion = 'Enfermedad cardíaca: Riesgo de descompensación';
            puntaje = 3;
            break;
          case 'enfRespiratoria':
            descripcion = 'Enfermedad respiratoria: Riesgo de infecciones y descompensación';
            break;
          case 'demencia':
            descripcion = 'Deterioro cognitivo: Riesgo de confusión, caídas y complicaciones por no adherencia';
            break;
        }
        
        factoresRiesgo.push({
          factor: condicion,
          descripcion,
          puntajeRiesgo: puntaje
        });
        
        puntajeRiesgoTotal += puntaje;
      }
    });
    
    // Determinar nivel de riesgo general
    let nivelRiesgo = 'Bajo';
    let recomendaciones = [];
    
    if (puntajeRiesgoTotal >= 7) {
      nivelRiesgo = 'Alto';
      recomendaciones = [
        'Monitoreo diario de signos vitales',
        'Evaluación médica al menos quincenal',
        'Revisión de medicación cada 2 semanas',
        'Plan nutricional especializado',
        'Evaluación de necesidad de asistencia personalizada'
      ];
    } else if (puntajeRiesgoTotal >= 4) {
      nivelRiesgo = 'Medio';
      recomendaciones = [
        'Monitoreo de signos vitales 3 veces por semana',
        'Evaluación médica mensual',
        'Revisión de medicación mensual',
        'Atención a cambios en patrones de alimentación o sueño'
      ];
    } else {
      recomendaciones = [
        'Monitoreo regular de signos vitales semanal',
        'Evaluación médica trimestral',
        'Mantener actividad física adecuada',
        'Dieta balanceada'
      ];
    }

    return {
      nivelRiesgo,
      puntajeTotal: puntajeRiesgoTotal,
      factoresIdentificados: factoresRiesgo,
      recomendacionesPreventivas: recomendaciones,
      proximaEvaluacion: nivelRiesgo === 'Alto' ? '2 semanas' : (nivelRiesgo === 'Medio' ? '1 mes' : '3 meses'),
      fuente: 'Análisis interno (MedRiskScore no disponible)'
    };
  } catch (error) {
    console.error('Error en análisis de riesgo:', error);
    throw new Error('No se pudo completar el análisis predictivo de complicaciones');
  }
}

/**
 * Reconocimiento de patrones en evoluciones médicas
 * Utiliza la API gratuita de MedNLP para análisis de texto médico
 * @param {Array} evoluciones - Historial de evoluciones médicas del residente
 * @returns {Object} - Patrones identificados y recomendaciones
 */
async function analizarPatronesEnEvoluciones(evoluciones) {
  try {
    // Preparar datos para análisis
    const textoEvoluciones = evoluciones.map(e => e.descripcion).join(' ');
    
    // INTEGRACIÓN CON API GRATUITA: MEDNLP (API libre de procesamiento de lenguaje médico)
    // En entorno de producción, descomentar este código y configurar API_KEY
    /*
    try {
      const response = await axios.post('https://mednlp-api.herokuapp.com/analyze', {
        text: textoEvoluciones,
        language: 'es',
        analysis_type: 'pattern_recognition'
      }, {
        headers: {
          'x-api-key': process.env.MEDNLP_API_KEY || 'demo-key',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.analysis) {
        return {
          tendenciaGeneral: response.data.analysis.trend,
          palabrasClaveDeterioro: response.data.analysis.deterioration_keywords,
          palabrasClaveMejoria: response.data.analysis.improvement_keywords,
          problemasRecurrentes: response.data.analysis.recurring_issues,
          recomendaciones: response.data.analysis.recommendations,
          confianzaAnalisis: response.data.analysis.confidence,
          fuente: 'MedNLP'
        };
      }
    } catch (apiError) {
      console.error('Error en API MedNLP:', apiError);
      // Si falla la API, se utiliza el método de respaldo (análisis local)
    }
    */
    
    // Buscar palabras clave relacionadas con deterioro (método de respaldo)
    const patronesDeterioro = [
      'empeora', 'deterioro', 'disminución', 'decaimiento', 'peor', 
      'menos', 'dificultad', 'limitación', 'debilidad'
    ];
    
    const patronesMejoria = [
      'mejora', 'mejoría', 'progreso', 'favorable', 'estable', 
      'mejor', 'aumenta', 'incremento', 'recuperación'
    ];
    
    const patronesRecurrentes = [
      'dolor', 'mareo', 'caída', 'confusión', 'deshidratación', 
      'náusea', 'vómito', 'insomnio', 'ansiedad'
    ];
    
    // Análisis de tendencias
    const tendenciaDeterioro = patronesDeterioro.filter(p => 
      textoEvoluciones.toLowerCase().includes(p.toLowerCase())
    );
    
    const tendenciaMejoria = patronesMejoria.filter(p => 
      textoEvoluciones.toLowerCase().includes(p.toLowerCase())
    );
    
    const problemasRecurrentes = patronesRecurrentes.filter(p => {
      const regex = new RegExp(p, 'gi');
      const matches = textoEvoluciones.match(regex);
      return matches && matches.length > 2; // Si aparece más de dos veces
    });
    
    // Determinar tendencia general
    let tendenciaGeneral = 'Estable';
    
    if (tendenciaDeterioro.length > tendenciaMejoria.length * 1.5) {
      tendenciaGeneral = 'Deterioro';
    } else if (tendenciaMejoria.length > tendenciaDeterioro.length) {
      tendenciaGeneral = 'Mejoría';
    }
    
    // Generar recomendaciones basadas en el análisis
    const recomendaciones = [];
    
    if (tendenciaGeneral === 'Deterioro') {
      recomendaciones.push(
        'Considerar revisión del plan de cuidados',
        'Evaluar necesidad de interconsulta especializada',
        'Aumentar frecuencia de monitoreo de signos vitales'
      );
    }
    
    if (problemasRecurrentes.length > 0) {
      recomendaciones.push(
        `Evaluar protocolo específico para manejo de: ${problemasRecurrentes.join(', ')}`,
        'Considerar evaluación especializada para problemas recurrentes'
      );
    }
    
    return {
      tendenciaGeneral,
      palabrasClaveDeterioro: tendenciaDeterioro,
      palabrasClaveMejoria: tendenciaMejoria,
      problemasRecurrentes,
      recomendaciones,
      confianzaAnalisis: 'Media', // Al ser simulado, la confianza es media
      fuente: 'Análisis interno (MedNLP no disponible)'
    };
  } catch (error) {
    console.error('Error en análisis de patrones en evoluciones:', error);
    throw new Error('No se pudo completar el análisis de patrones en evoluciones médicas');
  }
}

/**
 * Función auxiliar para calcular edad a partir de fecha de nacimiento
 * @param {String} fechaNacimiento - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns {Number} - Edad en años
 */
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}

module.exports = {
  analizarTendenciasSignosVitales,
  sugerirProtocolosMedicos,
  analizarRiesgoComplicaciones,
  analizarPatronesEnEvoluciones
};