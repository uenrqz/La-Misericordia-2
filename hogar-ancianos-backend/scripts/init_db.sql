CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE ancianos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL CHECK (fecha_nacimiento <= CURRENT_DATE - INTERVAL '60 years'),
  direccion_anterior VARCHAR(200),
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  estado_salud VARCHAR(50) NOT NULL,
  medicamentos TEXT,
  alergias TEXT,
  contacto_emergencia VARCHAR(100),
  telefono_emergencia VARCHAR(20)
);

-- Crear una función para calcular la edad
CREATE OR REPLACE FUNCTION calcular_edad(fecha_nac DATE) 
RETURNS INTEGER AS $$
BEGIN
  RETURN DATE_PART('year', AGE(CURRENT_DATE, fecha_nac));
END;
$$ LANGUAGE plpgsql;

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'medico', 'cuidador', 'secretaria')),
  email VARCHAR(100) UNIQUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historial_medico (
  id SERIAL PRIMARY KEY,
  anciano_id INTEGER REFERENCES ancianos(id) ON DELETE CASCADE,
  fecha_revision DATE NOT NULL DEFAULT CURRENT_DATE,
  diagnostico TEXT NOT NULL,
  tratamiento TEXT,
  observaciones TEXT,
  medico_id INTEGER REFERENCES usuarios(id),
  presion_arterial VARCHAR(20),
  temperatura DECIMAL(4,1),
  peso DECIMAL(5,2)
);

CREATE TABLE medicamentos_asignados (
  id SERIAL PRIMARY KEY,
  anciano_id INTEGER REFERENCES ancianos(id) ON DELETE CASCADE,
  nombre_medicamento VARCHAR(100) NOT NULL,
  dosis VARCHAR(50) NOT NULL,
  frecuencia VARCHAR(50) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  observaciones TEXT
);

-- Tabla para registrar las actividades diarias
CREATE TABLE actividades_diarias (
  id SERIAL PRIMARY KEY,
  anciano_id INTEGER REFERENCES ancianos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  alimentacion BOOLEAN DEFAULT FALSE,
  aseo_personal BOOLEAN DEFAULT FALSE,
  medicacion BOOLEAN DEFAULT FALSE,
  ejercicio BOOLEAN DEFAULT FALSE,
  recreacion BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  cuidador_id INTEGER REFERENCES usuarios(id)
);

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (username, password, nombre, apellido, rol, email) 
VALUES ('admin', crypt('admin123', gen_salt('bf')), 'Administrador', 'Sistema', 'admin', 'admin@hogarlamisericordia.org')
ON CONFLICT DO NOTHING;