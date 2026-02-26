-- ============================================
-- SISTEMA DE LIBRO DIARIO FINANCIERO - 3NF
-- Esquema Completamente Normalizado
-- ============================================

-- Tabla de Categorías de Transacciones (SIN CAMBIOS - Ya cumple 3NF)
CREATE TABLE IF NOT EXISTS categorias_transacciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    descripcion TEXT,
    icono VARCHAR(50),
    color VARCHAR(20),
    es_recurrente BOOLEAN DEFAULT false,
    frecuencia_estimada INTEGER,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Métodos de Pago (NUEVA - Normalización)
CREATE TABLE IF NOT EXISTS metodos_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Proveedores/Beneficiarios (NUEVA - Normalización)
CREATE TABLE IF NOT EXISTS contactos_financieros (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('proveedor', 'beneficiario', 'ambos')),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Estados de Transacciones (NUEVA - Normalización)
CREATE TABLE IF NOT EXISTS estados_transaccion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE CHECK (nombre IN ('completada', 'pendiente', 'cancelada')),
    descripcion TEXT,
    color VARCHAR(20)
);

-- Tabla de Transacciones Financieras (NORMALIZADA)
CREATE TABLE IF NOT EXISTS transacciones_financieras (
    id SERIAL PRIMARY KEY,
    -- ELIMINADO: tipo (se obtiene de categoria_id -> categorias_transacciones.tipo)
    categoria_id INTEGER NOT NULL REFERENCES categorias_transacciones(id),
    concepto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
    fecha_transaccion DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago_id INTEGER REFERENCES metodos_pago(id),
    referencia VARCHAR(100),
    comprobante_url TEXT,
    proveedor_id INTEGER REFERENCES contactos_financieros(id), -- FK en lugar de texto
    beneficiario_id INTEGER REFERENCES contactos_financieros(id), -- FK en lugar de texto
    usuario_registro_id INTEGER NOT NULL REFERENCES usuarios(id),
    es_recurrente BOOLEAN DEFAULT false,
    frecuencia_dias INTEGER,
    proxima_sugerencia DATE,
    notas TEXT,
    estado_id INTEGER DEFAULT 1 REFERENCES estados_transaccion(id), -- FK en lugar de enum
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_proveedor_o_beneficiario CHECK (
        (proveedor_id IS NOT NULL OR beneficiario_id IS NOT NULL)
    )
);

-- Tabla de Frecuencias de Pago (NUEVA - Normalización)
CREATE TABLE IF NOT EXISTS frecuencias_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE CHECK (nombre IN ('diario', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual')),
    dias INTEGER NOT NULL, -- Días equivalentes para cálculos
    descripcion TEXT
);

-- Tabla de Pagos Programados (NORMALIZADA)
CREATE TABLE IF NOT EXISTS pagos_programados (
    id SERIAL PRIMARY KEY,
    concepto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    monto_base DECIMAL(12, 2) NOT NULL, -- Renombrado para claridad
    categoria_id INTEGER NOT NULL REFERENCES categorias_transacciones(id),
    frecuencia_id INTEGER NOT NULL REFERENCES frecuencias_pago(id),
    dia_pago INTEGER CHECK (dia_pago BETWEEN 1 AND 31),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    proveedor_id INTEGER REFERENCES contactos_financieros(id),
    metodo_pago_preferido_id INTEGER REFERENCES metodos_pago(id),
    dias_anticipacion_recordatorio INTEGER DEFAULT 3,
    activo BOOLEAN DEFAULT true,
    usuario_responsable_id INTEGER NOT NULL REFERENCES usuarios(id),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Estados de Pago (NUEVA - Normalización)
CREATE TABLE IF NOT EXISTS estados_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE CHECK (nombre IN ('pendiente', 'proximo', 'pagado', 'atrasado', 'cancelado')),
    descripcion TEXT,
    color VARCHAR(20),
    prioridad INTEGER
);

-- Tabla de Instancias de Pagos (NORMALIZADA)
CREATE TABLE IF NOT EXISTS instancias_pagos (
    id SERIAL PRIMARY KEY,
    pago_programado_id INTEGER NOT NULL REFERENCES pagos_programados(id) ON DELETE CASCADE,
    transaccion_id INTEGER REFERENCES transacciones_financieras(id),
    fecha_vencimiento DATE NOT NULL,
    monto DECIMAL(12, 2) NOT NULL, -- Puede diferir del monto_base por ajustes
    monto_ajuste DECIMAL(12, 2) DEFAULT 0, -- NUEVO: Registro explícito de ajustes
    motivo_ajuste TEXT, -- NUEVO: Razón del ajuste (inflación, descuento, etc.)
    estado_id INTEGER DEFAULT 1 REFERENCES estados_pago(id),
    fecha_pago DATE,
    recordatorio_enviado BOOLEAN DEFAULT false,
    fecha_recordatorio TIMESTAMP,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Presupuestos Mensuales (NORMALIZADA - Sin campos calculados)
CREATE TABLE IF NOT EXISTS presupuestos_mensuales (
    id SERIAL PRIMARY KEY,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    categoria_id INTEGER NOT NULL REFERENCES categorias_transacciones(id),
    monto_presupuestado DECIMAL(12, 2) NOT NULL,
    -- ELIMINADO: monto_gastado (se calcula con query)
    -- ELIMINADO: porcentaje_utilizado (se calcula con query)
    alerta_enviada BOOLEAN DEFAULT false,
    umbral_alerta DECIMAL(5, 2) DEFAULT 80.00, -- NUEVO: Porcentaje para alertas
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(anio, mes, categoria_id)
);

-- Tabla de Predicciones (SOLO METADATA - Sin datos calculados almacenados)
CREATE TABLE IF NOT EXISTS configuracion_predicciones (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER NOT NULL REFERENCES categorias_transacciones(id),
    concepto_base VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    min_transacciones_requeridas INTEGER DEFAULT 3,
    ventana_dias_analisis INTEGER DEFAULT 180,
    umbral_confianza_minimo DECIMAL(3, 2) DEFAULT 0.60,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(categoria_id, concepto_base)
);

-- ============================================
-- VISTAS PARA OBTENER DATOS CALCULADOS
-- (Reemplazan las tablas desnormalizadas)
-- ============================================

-- Vista para Presupuestos con gastos calculados
CREATE OR REPLACE VIEW vista_presupuestos_con_gastos AS
SELECT 
    p.id,
    p.anio,
    p.mes,
    p.categoria_id,
    c.nombre as categoria_nombre,
    p.monto_presupuestado,
    COALESCE(SUM(CASE 
        WHEN EXTRACT(YEAR FROM t.fecha_transaccion) = p.anio 
        AND EXTRACT(MONTH FROM t.fecha_transaccion) = p.mes 
        THEN t.monto 
        ELSE 0 
    END), 0) as monto_gastado,
    ROUND(
        (COALESCE(SUM(CASE 
            WHEN EXTRACT(YEAR FROM t.fecha_transaccion) = p.anio 
            AND EXTRACT(MONTH FROM t.fecha_transaccion) = p.mes 
            THEN t.monto 
            ELSE 0 
        END), 0) / p.monto_presupuestado * 100), 2
    ) as porcentaje_utilizado,
    p.umbral_alerta,
    p.alerta_enviada
FROM presupuestos_mensuales p
LEFT JOIN categorias_transacciones c ON p.categoria_id = c.id
LEFT JOIN transacciones_financieras t ON t.categoria_id = p.categoria_id
    AND t.estado_id = 1 -- Solo transacciones completadas
GROUP BY p.id, p.anio, p.mes, p.categoria_id, c.nombre, p.monto_presupuestado, p.umbral_alerta, p.alerta_enviada;

-- Vista para Predicciones calculadas en tiempo real
CREATE OR REPLACE VIEW vista_predicciones_gastos AS
SELECT 
    cp.id as configuracion_id,
    cp.categoria_id,
    c.nombre as categoria_nombre,
    cp.concepto_base,
    COUNT(t.id) as total_transacciones_analizadas,
    AVG(t.monto) as monto_promedio,
    MIN(t.monto) as monto_minimo,
    MAX(t.monto) as monto_maximo,
    AVG(EXTRACT(DAY FROM t.fecha_transaccion - LAG(t.fecha_transaccion) OVER (
        PARTITION BY t.categoria_id, t.concepto 
        ORDER BY t.fecha_transaccion
    )))::INTEGER as frecuencia_dias_promedio,
    MAX(t.fecha_transaccion) as ultima_transaccion_fecha,
    MAX(t.fecha_transaccion) + 
        AVG(EXTRACT(DAY FROM t.fecha_transaccion - LAG(t.fecha_transaccion) OVER (
            PARTITION BY t.categoria_id, t.concepto 
            ORDER BY t.fecha_transaccion
        )))::INTEGER as proxima_fecha_sugerida,
    CASE 
        WHEN COUNT(t.id) >= 10 THEN 0.90
        WHEN COUNT(t.id) >= 5 THEN 0.75
        WHEN COUNT(t.id) >= 3 THEN 0.60
        ELSE 0.00
    END as confianza_prediccion,
    MODE() WITHIN GROUP (ORDER BY cf.nombre) as proveedor_frecuente
FROM configuracion_predicciones cp
JOIN categorias_transacciones c ON cp.categoria_id = c.id
LEFT JOIN transacciones_financieras t ON t.categoria_id = cp.categoria_id
    AND t.concepto ILIKE '%' || cp.concepto_base || '%'
    AND t.fecha_transaccion >= CURRENT_DATE - (cp.ventana_dias_analisis || ' days')::INTERVAL
    AND t.estado_id = 1
LEFT JOIN contactos_financieros cf ON t.proveedor_id = cf.id
WHERE cp.activo = true
GROUP BY cp.id, cp.categoria_id, c.nombre, cp.concepto_base
HAVING COUNT(t.id) >= cp.min_transacciones_requeridas;

-- Vista para obtener el tipo de una transacción (reemplaza el campo tipo)
CREATE OR REPLACE VIEW vista_transacciones_completas AS
SELECT 
    t.*,
    c.tipo as tipo_transaccion,
    c.nombre as categoria_nombre,
    mp.nombre as metodo_pago_nombre,
    et.nombre as estado_nombre,
    u.username as usuario_registro,
    prov.nombre as proveedor_nombre,
    benef.nombre as beneficiario_nombre
FROM transacciones_financieras t
JOIN categorias_transacciones c ON t.categoria_id = c.id
LEFT JOIN metodos_pago mp ON t.metodo_pago_id = mp.id
LEFT JOIN estados_transaccion et ON t.estado_id = et.id
LEFT JOIN usuarios u ON t.usuario_registro_id = u.id
LEFT JOIN contactos_financieros prov ON t.proveedor_id = prov.id
LEFT JOIN contactos_financieros benef ON t.beneficiario_id = benef.id;

-- ============================================
-- DATOS INICIALES PARA TABLAS DE CATÁLOGO
-- ============================================

-- Insertar métodos de pago
INSERT INTO metodos_pago (nombre, descripcion) VALUES
('Efectivo', 'Pago en efectivo'),
('Transferencia', 'Transferencia bancaria'),
('Cheque', 'Pago con cheque'),
('Tarjeta de Crédito', 'Pago con tarjeta de crédito'),
('Tarjeta de Débito', 'Pago con tarjeta de débito'),
('Depósito', 'Depósito bancario'),
('PayPal', 'Pago por PayPal'),
('Otro', 'Otro método de pago')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar estados de transacción
INSERT INTO estados_transaccion (id, nombre, descripcion, color) VALUES
(1, 'completada', 'Transacción completada', '#4CAF50'),
(2, 'pendiente', 'Transacción pendiente', '#FFC107'),
(3, 'cancelada', 'Transacción cancelada', '#F44336')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar frecuencias de pago
INSERT INTO frecuencias_pago (nombre, dias, descripcion) VALUES
('diario', 1, 'Frecuencia diaria'),
('semanal', 7, 'Cada semana'),
('quincenal', 15, 'Cada 15 días'),
('mensual', 30, 'Cada mes'),
('bimestral', 60, 'Cada 2 meses'),
('trimestral', 90, 'Cada 3 meses'),
('semestral', 180, 'Cada 6 meses'),
('anual', 365, 'Cada año')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar estados de pago
INSERT INTO estados_pago (id, nombre, descripcion, color, prioridad) VALUES
(1, 'pendiente', 'Pago pendiente', '#9E9E9E', 3),
(2, 'proximo', 'Pago próximo a vencer', '#FF9800', 2),
(3, 'pagado', 'Pago completado', '#4CAF50', 5),
(4, 'atrasado', 'Pago atrasado', '#F44336', 1),
(5, 'cancelado', 'Pago cancelado', '#607D8B', 4)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar categorías (igual que antes)
INSERT INTO categorias_transacciones (nombre, tipo, descripcion, icono, color, es_recurrente, frecuencia_estimada) VALUES
-- Egresos
('Alimentos', 'egreso', 'Compra de alimentos y comestibles', 'shopping-cart', '#FF6B6B', true, 7),
('Medicamentos', 'egreso', 'Compra de medicamentos y suministros médicos', 'pill', '#4ECDC4', true, 30),
('Servicios Básicos', 'egreso', 'Luz, agua, teléfono, internet', 'zap', '#FFE66D', true, 30),
('Mantenimiento', 'egreso', 'Reparaciones y mantenimiento de instalaciones', 'wrench', '#95E1D3', false, 90),
('Limpieza', 'egreso', 'Productos de limpieza e higiene', 'droplet', '#A8E6CF', true, 15),
('Personal', 'egreso', 'Salarios y compensaciones', 'users', '#C7CEEA', true, 15),
('Transporte', 'egreso', 'Gasolina, transporte de residentes', 'truck', '#FFDAB9', false, 30),
('Equipamiento', 'egreso', 'Compra de equipos y mobiliario', 'package', '#B4A7D6', false, 180),
('Servicios Profesionales', 'egreso', 'Honorarios médicos, contables, legales', 'briefcase', '#D4A5A5', false, 30),
('Otros Gastos', 'egreso', 'Gastos varios no categorizados', 'more-horizontal', '#CCCCCC', false, null),
-- Ingresos
('Donaciones', 'ingreso', 'Donaciones recibidas', 'heart', '#4CAF50', false, null),
('Mensualidades', 'ingreso', 'Pagos de familiares por residentes', 'dollar-sign', '#2196F3', true, 30),
('Subsidios', 'ingreso', 'Subsidios gubernamentales', 'award', '#9C27B0', false, 30),
('Eventos', 'ingreso', 'Ingresos por eventos y actividades', 'calendar', '#FF9800', false, null),
('Otros Ingresos', 'ingreso', 'Ingresos varios', 'trending-up', '#607D8B', false, null)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones_financieras(fecha_transaccion DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_categoria ON transacciones_financieras(categoria_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON transacciones_financieras(estado_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_proveedor ON transacciones_financieras(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_vencimiento ON instancias_pagos(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON instancias_pagos(estado_id);
CREATE INDEX IF NOT EXISTS idx_contactos_tipo ON contactos_financieros(tipo);

-- ============================================
-- TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS trg_transacciones_updated_at ON transacciones_financieras;
CREATE TRIGGER trg_transacciones_updated_at
    BEFORE UPDATE ON transacciones_financieras
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trg_pagos_programados_updated_at ON pagos_programados;
CREATE TRIGGER trg_pagos_programados_updated_at
    BEFORE UPDATE ON pagos_programados
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trg_instancias_pagos_updated_at ON instancias_pagos;
CREATE TRIGGER trg_instancias_pagos_updated_at
    BEFORE UPDATE ON instancias_pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trg_contactos_updated_at ON contactos_financieros;
CREATE TRIGGER trg_contactos_updated_at
    BEFORE UPDATE ON contactos_financieros
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE transacciones_financieras IS 'Registro de transacciones - 3NF: tipo se obtiene via categoria_id';
COMMENT ON TABLE presupuestos_mensuales IS 'Presupuestos - 3NF: gastos se calculan en vista';
COMMENT ON TABLE configuracion_predicciones IS 'Configuración de predicciones - 3NF: cálculos en vista';
COMMENT ON VIEW vista_transacciones_completas IS 'Vista desnormalizada para queries - incluye tipo de transacción';
COMMENT ON VIEW vista_presupuestos_con_gastos IS 'Vista con gastos calculados en tiempo real desde transacciones';
COMMENT ON VIEW vista_predicciones_gastos IS 'Vista con predicciones calculadas en tiempo real del historial';
