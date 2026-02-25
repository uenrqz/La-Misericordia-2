-- =====================================================
-- NORMALIZACIÓN A 3NF - Hogar de Ancianos La Misericordia
-- =====================================================

BEGIN;

-- Crear tabla de alergias
CREATE TABLE IF NOT EXISTS alergias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    nivel_riesgo VARCHAR(20) CHECK (nivel_riesgo IN ('bajo', 'moderado', 'alto', 'critico'))
);

-- Crear tabla de medicamentos (catálogo)
CREATE TABLE IF NOT EXISTS medicamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    principio_activo VARCHAR(150),
    presentacion VARCHAR(100),
    concentracion VARCHAR(50)
);

-- Crear tabla de donantes
CREATE TABLE IF NOT EXISTS donantes (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(20) DEFAULT 'NIT',
    numero_documento VARCHAR(50) UNIQUE,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    tipo_donante VARCHAR(30) CHECK (tipo_donante IN ('persona_natural', 'empresa', 'organizacion')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de relación residentes-alergias
CREATE TABLE IF NOT EXISTS residentes_alergias (
    id SERIAL PRIMARY KEY,
    residente_id INTEGER NOT NULL,
    alergia_id INTEGER NOT NULL REFERENCES alergias(id),
    fecha_diagnostico DATE DEFAULT CURRENT_DATE,
    observaciones TEXT,
    UNIQUE(residente_id, alergia_id)
);

-- Crear tabla de contactos de emergencia
CREATE TABLE IF NOT EXISTS contactos_emergencia (
    id SERIAL PRIMARY KEY,
    residente_id INTEGER NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    parentesco VARCHAR(50),
    telefono_principal VARCHAR(20) NOT NULL,
    telefono_secundario VARCHAR(20),
    email VARCHAR(100),
    es_principal BOOLEAN DEFAULT FALSE
);

-- Crear tabla de medicamentos asignados a residentes
CREATE TABLE IF NOT EXISTS medicamentos_residentes (
    id SERIAL PRIMARY KEY,
    residente_id INTEGER NOT NULL,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id),
    dosis VARCHAR(50) NOT NULL,
    frecuencia VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado VARCHAR(20) DEFAULT 'activo'
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_contactos_residente ON contactos_emergencia(residente_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_residente ON medicamentos_residentes(residente_id);

COMMIT;
