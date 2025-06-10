/**
 * Script para agregar campo de roles adicionales a la tabla usuarios
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Iniciando migración para añadir campo de roles adicionales...');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'hogar_user',
    password: process.env.DB_PASSWORD || 'securepass',
    database: process.env.DB_NAME || 'hogar_db'
  });

  const client = await pool.connect();
  
  try {
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'add_roles_adicionales.sql');
    const sqlCommands = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('🔧 Ejecutando comandos SQL para agregar roles adicionales...');
    
    // Ejecutar comandos SQL
    await client.query(sqlCommands);
    
    console.log('✅ Migración completada exitosamente.');
    
    // Verificar que el usuario u.enrqz tiene los roles adicionales
    const { rows } = await client.query(
      'SELECT username, rol, roles_adicionales FROM usuarios WHERE username = $1',
      ['u.enrqz']
    );
    
    console.log('📋 Información actualizada del usuario u.enrqz:');
    console.table(rows);

  } catch (err) {
    console.error('❌ Error durante la migración:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar la migración si este archivo se ejecuta directamente
if (require.main === module) {
  runMigration().catch(err => {
    console.error('Error en la migración:', err);
    process.exit(1);
  });
}

module.exports = { runMigration };
