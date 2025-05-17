-- Script para crear usuarios de prueba para la aplicación La Misericordia
-- Usuarios para probar dashboards de médicos y enfermeras

-- Crear usuario con rol de médico
INSERT INTO usuarios (username, nombre, apellido, email, rol, password)
VALUES (
    'doctor1', 
    'Juan', 
    'Pérez', 
    'doctor@lamisericordia.org', 
    'medico',
    crypt('password123', gen_salt('bf'))
) ON CONFLICT (username) DO NOTHING;

-- Crear usuario con rol de enfermera
INSERT INTO usuarios (username, nombre, apellido, email, rol, password)
VALUES (
    'enfermera1', 
    'María', 
    'González', 
    'enfermera@lamisericordia.org', 
    'enfermera',
    crypt('password123', gen_salt('bf'))
) ON CONFLICT (username) DO NOTHING;

-- Crear usuario con rol de cuidador (si no existe)
INSERT INTO usuarios (username, nombre, apellido, email, rol, password)
VALUES (
    'cuidador1', 
    'Pedro', 
    'Ramírez', 
    'cuidador@lamisericordia.org', 
    'cuidador',
    crypt('password123', gen_salt('bf'))
) ON CONFLICT (username) DO NOTHING;