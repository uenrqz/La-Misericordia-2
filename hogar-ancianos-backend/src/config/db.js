const { Pool } = require('pg');
require('dotenv').config();

// Configuración condicional para desarrollo/producción
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const isDevelopment = process.env.NODE_ENV === 'development' && !hasDatabaseUrl;

let poolConfig;

if (isDevelopment) {
  // Configuración para desarrollo local
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hogar_db',
    user: process.env.DB_USER || 'hogar_user',
    password: process.env.DB_PASSWORD || 'securepass',
  };
} else {
  // Configuración para producción (Render)
  let connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const parsedDbUrl = new URL(connectionString);
    if (parsedDbUrl.hostname.startsWith('dpg-') && !parsedDbUrl.hostname.includes('.')) {
      parsedDbUrl.hostname = `${parsedDbUrl.hostname}.oregon-postgres.render.com`;
    }
    connectionString = parsedDbUrl.toString();
  }
  const isInternalRenderHost = connectionString
    ? !new URL(connectionString).hostname.includes('.')
    : false;

  poolConfig = {
    connectionString,
    ssl: isInternalRenderHost
      ? false
      : {
          require: true,
          rejectUnauthorized: false
        },
    connectionTimeoutMillis: 30000
  };
}

const pool = new Pool(poolConfig);

// Eventos de conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL correctamente');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a PostgreSQL:', err);
});

// Verificar conexión inmediatamente
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('✅ Conexión inicial a PostgreSQL exitosa');
    release();
  }
});

module.exports = { pool };
