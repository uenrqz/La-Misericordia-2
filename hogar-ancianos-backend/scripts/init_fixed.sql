-- Inicialización simplificada de la base de datos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de usuarios simplificada
DROP TABLE IF EXISTS usuarios CASCADE;
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'medico', 'enfermera')),
  email VARCHAR(100) UNIQUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ancianos simplificada
DROP TABLE IF EXISTS ancianos CASCADE;
CREATE TABLE ancianos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  estado_salud VARCHAR(50) NOT NULL,
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (username, password, nombre, apellido, rol, email) 
VALUES (
  'admin',
  crypt('Admin2025!', gen_salt('bf')),
  'Administrador',
  'Sistema',
  'admin',
  'admin@lamisericordia.org'
) ON CONFLICT (username) DO NOTHING;
