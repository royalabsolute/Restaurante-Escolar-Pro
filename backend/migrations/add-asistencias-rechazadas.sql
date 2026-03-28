-- Migración: Agregar campos para registrar asistencias rechazadas
-- Fecha: 2025-10-30
-- Descripción: Permite registrar cuando un estudiante intenta entrar al restaurante
--              pero su entrada es rechazada por el alfabetizador/docente

USE restaurante_escolar_db;

-- Agregar campo para indicar si la asistencia fue rechazada
ALTER TABLE asistencias 
ADD COLUMN rechazado TINYINT(1) DEFAULT 0 COMMENT '1 si la entrada fue rechazada, 0 si fue aceptada';

-- Agregar campo para el motivo del rechazo
ALTER TABLE asistencias 
ADD COLUMN motivo_rechazo TEXT NULL COMMENT 'Motivo por el cual se rechazó la entrada';

-- Agregar índice para búsquedas rápidas de asistencias rechazadas
ALTER TABLE asistencias 
ADD INDEX idx_rechazado (rechazado, estudiante_id, fecha);

-- Verificar los cambios
DESCRIBE asistencias;

-- Log de la migración
INSERT INTO auditoria (usuario_id, tabla_afectada, accion, descripcion, fecha_accion)
VALUES (1, 'asistencias', 'ALTER_TABLE', 'Agregados campos rechazado y motivo_rechazo para gestión de entradas rechazadas', NOW());

SELECT 'Migración completada exitosamente - Campos rechazado y motivo_rechazo agregados' as resultado;
