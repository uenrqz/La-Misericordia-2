-- Ampliar la tabla ancianos para incluir más información de ingreso
ALTER TABLE ancianos
ADD COLUMN IF NOT EXISTS tipo_ingreso VARCHAR(50) CHECK (tipo_ingreso IN ('abandono', 'hallazgo_calle', 'referido_pgn', 'particular')),
ADD COLUMN IF NOT EXISTS fecha_evaluacion_inicial DATE,
ADD COLUMN IF NOT EXISTS responsable_id INTEGER REFERENCES usuarios(id) NULL,
ADD COLUMN IF NOT EXISTS observaciones_ingreso TEXT,
ADD COLUMN IF NOT EXISTS documentos_presentados TEXT[];

-- Crear tabla para historial médico
CREATE TABLE IF NOT EXISTS historial_medico (
    id SERIAL PRIMARY KEY,
    anciano_id INTEGER NOT NULL REFERENCES ancianos(id) ON DELETE CASCADE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    descripcion TEXT NOT NULL,
    diagnostico TEXT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Crear tabla para signos vitales
CREATE TABLE IF NOT EXISTS signos_vitales (
    id SERIAL PRIMARY KEY,
    anciano_id INTEGER NOT NULL REFERENCES ancianos(id) ON DELETE CASCADE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    temperatura DECIMAL(4,1),
    presion_arterial VARCHAR(10),
    frecuencia_cardiaca INTEGER,
    frecuencia_respiratoria INTEGER,
    saturacion_oxigeno INTEGER,
    glucosa INTEGER,
    peso DECIMAL(5,2),
    observaciones TEXT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id)
);

-- Crear tabla para órdenes médicas
CREATE TABLE IF NOT EXISTS ordenes_medicas (
    id SERIAL PRIMARY KEY,
    anciano_id INTEGER NOT NULL REFERENCES ancianos(id) ON DELETE CASCADE,
    fecha_orden TIMESTAMP NOT NULL DEFAULT NOW(),
    descripcion TEXT NOT NULL,
    indicaciones TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo',
    medico_id INTEGER NOT NULL REFERENCES usuarios(id),
    fecha_vencimiento DATE
);

-- Crear tabla para medicamentos de residentes (cardex)
CREATE TABLE IF NOT EXISTS medicamentos_residentes (
    id SERIAL PRIMARY KEY,
    anciano_id INTEGER NOT NULL REFERENCES ancianos(id) ON DELETE CASCADE,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id),
    dosis VARCHAR(50) NOT NULL,
    frecuencia VARCHAR(50) NOT NULL,
    hora_administracion TIME[],
    via_administracion VARCHAR(30),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado VARCHAR(20) DEFAULT 'activo',
    orden_medica_id INTEGER REFERENCES ordenes_medicas(id),
    observaciones TEXT
);

-- Crear tabla para registro de administración de medicamentos
CREATE TABLE IF NOT EXISTS registro_medicamentos (
    id SERIAL PRIMARY KEY,
    medicamento_residente_id INTEGER NOT NULL REFERENCES medicamentos_residentes(id) ON DELETE CASCADE,
    fecha_administracion TIMESTAMP NOT NULL DEFAULT NOW(),
    dosis_administrada VARCHAR(50) NOT NULL,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    observaciones TEXT
);

-- Crear tabla para evolución del residente
CREATE TABLE IF NOT EXISTS evoluciones (
    id SERIAL PRIMARY KEY,
    anciano_id INTEGER NOT NULL REFERENCES ancianos(id) ON DELETE CASCADE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    descripcion TEXT NOT NULL,
    tipo_evolucion VARCHAR(30),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    orden_medica_id INTEGER REFERENCES ordenes_medicas(id)
);

-- Crear tabla para donaciones
CREATE TABLE IF NOT EXISTS donaciones (
    id SERIAL PRIMARY KEY,
    fecha_donacion DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_donacion VARCHAR(30) NOT NULL CHECK (tipo_donacion IN ('monetaria', 'especie', 'servicios')),
    monto DECIMAL(10,2),
    descripcion TEXT,
    donante_nombre VARCHAR(100),
    donante_nit VARCHAR(15),
    donante_direccion TEXT,
    recibo_generado BOOLEAN DEFAULT FALSE,
    numero_recibo VARCHAR(30),
    usuario_registro_id INTEGER NOT NULL REFERENCES usuarios(id),
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Crear tabla para artículos de la tienda (yard sale)
CREATE TABLE IF NOT EXISTS articulos_tienda (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(8,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible',
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    donacion_id INTEGER REFERENCES donaciones(id),
    foto_url VARCHAR(255)
);

-- Crear tabla para ventas de la tienda
CREATE TABLE IF NOT EXISTS ventas_tienda (
    id SERIAL PRIMARY KEY,
    fecha_venta TIMESTAMP NOT NULL DEFAULT NOW(),
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(30),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    observaciones TEXT
);

-- Crear tabla para detalles de ventas
CREATE TABLE IF NOT EXISTS detalles_venta (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER NOT NULL REFERENCES ventas_tienda(id) ON DELETE CASCADE,
    articulo_id INTEGER NOT NULL REFERENCES articulos_tienda(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(8,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- Crear tabla para notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    mensaje TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    leido BOOLEAN DEFAULT FALSE,
    enlace VARCHAR(255)
);

-- Modificar tabla de usuarios para incluir más roles
ALTER TABLE usuarios
ALTER COLUMN rol TYPE VARCHAR(20) USING CASE 
    WHEN rol = 'admin' THEN 'admin'
    WHEN rol = 'medico' THEN 'medico'
    WHEN rol = 'cuidador' THEN 'enfermera'
    WHEN rol = 'secretaria' THEN 'administrativo'
    ELSE 'otro' 
END;

ALTER TABLE usuarios
DROP CONSTRAINT IF EXISTS usuarios_rol_check;

ALTER TABLE usuarios
ADD CONSTRAINT usuarios_rol_check 
CHECK (rol IN ('admin', 'medico', 'enfermera', 'administrativo', 'contador'));