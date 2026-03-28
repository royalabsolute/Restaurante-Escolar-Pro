-- ============================================================
-- MIGRACIÓN: Rediseño Alfabetizadores → Cuenta Universal Escáner
-- Fecha: 2026-02-22
-- ============================================================

-- 1. Tabla para el QR único de suplente
CREATE TABLE IF NOT EXISTS qr_suplente (
  id INT PRIMARY KEY AUTO_INCREMENT,
  codigo_qr VARCHAR(255) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE,
  generado_por INT NULL,
  fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_invalidacion DATETIME NULL,
  CONSTRAINT fk_qr_suplente_usuario FOREIGN KEY (generado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla para conteo diario de suplentes (cada escaneo = 1 fila)
CREATE TABLE IF NOT EXISTS conteo_suplentes_diario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fecha DATE NOT NULL,
  hora_registro TIME NOT NULL,
  registrado_por INT NULL,
  qr_suplente_id INT NULL,
  INDEX idx_conteo_fecha (fecha),
  CONSTRAINT fk_conteo_usuario FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_conteo_qr FOREIGN KEY (qr_suplente_id) REFERENCES qr_suplente(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Crear usuario universal de escáner
-- Contraseña: escaner2024 (hash bcrypt con 12 rounds)
-- El hash se generará desde el backend con un script de seed
INSERT INTO usuarios (email, password, matricula, rol, estado, fecha_registro)
SELECT 'escaner@restaurante.local', 
       '$2b$12$placeholder_will_be_set_by_seed', 
       'ESCANER-001',
       'escaner', 
       'validado',
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE rol = 'escaner');
