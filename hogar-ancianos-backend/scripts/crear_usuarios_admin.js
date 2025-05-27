/**
 * Script para crear usuarios administradores con las credenciales correctas
 * Este script crea/actualiza los usuarios admin y superadministrador
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'hogar_user',
  password: process.env.DB_PASSWORD || 'securepass',
  database: process.env.DB_NAME || 'hogar_db'
});

/**
 * Función para encriptar contraseñas
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Función principal para crear/actualizar usuarios administradores
 */
async function crearUsuariosAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Iniciando creación/actualización de usuarios administradores...');
    
    // Contraseña hasheada para Admin2025!
    const passwordAdmin = await hashPassword('Admin2025!');
    
    console.log('📋 Verificando usuario admin existente...');
    
    // Verificar si el usuario admin existe
    const { rows: adminExistente } = await client.query(
      'SELECT id FROM usuarios WHERE username = $1',
      ['admin']
    );
    
    if (adminExistente.length > 0) {
      // Actualizar usuario admin existente
      console.log('🔄 Actualizando usuario admin existente...');
      await client.query(`
        UPDATE usuarios SET 
          password = $1,
          nombre = 'Administrador',
          apellido = 'Sistema',
          rol = 'admin',
          email = 'admin@hogarlamisericordia.org'
        WHERE username = 'admin'
      `, [passwordAdmin]);
      console.log('✅ Usuario admin actualizado correctamente');
    } else {
      // Crear usuario admin
      console.log('➕ Creando usuario admin...');
      await client.query(`
        INSERT INTO usuarios (username, password, nombre, apellido, rol, email)
        VALUES ($1, $2, 'Administrador', 'Sistema', 'admin', 'admin@hogarlamisericordia.org')
      `, ['admin', passwordAdmin]);
      console.log('✅ Usuario admin creado correctamente');
    }
    
    console.log('📋 Verificando usuario superadministrador (Ulises Enriquez)...');
    
    // Verificar si el usuario u.enrqz existe
    const { rows: superAdminExistente } = await client.query(
      'SELECT id FROM usuarios WHERE username = $1',
      ['u.enrqz']
    );
    
    if (superAdminExistente.length > 0) {
      // Actualizar usuario superadministrador existente
      console.log('🔄 Actualizando usuario superadministrador existente...');
      await client.query(`
        UPDATE usuarios SET 
          password = $1,
          nombre = 'Ulises',
          apellido = 'Enriquez',
          rol = 'superadmin',
          email = 'ulisesenr64@gmail.com'
        WHERE username = 'u.enrqz'
      `, [passwordAdmin]);
      console.log('✅ Usuario superadministrador actualizado correctamente');
    } else {
      // Crear usuario superadministrador
      console.log('➕ Creando usuario superadministrador (Ulises Enriquez)...');
      await client.query(`
        INSERT INTO usuarios (username, password, nombre, apellido, rol, email)
        VALUES ($1, $2, 'Ulises', 'Enriquez', 'superadmin', 'ulisesenr64@gmail.com')
      `, ['u.enrqz', passwordAdmin]);
      console.log('✅ Usuario superadministrador creado correctamente');
    }
    
    // Verificar que los usuarios se crearon/actualizaron correctamente
    console.log('\n📊 Verificando usuarios creados/actualizados:');
    const { rows: usuariosAdmin } = await client.query(`
      SELECT id, username, nombre, apellido, rol, email
      FROM usuarios 
      WHERE username IN ('admin', 'u.enrqz')
      ORDER BY username
    `);
    
    console.table(usuariosAdmin);
    
    console.log('\n🎉 Proceso completado exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   👤 Usuario: admin');
    console.log('   🔑 Contraseña: Admin2025!');
    console.log('   📧 Email: admin@hogarlamisericordia.org');
    console.log('');
    console.log('   👤 Usuario: u.enrqz (Ulises Enriquez - Superadministrador)');
    console.log('   🔑 Contraseña: Admin2025!');
    console.log('   📧 Email: ulisesenr64@gmail.com');
    
  } catch (error) {
    console.error('❌ Error al crear/actualizar usuarios administradores:', error);
    throw error;
  } finally {
    client.release();
  }
}

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
