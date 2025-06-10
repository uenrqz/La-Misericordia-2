-- Añadir campo de roles adicionales a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS roles_adicionales TEXT DEFAULT '[]';

-- Actualizar el usuario u.enrqz para darle roles adicionales
UPDATE usuarios SET 
  roles_adicionales = '["medico", "enfermero"]'
WHERE username = 'u.enrqz';

-- Asegurarse de que la restricción de roles sigue permitiendo los valores necesarios
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check 
  CHECK (rol IN ('admin', 'medico', 'cuidador', 'secretaria', 'enfermero'));
