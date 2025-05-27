-- Actualización del esquema de usuarios para soportar cambio de contraseña obligatorio
-- y autorización de nuevos usuarios administradores

-- Agregar columna para controlar si el usuario debe cambiar su contraseña en el primer inicio
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS cambio_password_requerido BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ultima_actualizacion_password TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS intentos_login INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- Crear tabla para solicitudes de autorización de administradores
CREATE TABLE IF NOT EXISTS solicitudes_admin (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    solicitante_id INTEGER REFERENCES usuarios(id),
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    mensaje TEXT
);

-- Crear tabla para aprobaciones de administradores
CREATE TABLE IF NOT EXISTS aprobaciones_admin (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER NOT NULL REFERENCES solicitudes_admin(id) ON DELETE CASCADE,
    admin_id INTEGER NOT NULL REFERENCES usuarios(id),
    aprobado BOOLEAN NOT NULL,
    fecha_respuesta TIMESTAMP NOT NULL DEFAULT NOW(),
    comentario TEXT
);

-- Crear una función para verificar si una solicitud ha sido aprobada por todos los administradores
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

-- Crear un trigger para activar esta función cuando se inserta una nueva aprobación
CREATE TRIGGER trigger_verificar_aprobacion_admin
AFTER INSERT ON aprobaciones_admin
FOR EACH ROW
EXECUTE FUNCTION verificar_aprobacion_administrador();
