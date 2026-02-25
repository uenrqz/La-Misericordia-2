const db = require('../config/db');

/**
 * Obtener resumen financiero
 */
exports.getResumen = async (req, res) => {
  try {
    // Por ahora devolvemos datos mock ya que no hay tabla de finanzas
    // En el futuro se puede conectar con una tabla real de movimientos financieros
    
    const resumen = {
      totalIngresos: 45000,
      totalEgresos: 32000,
      netBalance: 13000,
      ingresosMesActual: 17000,
      egresosMesActual: 13000,
      balanceMesActual: 4000
    };
    
    res.json(resumen);
  } catch (err) {
    console.error('Error al obtener resumen financiero:', err);
    res.status(500).json({ message: 'Error al obtener resumen financiero', error: err.message });
  }
};

/**
 * Obtener datos para gráficas mensuales
 */
exports.getGraficasMensuales = async (req, res) => {
  try {
    res.json({
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      datasets: [
        {
          label: 'Ingresos',
          data: [12000, 15000, 11000, 17000, 14000, 16000, 18000, 17500, 16000, 15500, 16500, 17000],
          borderColor: '#10B981',
          tension: 0.1
        },
        {
          label: 'Egresos',
          data: [8000, 9000, 9500, 10000, 11000, 10500, 12000, 11500, 11000, 12000, 12500, 13000],
          borderColor: '#EF4444',
          tension: 0.1
        }
      ]
    });
  } catch (err) {
    console.error('Error al obtener gráficas mensuales:', err);
    res.status(500).json({ message: 'Error al obtener gráficas mensuales', error: err.message });
  }
};
