// Crear un script para generar un usuario administrador para producción
const bcrypt = require('bcrypt');
const fs = require('fs');

// Configuración
const usuario = {
  username: 'admin',
  password: 'Admin2025!',  // Usar contraseña más segura para producción
  nombre: 'Administrador',
  apellido: 'Sistema',
  email: 'admin@lamisericordia.org',
  rol: 'admin' // Cambiado a 'rol'
};

// Generar hash de la contraseña
const saltRounds = 10;
bcrypt.hash(usuario.password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error al cifrar la contraseña:', err);
    return;
  }
  
  // Generar el SQL para insertar el usuario
  const sql = `
-- Script para crear usuario administrador de producción
-- Generado automáticamente el ${new Date().toLocaleString()}

-- Eliminar usuario si existe
DELETE FROM usuarios WHERE username = '${usuario.username}';

-- Insertar nuevo usuario administrador
INSERT INTO usuarios (username, password, nombre, apellido, email, rol, activo, created_at)
VALUES (
  '${usuario.username}',
  '${hash}',
  '${usuario.nombre}',
  '${usuario.apellido}',
  '${usuario.email}',
  '${usuario.rol}',
  true,
  NOW()
);
`;

  // Escribir el archivo SQL
  fs.writeFile('hogar-ancianos-backend/scripts/admin_produccion.sql', sql, (err) => {
    if (err) {
      console.error('Error al crear el archivo SQL:', err);
      return;
    }
    console.log('Script SQL para usuario de producción creado correctamente');
    console.log(`Usuario: ${usuario.username}`);
    console.log(`Contraseña: ${usuario.password}`);
  });
});
