-- Añadir campo de foto a la tabla ancianos
ALTER TABLE ancianos
ADD COLUMN IF NOT EXISTS foto_url VARCHAR(255);
