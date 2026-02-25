const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.production' });

/**
 * Script para ejecutar la migración en producción (Render PostgreSQL)
 * USO: NODE_ENV=production node scripts/run_migration_produccion.js
 */

async function runMigration() {
  console.log('🔄 Iniciando migración de base de datos...');
  
  // Verificar que existe DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL no está definida en las variables de entorno');
    console.log('💡 Verifica que .env.production contenga la DATABASE_URL de Render');
    process.exit(1);
  }

  console.log(`📍 Conectando a: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  // Crear pool de conexión
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    // Probar conexión
    console.log('🔌 Conectando a la base de datos...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión establecida correctamente');

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'migrate_produccion.sql');
    console.log(`📄 Leyendo script: ${sqlFilePath}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`No se encontró el archivo: ${sqlFilePath}`);
    }

    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ Script SQL cargado correctamente');

    // Ejecutar el script
    console.log('⚙️  Ejecutando migración...');
    await pool.query(sqlScript);
    
    console.log('✅ Migración ejecutada exitosamente');
    
    // Verificar tablas creadas
    console.log('\n📋 Verificando tablas en la base de datos:');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📦 Tablas disponibles:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Verificar columnas de usuarios
    console.log('\n📋 Columnas de la tabla usuarios:');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position
    `);
    
    columnsResult.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
    
  } catch (error) {
    console.error('\n❌ ERROR durante la migración:');
    console.error(error.message);
    if (error.code) {
      console.error(`\nCódigo de error PostgreSQL: ${error.code}`);
    }
    console.error('\nDetalles completos del error:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar migración
runMigration();
