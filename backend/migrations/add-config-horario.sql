ALTER TABLE configuracion_institucional
  ADD COLUMN IF NOT EXISTS horario_valido_inicio TIME NOT NULL DEFAULT '11:00:00' AFTER limite_cupos_restaurante;

ALTER TABLE configuracion_institucional
  ADD COLUMN IF NOT EXISTS horario_valido_fin TIME NOT NULL DEFAULT '15:00:00' AFTER horario_valido_inicio;

UPDATE configuracion_institucional
SET
  horario_valido_inicio = COALESCE(horario_valido_inicio, '11:00:00'),
  horario_valido_fin = COALESCE(horario_valido_fin, '15:00:00');
