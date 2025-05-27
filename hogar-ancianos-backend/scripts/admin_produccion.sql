
-- Script para crear usuario administrador de producción
-- Generado automáticamente el 23/5/2025, 21:04:08

-- Eliminar usuario si existe
DELETE FROM usuarios WHERE username = 'admin';

-- Insertar nuevo usuario administrador
INSERT INTO usuarios (username, password, nombre, apellido, email, rol, activo, created_at)
VALUES (
  'admin',
  '$2b$10$3EV0ZPwyCDOAvMmsZu7xPOrr32kqrfHJRovy8XVu53J8sE/G26JF2',
  'Administrador',
  'Sistema',
  'admin@lamisericordia.org',
  'admin',
  true,
  NOW()
);
