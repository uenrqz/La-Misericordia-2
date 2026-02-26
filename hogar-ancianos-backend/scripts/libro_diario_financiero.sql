-- ============================================
-- SISTEMA DE LIBRO DIARIO FINANCIERO
-- Control de Ingresos, Egresos y Pagos
-- ============================================

-- Tabla de Categorías de Transacciones
CREATE TABLE IF NOT EXISTS categorias_transacciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    descripcion TEXT,
    icono VARCHAR(50), -- Para el frontend (ej: 'shopping-cart', 'food', etc.)
    color VARCHAR(20), -- Color hexadecimal para visualización
    es_recurrente BOOLEAN DEFAULT false,
    frecuencia_estimada INTEGER, -- Días estimados entre transacciones
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Transacciones Financieras (Libro Diario)
CREATE TABLE IF NOT EXISTS transacciones_financieras (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    categoria_id INTEGER REFERENCES categorias_transacciones(id),
    concepto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
    fecha_transaccion DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago VARCHAR(50), -- efectivo, transferencia, cheque, tarjeta
    referencia VARCHAR(100), -- número de factura, recibo, etc.
    comprobante_url TEXT, -- URL del comprobante escaneado/foto
    proveedor VARCHAR(200), -- Para egresos: nombre del proveedor
    beneficiario VARCHAR(200), -- Para ingresos: quien realizó el pago
    usuario_registro_id INTEGER REFERENCES usuarios(id),
    es_recurrente BOOLEAN DEFAULT false,
    frecuencia_dias INTEGER, -- Cada cuántos días se repite
    proxima_sugerencia DATE, -- Fecha sugerida para próxima transacción similar
    notas TEXT,
    estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('completada', 'pendiente', 'cancelada')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pagos Recurrentes/Programados
CREATE TABLE IF NOT EXISTS pagos_programados (
    id SERIAL PRIMARY KEY,
    concepto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(12, 2) NOT NULL,
    categoria_id INTEGER REFERENCES categorias_transacciones(id),
    frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('diario', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual')),
    dia_pago INTEGER, -- Día del mes para pagos mensuales (1-31)
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE, -- NULL si es indefinido
    proveedor VARCHAR(200),
    metodo_pago_preferido VARCHAR(50),
    dias_anticipacion_recordatorio INTEGER DEFAULT 3,
    activo BOOLEAN DEFAULT true,
    ultimo_pago_generado DATE,
    usuario_responsable_id INTEGER REFERENCES usuarios(id),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Instancias de Pagos (cada pago individual)
CREATE TABLE IF NOT EXISTS instancias_pagos (
    id SERIAL PRIMARY KEY,
    pago_programado_id INTEGER REFERENCES pagos_programados(id) ON DELETE CASCADE,
    transaccion_id INTEGER REFERENCES transacciones_financieras(id), -- NULL si aún no se ha pagado
    fecha_vencimiento DATE NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'proximo', 'pagado', 'atrasado', 'cancelado')),
    fecha_pago DATE, -- Fecha real del pago
    recordatorio_enviado BOOLEAN DEFAULT false,
    fecha_recordatorio TIMESTAMP,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Predicciones/Sugerencias Inteligentes
CREATE TABLE IF NOT EXISTS predicciones_gastos (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER REFERENCES categorias_transacciones(id),
    concepto_sugerido VARCHAR(255),
    monto_promedio DECIMAL(12, 2),
    monto_minimo DECIMAL(12, 2),
    monto_maximo DECIMAL(12, 2),
    frecuencia_dias_promedio INTEGER,
    ultima_transaccion_fecha DATE,
    proxima_fecha_sugerida DATE,
    confianza_prediccion DECIMAL(3, 2), -- 0.00 a 1.00
    total_transacciones_analizadas INTEGER,
    proveedor_frecuente VARCHAR(200),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Presupuestos Mensuales
CREATE TABLE IF NOT EXISTS presupuestos_mensuales (
    id SERIAL PRIMARY KEY,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    categoria_id INTEGER REFERENCES categorias_transacciones(id),
    monto_presupuestado DECIMAL(12, 2) NOT NULL,
    monto_gastado DECIMAL(12, 2) DEFAULT 0,
    porcentaje_utilizado DECIMAL(5, 2) DEFAULT 0,
    alerta_enviada BOOLEAN DEFAULT false,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(anio, mes, categoria_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones_financieras(fecha_transaccion DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones_financieras(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_categoria ON transacciones_financieras(categoria_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON transacciones_financieras(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_vencimiento ON instancias_pagos(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON instancias_pagos(estado);
CREATE INDEX IF NOT EXISTS idx_predicciones_fecha_sugerida ON predicciones_gastos(proxima_fecha_sugerida);

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
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

-- Función para calcular predicciones basadas en historial
CREATE OR REPLACE FUNCTION calcular_predicciones_gastos()
RETURNS void AS $$
DECLARE
    v_categoria RECORD;
    v_concepto RECORD;
BEGIN
    -- Limpiar predicciones antiguas
    DELETE FROM predicciones_gastos WHERE ultima_transaccion_fecha < CURRENT_DATE - INTERVAL '90 days';
    
    -- Calcular predicciones por categoría y concepto
    FOR v_categoria IN 
        SELECT DISTINCT categoria_id, concepto
        FROM transacciones_financieras
        WHERE tipo = 'egreso' 
        AND fecha_transaccion >= CURRENT_DATE - INTERVAL '180 days'
        GROUP BY categoria_id, concepto
        HAVING COUNT(*) >= 3
    LOOP
        -- Insertar o actualizar predicción
        INSERT INTO predicciones_gastos (
            categoria_id,
            concepto_sugerido,
            monto_promedio,
            monto_minimo,
            monto_maximo,
            frecuencia_dias_promedio,
            ultima_transaccion_fecha,
            proxima_fecha_sugerida,
            confianza_prediccion,
            total_transacciones_analizadas,
            proveedor_frecuente
        )
        SELECT 
            v_categoria.categoria_id,
            v_categoria.concepto,
            AVG(monto)::DECIMAL(12,2),
            MIN(monto)::DECIMAL(12,2),
            MAX(monto)::DECIMAL(12,2),
            AVG(EXTRACT(DAY FROM fecha_transaccion - LAG(fecha_transaccion) OVER (ORDER BY fecha_transaccion)))::INTEGER,
            MAX(fecha_transaccion),
            MAX(fecha_transaccion) + AVG(EXTRACT(DAY FROM fecha_transaccion - LAG(fecha_transaccion) OVER (ORDER BY fecha_transaccion)))::INTEGER,
            CASE 
                WHEN COUNT(*) >= 10 THEN 0.90
                WHEN COUNT(*) >= 5 THEN 0.75
                ELSE 0.60
            END,
            COUNT(*),
            MODE() WITHIN GROUP (ORDER BY proveedor)
        FROM transacciones_financieras
        WHERE categoria_id = v_categoria.categoria_id
        AND concepto = v_categoria.concepto
        AND tipo = 'egreso'
        AND fecha_transaccion >= CURRENT_DATE - INTERVAL '180 days'
        ON CONFLICT (categoria_id, concepto_sugerido) 
        DO UPDATE SET
            monto_promedio = EXCLUDED.monto_promedio,
            monto_minimo = EXCLUDED.monto_minimo,
            monto_maximo = EXCLUDED.monto_maximo,
            frecuencia_dias_promedio = EXCLUDED.frecuencia_dias_promedio,
            ultima_transaccion_fecha = EXCLUDED.ultima_transaccion_fecha,
            proxima_fecha_sugerida = EXCLUDED.proxima_fecha_sugerida,
            confianza_prediccion = EXCLUDED.confianza_prediccion,
            total_transacciones_analizadas = EXCLUDED.total_transacciones_analizadas,
            proveedor_frecuente = EXCLUDED.proveedor_frecuente;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para generar instancias de pagos programados
CREATE OR REPLACE FUNCTION generar_instancias_pagos()
RETURNS void AS $$
DECLARE
    v_pago RECORD;
    v_fecha_siguiente DATE;
BEGIN
    FOR v_pago IN 
        SELECT * FROM pagos_programados WHERE activo = true
    LOOP
        -- Calcular siguiente fecha de pago
        v_fecha_siguiente := COALESCE(v_pago.ultimo_pago_generado, v_pago.fecha_inicio);
        
        WHILE v_fecha_siguiente <= CURRENT_DATE + INTERVAL '60 days' LOOP
            -- Calcular próxima fecha según frecuencia
            v_fecha_siguiente := CASE v_pago.frecuencia
                WHEN 'diario' THEN v_fecha_siguiente + INTERVAL '1 day'
                WHEN 'semanal' THEN v_fecha_siguiente + INTERVAL '7 days'
                WHEN 'quincenal' THEN v_fecha_siguiente + INTERVAL '15 days'
                WHEN 'mensual' THEN v_fecha_siguiente + INTERVAL '1 month'
                WHEN 'bimestral' THEN v_fecha_siguiente + INTERVAL '2 months'
                WHEN 'trimestral' THEN v_fecha_siguiente + INTERVAL '3 months'
                WHEN 'semestral' THEN v_fecha_siguiente + INTERVAL '6 months'
                WHEN 'anual' THEN v_fecha_siguiente + INTERVAL '1 year'
            END;
            
            -- Insertar instancia si no existe
            INSERT INTO instancias_pagos (
                pago_programado_id,
                fecha_vencimiento,
                monto,
                estado
            )
            VALUES (
                v_pago.id,
                v_fecha_siguiente,
                v_pago.monto,
                CASE 
                    WHEN v_fecha_siguiente <= CURRENT_DATE THEN 'atrasado'
                    WHEN v_fecha_siguiente <= CURRENT_DATE + v_pago.dias_anticipacion_recordatorio THEN 'proximo'
                    ELSE 'pendiente'
                END
            )
            ON CONFLICT DO NOTHING;
            
            -- Actualizar último pago generado
            UPDATE pagos_programados 
            SET ultimo_pago_generado = v_fecha_siguiente 
            WHERE id = v_pago.id;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insertar categorías predeterminadas
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

-- Crear índice único para evitar duplicados en predicciones
CREATE UNIQUE INDEX IF NOT EXISTS idx_predicciones_categoria_concepto 
ON predicciones_gastos(categoria_id, concepto_sugerido);

-- Vista para dashboard financiero
CREATE OR REPLACE VIEW vista_resumen_financiero AS
SELECT 
    DATE_TRUNC('month', fecha_transaccion) as mes,
    tipo,
    COUNT(*) as total_transacciones,
    SUM(monto) as monto_total,
    AVG(monto) as monto_promedio,
    MAX(monto) as monto_maximo,
    MIN(monto) as monto_minimo
FROM transacciones_financieras
WHERE estado = 'completada'
GROUP BY DATE_TRUNC('month', fecha_transaccion), tipo
ORDER BY mes DESC, tipo;

-- Vista para pagos próximos y atrasados
CREATE OR REPLACE VIEW vista_pagos_atencion AS
SELECT 
    ip.*,
    pp.concepto,
    pp.proveedor,
    pp.frecuencia,
    CURRENT_DATE - ip.fecha_vencimiento as dias_atraso,
    ip.fecha_vencimiento - CURRENT_DATE as dias_hasta_vencimiento
FROM instancias_pagos ip
JOIN pagos_programados pp ON ip.pago_programado_id = pp.id
WHERE ip.estado IN ('pendiente', 'proximo', 'atrasado')
AND pp.activo = true
ORDER BY ip.fecha_vencimiento ASC;

COMMENT ON TABLE transacciones_financieras IS 'Registro completo de todas las transacciones financieras (ingresos y egresos)';
COMMENT ON TABLE pagos_programados IS 'Pagos recurrentes configurados por el administrador';
COMMENT ON TABLE instancias_pagos IS 'Instancias individuales de cada pago programado';
COMMENT ON TABLE predicciones_gastos IS 'Sugerencias inteligentes basadas en patrones históricos';
COMMENT ON TABLE categorias_transacciones IS 'Categorías para clasificar transacciones';
COMMENT ON TABLE presupuestos_mensuales IS 'Presupuestos planificados por categoría y mes';
