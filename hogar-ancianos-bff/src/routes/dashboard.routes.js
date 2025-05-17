const express = require('express');
const router = express.Router();
const apiClient = require('../config/api.config');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * Función para realizar solicitudes HTTP con reintentos
 * @param {Function} requestFn - Función que realiza la solicitud
 * @param {number} maxRetries - Número máximo de reintentos
 * @param {number} retryDelay - Retraso entre reintentos en ms
 * @returns {Promise<any>} - Resultado de la solicitud
 */
async function withRetry(requestFn, maxRetries = 2, retryDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`Reintentando solicitud (${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw lastError;
}

/**
 * @route GET /api/bff/dashboard
 * @desc Obtener datos del dashboard optimizados para el frontend
 * @access Privado (Administrador, Médico)
 */
router.get('/', authenticate(['admin', 'medico', 'enfermera', 'secretaria']), async (req, res) => {
  try {
    // Utilizamos Promise.allSettled para evitar que un error en una llamada afecte a las demás
    const results = await Promise.allSettled([
      withRetry(() => apiClient.get('/api/residentes/stats', {
        headers: { Authorization: `Bearer ${req.user.originalToken}` }
      })),
      
      withRetry(() => apiClient.get('/api/donaciones?limit=5', {
        headers: { Authorization: `Bearer ${req.user.originalToken}` }
      })),
      
      withRetry(() => apiClient.get('/api/finanzas/resumen', {
        headers: { Authorization: `Bearer ${req.user.originalToken}` }
      })),
      
      withRetry(() => apiClient.get('/api/residentes/ocupacion', {
        headers: { Authorization: `Bearer ${req.user.originalToken}` }
      }))
    ]);
    
    // Procesar los resultados
    const [residentesResult, donacionesResult, finanzasResult, ocupacionResult] = results;
    
    const residentes = residentesResult.status === 'fulfilled' ? residentesResult.value : { 
      data: { total: 0, activos: 0, inactivos: 0 } 
    };
    
    const donaciones = donacionesResult.status === 'fulfilled' ? donacionesResult.value : { 
      data: [] 
    };
    
    const finanzas = finanzasResult.status === 'fulfilled' ? finanzasResult.value : { 
      data: { totalIngresos: 0, totalEgresos: 0, netBalance: 0 } 
    };
    
    const ocupacion = ocupacionResult.status === 'fulfilled' ? ocupacionResult.value : { 
      data: { total: 50, ocupados: 0, disponibles: 50 } 
    };

    // Obtener datos adicionales basados en el rol
    let signosVitales = { data: [] };
    
    if (req.user.role === 'medico' || req.user.role === 'enfermera' || req.user.role === 'admin') {
      try {
        signosVitales = await withRetry(() => apiClient.get('/api/residentes/signos-vitales/recientes', {
          headers: { Authorization: `Bearer ${req.user.originalToken}` }
        }));
      } catch (error) {
        console.error('Error al obtener signos vitales:', error.message);
        // Continuar con un arreglo vacío
      }
    }

    // Obtener datos para gráficas con manejo de errores
    let graficasData;
    try {
      graficasData = await withRetry(() => apiClient.get('/api/finanzas/graficas/mensuales', {
        headers: { Authorization: `Bearer ${req.user.originalToken}` }
      }));
    } catch (error) {
      console.error('Error al obtener datos para gráficas:', error.message);
      graficasData = { 
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          datasets: [
            {
              label: 'Ingresos',
              data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              borderColor: '#10B981',
              tension: 0.1
            },
            {
              label: 'Egresos',
              data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              borderColor: '#EF4444',
              tension: 0.1
            }
          ]
        }
      };
    }

    // Formatear y combinar datos para el dashboard
    res.json({
      residentes: residentes.data,
      donaciones: donaciones.data.data || [],
      totalDonaciones: donaciones.data.total || 0,
      finanzas: finanzas.data,
      ocupacion: ocupacion.data,
      signosVitales: signosVitales.data,
      graficas: {
        monthlyData: graficasData.data
      }
    });
  } catch (error) {
    console.error("Error en dashboard BFF:", error);
    res.status(error.status || 500).json({
      message: error.message || 'Error al obtener datos del dashboard',
      data: error.data
    });
  }
});

module.exports = router;
