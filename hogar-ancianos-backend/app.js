const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/residentes', require('./src/routes/residentes.routes'));
app.use('/api/usuarios', require('./src/routes/usuarios.routes'));
app.use('/api/historial-medico', require('./src/routes/historial-medico.routes'));
app.use('/api/medicamentos', require('./src/routes/medicamentos.routes'));
app.use('/api/actividades', require('./src/routes/actividades.routes'));

// Nuevas rutas implementadas
app.use('/api/residentes', require('./src/routes/signos-vitales.routes'));
app.use('/api/residentes', require('./src/routes/evoluciones.routes'));
app.use('/api/residentes', require('./src/routes/ordenes-medicas.routes'));
app.use('/api/donaciones', require('./src/routes/donaciones.routes'));

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'API del Sistema de Gestión del Hogar de Ancianos La Misericordia', 
    version: '1.0.0' 
  });
});

// Gestión de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Error interno del servidor'
  });
});

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});