const { pool } = require('../src/config/db');

async function sincronizarRoles() {
  console.log('🔄 Sincronizando roles del sistema...');
  
  try {
    // Verificar que el pool existe
    if (!pool) {
      throw new Error('Pool de base de datos no disponible');
    }

    // Lista de roles válidos
    const rolesValidos = ['admin', 'medico', 'enfermero', 'cuidador', 'secretaria'];
    
    // Actualizar constraint de roles — dos sentencias separadas (PostgreSQL no permite múltiples
    // comandos en una sola prepared statement)
    await pool.query(`
      ALTER TABLE usuarios 
      DROP CONSTRAINT IF EXISTS usuarios_rol_check;
    `);
    
    await pool.query(`
      ALTER TABLE usuarios 
      ADD CONSTRAINT usuarios_rol_check 
      CHECK (rol = ANY($1::text[]));
    `, [rolesValidos]);
    
    console.log('✅ Roles sincronizados correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al sincronizar roles:', error.message);
    return false;
  }
}

module.exports = { sincronizarRoles };
