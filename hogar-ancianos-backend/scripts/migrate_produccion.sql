-- ==============================================
-- SCRIPT DE MIGRACIÓN PARA PRODUCCIÓN (RENDER)
-- ==============================================
-- Este script actualiza el esquema de la base de datos
-- con todas las tablas y columnas faltantes

BEGIN;

-- 1. Crear tabla signos_vitales si no existe
CREATE TABLE IF NOT EXISTS signos_vitales (
    id SERIAL PRIMARY KEY,
    anciano_id INTEGER NOT NULL REFERENCES ancianos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    temperatura DECIMAL(4,1),
    presion_arterial VARCHAR(10),
    frecuencia_cardiaca INTEGER,
    frecuencia_respiratoria INTEGER,
    saturacion_oxigeno INTEGER,
    glucosa INTEGER,
    peso DECIMAL(5,2),
    observaciones TEXT,
    usuario_id INTEGER REFERENCES usuarios(id)
);

-- 2. Agregar columnas faltantes a la tabla usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS cambio_password_requerido BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ultima_actualizacion_password TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS intentos_login INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 3. Crear tabla solicitudes_admin si no existe
CREATE TABLE IF NOT EXISTS solicitudes_admin (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    solicitante_id INTEGER REFERENCES usuarios(id),
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    mensaje TEXT
);

-- 4. Crear tabla aprobaciones_admin si no existe
CREATE TABLE IF NOT EXISTS aprobaciones_admin (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER NOT NULL REFERENCES solicitudes_admin(id) ON DELETE CASCADE,
    admin_id INTEGER NOT NULL REFERENCES usuarios(id),
    aprobado BOOLEAN NOT NULL,
    fecha_respuesta TIMESTAMP NOT NULL DEFAULT NOW(),
    comentario TEXT
);

-- 5. Crear función para verificar aprobación de administrador
CREATE OR REPLACE FUNCTION verificar_aprobacion_administrador() RETURNS TRIGGER AS $$
DECLARE
    total_admins INTEGER;
    total_approvals INTEGER;
BEGIN
    -- Contar cuántos administradores hay en el sistema (excluyendo el usuario solicitante)
    SELECT COUNT(*) INTO total_admins FROM usuarios 
    WHERE rol = 'admin' AND activo = true AND id != NEW.usuario_id;
    
    -- Contar cuántas aprobaciones tiene la solicitud
    SELECT COUNT(*) INTO total_approvals FROM aprobaciones_admin
    WHERE solicitud_id = NEW.id AND aprobado = true;
    
    -- Si todas las aprobaciones están, aprobar la solicitud y actualizar el rol del usuario
    IF total_approvals >= total_admins THEN
        UPDATE solicitudes_admin SET estado = 'aprobado' WHERE id = NEW.id;
        UPDATE usuarios SET rol = 'admin' WHERE id = NEW.usuario_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_verificar_aprobacion_admin ON aprobaciones_admin;
CREATE TRIGGER trigger_verificar_aprobacion_admin
AFTER INSERT ON aprobaciones_admin
FOR EACH ROW
EXECUTE FUNCTION verificar_aprobacion_administrador();

-- 7. Actualizar usuarios existentes (no requerir cambio de password para usuarios ya creados)
UPDATE usuarios SET cambio_password_requerido = FALSE WHERE cambio_password_requerido IS NULL;

-- 8. Actualizar created_at para usuarios existentes que no lo tienen
UPDATE usuarios SET created_at = fecha_registro WHERE created_at IS NULL AND fecha_registro IS NOT NULL;
UPDATE usuarios SET created_at = NOW() WHERE created_at IS NULL;

COMMIT;

-- Verificar que todo se creó correctamente
SELECT 'Migración completada exitosamente' AS status;
