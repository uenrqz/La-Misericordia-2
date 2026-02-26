const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Configuración de CORS segura
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importar configuración de base de datos
const { testConnection, sequelize } = require('./src/config/database');
const { pool } = require('./src/config/db');

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
app.use('/api/finanzas', require('./src/routes/finanzas.routes'));

// Rutas de Libro Diario Financiero
app.use('/api/transacciones', require('./src/routes/transacciones.routes'));
app.use('/api/pagos-programados', require('./src/routes/pagos.routes'));

// Verificar conexión a PostgreSQL
async function verificarConexionDB() {
  try {
    await testConnection();
    console.log('✅ Conexión a PostgreSQL verificada correctamente');
    return true;
  } catch (err) {
    console.error('⛔️ Error al verificar conexión a PostgreSQL:', err.message);
    return false;
  }
}

// Ruta de salud para monitoreo
app.get('/health', async (req, res) => {
  const dbStatus = await verificarConexionDB();
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Backend - La Misericordia',
    version: '1.0.0',
    database: dbStatus ? 'connected' : 'disconnected'
  });
});

// Ruta de estado para BFF
app.get('/api/status', async (req, res) => {
  const dbStatus = await verificarConexionDB();
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus ? 'connected' : 'disconnected'
  });
});

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
const PORT = process.env.PORT || 5000;

// Importar scripts para configuración inicial
const { crearUsuariosAdmin, initPool } = require('./scripts/crear_usuarios_admin');
const { sincronizarRoles } = require('./scripts/sincronizar_roles');

// Configurar usuarios administradores al iniciar (en cualquier entorno)
(async () => {
  try {
    await testConnection();
    console.log('Verificando y configurando usuarios administradores...');
    
    // Inicializar con el pool existente para evitar conexiones duplicadas
    initPool({ pool });
    
    // Sincronizar roles disponibles en el sistema
    await sincronizarRoles();
    console.log('✅ Roles del sistema sincronizados.');
    
    // Crear usuarios admin con modo silencioso (menos logs)
    await crearUsuariosAdmin(true);
    console.log('✅ Usuarios administradores verificados y actualizados.');
    
    // En producción, aplicar configuraciones adicionales
    if (process.env.NODE_ENV === 'production') {
      const { aplicarAdminProduccion } = require('./src/utils/admin-produccion');
      console.log('Configurando sistema para entorno de producción...');
      await aplicarAdminProduccion();
      console.log('Sistema listo para producción');
    }
  } catch (err) {
    console.error('Error configurando usuarios administradores:', err);
  }
})();

// Manejar cierre gracioso
process.on('SIGINT', async () => {
  console.log('Cerrando aplicación y conexiones a la base de datos...');
  try {
    await sequelize.close();
    await pool.end();
    console.log('Conexiones a la base de datos cerradas correctamente');
    process.exit(0);
  } catch (err) {
    console.error('Error al cerrar conexiones a la base de datos:', err);
    process.exit(1);
  }
});

app.listen(PORT, async () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT} en modo ${process.env.NODE_ENV || 'development'}`);
  await verificarConexionDB();
});
