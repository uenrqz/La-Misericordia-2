const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

// Endpoint para gráficas mensuales de finanzas (dummy data)
router.get('/graficas/mensuales', authMiddleware.authenticate(['admin', 'medico', 'enfermera', 'secretaria']), (req, res) => {
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
});

module.exports = router;
