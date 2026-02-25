-- Actualización de restricción de roles
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check 
  CHECK (rol IN ('admin', 'medico', 'enfermero', 'cuidador', 'secretaria'));
