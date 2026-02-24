/**
 * Script para sincronizar los roles disponibles en la base de datos y en el sistema
 * Asegura que la restricción de roles en la tabla usuarios tenga todos los roles necesarios
 */

const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'hogar_user',
  password: process.env.DB_PASSWORD || 'securepass',
  database: process.env.DB_NAME || 'hogar_db'
});

async function sincronizarRoles() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Sincronizando roles del sistema...');
    
    // Roles que deben estar disponibles en el sistema
    const rolesValidos = ['admin', 'medico', 'enfermero', 'cuidador', 'secretaria'];
    
    // Verificar la restricción actual
    const { rows: checkResult } = await client.query(`
      SELECT pg_get_constraintdef(oid) as constraint_def
      FROM pg_constraint
      WHERE conname = 'usuarios_rol_check'
    `);
    
    console.log('📊 Restricción actual:', checkResult[0]?.constraint_def || 'No encontrada');
    
    // Actualizar la restricción para incluir todos los roles válidos
    console.log('🔧 Actualizando restricción de roles...');
    await client.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check');
    
    const rolesStr = rolesValidos.map(rol => `'${rol}'`).join(', ');
    await client.query(`
      ALTER TABLE usuarios 
      ADD CONSTRAINT usuarios_rol_check 
      CHECK (rol IN (${rolesStr}))
    `);
    
    // Verificar campos con roles obsoletos que necesiten actualización
    console.log('🔍 Verificando usuarios con roles obsoletos...');
    const { rows: usuariosObsoletos } = await client.query(`
      SELECT id, username, rol FROM usuarios 
      WHERE rol NOT IN (${rolesStr})
    `);
    
    if (usuariosObsoletos.length > 0) {
      console.log('⚠️ Usuarios con roles obsoletos encontrados:', usuariosObsoletos.length);
      console.table(usuariosObsoletos);
      
      // Actualizar usuarios con roles obsoletos (por ejemplo: enfermera -> enfermero)
      console.log('🔧 Actualizando usuarios con roles obsoletos...');
      
      // Mapeo de roles antiguos a nuevos
      const mapeoRoles = {
        'enfermera': 'enfermero',
        'doctor': 'medico'
        // Agregar más mapeos si es necesario
      };
      
      for (const usuario of usuariosObsoletos) {
        const nuevoRol = mapeoRoles[usuario.rol] || 'enfermero'; // Por defecto, convertir a enfermero
        await client.query(`
          UPDATE usuarios 
          SET rol = $1
          WHERE id = $2
        `, [nuevoRol, usuario.id]);
        console.log(`✅ Usuario ${usuario.username} (${usuario.rol}) actualizado a ${nuevoRol}`);
      }
    } else {
      console.log('✅ No se encontraron usuarios con roles obsoletos');
    }
    
    console.log('🎉 Sincronización de roles completada');
  } catch (error) {
    console.error('❌ Error al sincronizar roles:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  sincronizarRoles()
    .then(() => {
      console.log('✅ Script finalizado correctamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { sincronizarRoles };
