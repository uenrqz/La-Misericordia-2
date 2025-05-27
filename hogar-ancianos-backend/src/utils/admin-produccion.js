/**
 * Script para aplicar el usuario administrador de producción
 * Este script ejecuta una consulta SQL para asegurarse de que exista 
 * un usuario admin con las credenciales correctas de producción
 */
const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

/**
 * Crea o actualiza el usuario administrador para el entorno de producción
 * @returns {Promise<boolean>} - True si el usuario fue creado/actualizado exitosamente
 */
const aplicarAdminProduccion = async () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('No es entorno de producción, saltando creación de admin de producción');
    return false;
  }
  
  try {
    console.log('Aplicando usuario administrador de producción...');
    
    // Datos del administrador de producción
    const admin = {
      username: 'admin',
      password: 'Admin2025!',  // Contraseña para producción
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@lamisericordia.org',
      rol: 'admin'
    };
    
    // Genera hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(admin.password, saltRounds);
    
    // Verificar si el usuario ya existe
    const [usuarios] = await sequelize.query(
      `SELECT * FROM usuarios WHERE username = '${admin.username}'`
    );
    
    if (usuarios.length > 0) {
      // Si el usuario existe, actualizar su contraseña
      await sequelize.query(`
        UPDATE usuarios 
        SET password = '${passwordHash}',
            nombre = '${admin.nombre}',
            apellido = '${admin.apellido}',
            email = '${admin.email}',
            rol = '${admin.rol}'
        WHERE username = '${admin.username}'
      `);
      console.log('Usuario administrador actualizado con las credenciales de producción');
    } else {
      // Si no existe, crearlo
      await sequelize.query(`
        INSERT INTO usuarios (username, password, nombre, apellido, email, role, activo, created_at)
        VALUES (
          '${admin.username}',
          '${passwordHash}',
          '${admin.nombre}',
          '${admin.apellido}',
          '${admin.email}',
          '${admin.rol}',
          true,
          NOW()
        )
      `);
      console.log('Usuario administrador de producción creado exitosamente');
    }
    
    return true;
  } catch (error) {
    console.error('Error al aplicar el usuario administrador de producción:', error);
    return false;
  }
};

module.exports = { aplicarAdminProduccion };
