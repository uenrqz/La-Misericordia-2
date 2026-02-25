-- Añadir columnas de permisos a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos_medico BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos_enfermero BOOLEAN DEFAULT FALSE;

-- Actualizar la restricción del campo rol para incluir super_admin y enfermero
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check 
  CHECK (rol IN ('admin', 'medico', 'cuidador', 'secretaria', 'super_admin', 'enfermero'));

-- Actualizar usuarios existentes
UPDATE usuarios SET permisos_admin = TRUE WHERE rol = 'admin';
UPDATE usuarios SET permisos_medico = TRUE WHERE rol = 'medico';
UPDATE usuarios SET permisos_enfermero = TRUE WHERE rol = 'enfermero' OR rol = 'cuidador';

-- Actualizar el usuario u.enrqz para darle todos los permisos
UPDATE usuarios SET 
  permisos_admin = TRUE,
  permisos_medico = TRUE,
  permisos_enfermero = TRUE,
  rol = 'super_admin'
WHERE username = 'u.enrqz';
