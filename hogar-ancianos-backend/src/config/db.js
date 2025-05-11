const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'hogar_user',
  password: process.env.DB_PASSWORD || 'securepass',
  database: process.env.DB_NAME || 'hogar_db'
});

pool.on('connect', () => {
  console.log('Conexión establecida con la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Error en la conexión a la base de datos:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};