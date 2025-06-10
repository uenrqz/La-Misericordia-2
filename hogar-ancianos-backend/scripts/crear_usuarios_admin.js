/**
 * Script para crear usuarios administradores con las credenciales correctas
 * Este script crea/actualiza los usuarios admin y superadministrador
 * 
 * Puede ejecutarse directamente como script o importarse como módulo en app.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let pool;

/**
 * Función para encriptar contraseñas
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Inicializa la conexión a la base de datos
 * @param {Object} options Opciones de conexión o un pool existente
 */
function initPool(options = {}) {
  if (options.pool) {
    pool = options.pool;
    return;
  }
  
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'hogar_user',
    password: process.env.DB_PASSWORD || 'securepass',
    database: process.env.DB_NAME || 'hogar_db',
    ...options
  });
  
  return pool;
}

/**
 * Función principal para crear/actualizar usuarios administradores
 * @param {boolean} silentMode Si es true, reduce los mensajes en consola
 */
async function crearUsuariosAdmin(silentMode = false) {
  if (!pool) {
    initPool();
  }

  const log = (message) => {
    if (!silentMode) {
      console.log(message);
    }
  };
  
  const client = await pool.connect();
  
  try {
    log('🔧 Iniciando creación/actualización de usuarios administradores...');
    
    // Contraseña hasheada para Admin2025!
    const passwordAdmin = await hashPassword('Admin2025!');
    
    log('📋 Verificando usuario admin existente...');
    
    // Verificar si el usuario admin existe
    const { rows: adminExistente } = await client.query(
      'SELECT id FROM usuarios WHERE username = $1',
      ['admin']
    );
    
    if (adminExistente.length > 0) {
      // Actualizar usuario admin existente
      log('🔄 Actualizando usuario admin existente...');
      await client.query(`
        UPDATE usuarios SET 
          password = $1,
          nombre = 'Administrador',
          apellido = 'Sistema',
          rol = 'admin',
          email = 'admin@hogarlamisericordia.org'
        WHERE username = 'admin'
      `, [passwordAdmin]);
      log('✅ Usuario admin actualizado correctamente');
    } else {
      // Crear usuario admin
      log('➕ Creando usuario admin...');
      await client.query(`
        INSERT INTO usuarios (username, password, nombre, apellido, rol, email)
        VALUES ($1, $2, 'Administrador', 'Sistema', 'admin', 'admin@hogarlamisericordia.org')
      `, ['admin', passwordAdmin]);
      log('✅ Usuario admin creado correctamente');
    }
    
    log('📋 Verificando usuario administrador (Ulises Enriquez)...');
    
    // Verificar si el usuario u.enrqz existe
    const { rows: adminUlisesExistente } = await client.query(
      'SELECT id FROM usuarios WHERE username = $1',
      ['u.enrqz']
    );
    
    if (adminUlisesExistente.length > 0) {
      // Actualizar usuario administrador existente
      log('🔄 Actualizando usuario administrador existente...');
      await client.query(`
        UPDATE usuarios SET 
          password = $1,
          nombre = 'Ulises',
          apellido = 'Enriquez',
          rol = 'admin',
          email = 'ulisesenr64@gmail.com',
          roles_adicionales = '["medico", "enfermero"]'
        WHERE username = 'u.enrqz'
      `, [passwordAdmin]);
      log('✅ Usuario administrador actualizado correctamente con acceso a todos los dashboards');
    } else {
      // Crear usuario administrador
      log('➕ Creando usuario administrador (Ulises Enriquez)...');
      await client.query(`
        INSERT INTO usuarios (username, password, nombre, apellido, rol, email, roles_adicionales)
        VALUES ($1, $2, 'Ulises', 'Enriquez', 'admin', 'ulisesenr64@gmail.com', '["medico", "enfermero"]')
      `, ['u.enrqz', passwordAdmin]);
      log('✅ Usuario administrador creado correctamente con acceso a todos los dashboards');
    }
    
    // Crear o actualizar el usuario "Ulises" con la contraseña específica
    log('📋 Verificando usuario Ulises con contraseña personalizada...');
    const passwordUlises = await hashPassword('Telephono.98');
    
    const { rows: userUlisesExistente } = await client.query(
      'SELECT id FROM usuarios WHERE username = $1',
      ['Ulises']
    );
    
    if (userUlisesExistente.length > 0) {
      // Actualizar usuario Ulises existente
      log('🔄 Actualizando usuario Ulises existente...');
      await client.query(`
        UPDATE usuarios SET 
          password = $1,
          nombre = 'Ulises',
          apellido = 'Test',
          rol = 'admin',
          email = 'ulises.test@hogarlamisericordia.org'
        WHERE username = 'Ulises'
      `, [passwordUlises]);
      log('✅ Usuario Ulises actualizado correctamente con contraseña personalizada');
    } else {
      // Crear usuario Ulises
      log('➕ Creando usuario Ulises con contraseña personalizada...');
      await client.query(`
        INSERT INTO usuarios (username, password, nombre, apellido, rol, email)
        VALUES ($1, $2, 'Ulises', 'Test', 'admin', 'ulises.test@hogarlamisericordia.org')
      `, ['Ulises', passwordUlises]);
      log('✅ Usuario Ulises creado correctamente con contraseña personalizada');
    }
    
    // Eliminar el usuario "ulises" si existe
    log('📋 Verificando si existe el usuario "ulises" para eliminarlo...');
    const { rows: usuarioUlisesExistente } = await client.query(
      'SELECT id FROM usuarios WHERE username = $1',
      ['ulises']
    );
    
    if (usuarioUlisesExistente.length > 0) {
      log('🗑️ Eliminando usuario "ulises"...');
      await client.query('DELETE FROM usuarios WHERE username = $1', ['ulises']);
      log('✅ Usuario "ulises" eliminado correctamente');
    } else {
      log('✅ El usuario "ulises" no existe, no es necesario eliminarlo');
    }
    
    // Verificar que los usuarios se crearon/actualizaron correctamente
    log('\n📊 Verificando usuarios creados/actualizados:');
    const { rows: usuariosAdmin } = await client.query(`
      SELECT id, username, nombre, apellido, rol, email, roles_adicionales
      FROM usuarios 
      WHERE username IN ('admin', 'u.enrqz')
      ORDER BY username
    `);
    
    if (!silentMode) {
      console.table(usuariosAdmin);
    }
    
    // Verificar que los usuarios se crearon/actualizaron correctamente incluyendo Ulises
    log('\n📊 Verificando usuarios creados/actualizados incluyendo Ulises:');
    const { rows: todosUsuariosAdmin } = await client.query(`
      SELECT id, username, nombre, apellido, rol, email, roles_adicionales
      FROM usuarios 
      WHERE username IN ('admin', 'u.enrqz', 'Ulises')
      ORDER BY username
    `);
    
    if (!silentMode) {
      console.table(todosUsuariosAdmin);
      
      console.log('\n🎉 Proceso completado exitosamente!');
      console.log('\n📋 Credenciales de acceso:');
      console.log('   👤 Usuario: admin');
      console.log('   🔑 Contraseña: Admin2025!');
      console.log('   📧 Email: admin@hogarlamisericordia.org');
      console.log('');
      console.log('   👤 Usuario: u.enrqz (Ulises Enriquez - Administrador)');
      console.log('   🔑 Contraseña: Admin2025!');
      console.log('   📧 Email: ulisesenr64@gmail.com');
      console.log('');
      console.log('   👤 Usuario: Ulises (Usuario para pruebas)');
      console.log('   🔑 Contraseña: Telephono.98');
      console.log('   📧 Email: ulises.test@hogarlamisericordia.org');
    } else {
      log(`✅ Usuarios configurados: admin, u.enrqz, Ulises`);
    }
    
  } catch (error) {
    console.error('❌ Error al crear/actualizar usuarios administradores:', error);
    throw error;
  } finally {
    client.release();
  }
  
  return {
    success: true,
    message: 'Usuarios administradores creados/actualizados correctamente'
  };
}

// Si se ejecuta directamente como script
if (require.main === module) {
  // Ejecutar la función
  crearUsuariosAdmin()
    .then(() => {
      console.log('\n✅ Script finalizado correctamente');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error en el script:', err);
      process.exit(1);
    });
} 

// Exportar para uso como módulo
module.exports = {
  crearUsuariosAdmin,
  initPool
};
