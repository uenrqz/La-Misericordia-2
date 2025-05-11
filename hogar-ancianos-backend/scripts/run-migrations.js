/**
 * Script para ejecutar migraciones de base de datos
 * Este script aplica automáticamente el esquema inicial y actualizaciones
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'hogar_user',
  password: process.env.DB_PASSWORD || 'securepass',
  database: process.env.DB_NAME || 'hogar_db'
});

/**
 * Ejecuta un script SQL desde un archivo
 * @param {string} filePath - Ruta al archivo SQL
 */
async function executeSqlFile(filePath) {
  try {
    // Leer el contenido del archivo SQL
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Conectar a la base de datos
    const client = await pool.connect();
    
    try {
      // Iniciar transacción
      await client.query('BEGIN');
      
      console.log(`Ejecutando script: ${path.basename(filePath)}`);
      
      // Ejecutar el script SQL
      await client.query(sqlContent);
      
      // Confirmar transacción
      await client.query('COMMIT');
      
      console.log(`Script ejecutado exitosamente: ${path.basename(filePath)}`);
    } catch (err) {
      // Revertir en caso de error
      await client.query('ROLLBACK');
      throw err;
    } finally {
      // Liberar cliente
      client.release();
    }
  } catch (err) {
    console.error(`Error al ejecutar script SQL ${filePath}:`, err);
    throw err;
  }
}

/**
 * Verifica si una tabla existe en la base de datos
 * @param {string} tableName - Nombre de la tabla a verificar
 * @returns {Promise<boolean>} - True si la tabla existe
 */
async function tableExists(tableName) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_name = $1
       )`,
      [tableName]
    );
    return result.rows[0].exists;
  } finally {
    client.release();
  }
}

/**
 * Crea una tabla para registro de migraciones si no existe
 */
async function createMigrationsTable() {
  const client = await pool.connect();
  try {
    // Verificar si la tabla de migraciones existe
    const exists = await tableExists('migraciones');
    
    if (!exists) {
      console.log('Creando tabla de registro de migraciones...');
      await client.query(`
        CREATE TABLE migraciones (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL UNIQUE,
          aplicada_en TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('Tabla de migraciones creada exitosamente');
    }
  } finally {
    client.release();
  }
}

/**
 * Verifica si una migración ya fue aplicada
 * @param {string} migrationName - Nombre de la migración
 * @returns {Promise<boolean>} - True si la migración ya fue aplicada
 */
async function migrationApplied(migrationName) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT COUNT(*) FROM migraciones WHERE nombre = $1',
      [migrationName]
    );
    return parseInt(result.rows[0].count) > 0;
  } finally {
    client.release();
  }
}

/**
 * Registra una migración como aplicada
 * @param {string} migrationName - Nombre de la migración
 */
async function registerMigration(migrationName) {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO migraciones (nombre) VALUES ($1)',
      [migrationName]
    );
    console.log(`Migración registrada: ${migrationName}`);
  } finally {
    client.release();
  }
}

/**
 * Función principal para ejecutar migraciones
 */
async function runMigrations() {
  try {
    // Crear tabla de migraciones si no existe
    await createMigrationsTable();
    
    // Definir archivos de migración en orden de ejecución
    const migrations = [
      {
        name: 'init_db',
        file: path.join(__dirname, 'init_db.sql')
      },
      {
        name: 'schema_updates',
        file: path.join(__dirname, 'schema_updates.sql')
      }
    ];
    
    // Ejecutar cada migración si no ha sido aplicada
    for (const migration of migrations) {
      const applied = await migrationApplied(migration.name);
      
      if (!applied) {
        console.log(`Aplicando migración: ${migration.name}`);
        await executeSqlFile(migration.file);
        await registerMigration(migration.name);
      } else {
        console.log(`Migración ya aplicada: ${migration.name}`);
      }
    }
    
    console.log('Todas las migraciones han sido aplicadas exitosamente');
    
  } catch (err) {
    console.error('Error al ejecutar migraciones:', err);
    throw err;
  } finally {
    // Cerrar el pool de conexiones
    await pool.end();
  }
}

// Ejecutar migraciones
runMigrations()
  .then(() => {
    console.log('Proceso de migración completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error en el proceso de migración:', err);
    process.exit(1);
  });