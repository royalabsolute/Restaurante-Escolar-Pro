-- Configuración de la Base de Datos - Restaurante Escolar
-- Solo estructura (Schema) para despliegue limpio

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

-- ------------------------------------------------------
-- Estructura de tablas
-- ------------------------------------------------------

-- Tabla: usuarios
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `cedula` varchar(20) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `matricula` varchar(50) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','secretaria','coordinador_estudiantil','coordinador_convivencia','docente','psicorientacion','alfabetizador','estudiante','acudiente','invitado','escaner') DEFAULT NULL,
  `estado` enum('pendiente','validado','rechazado','suspendido') DEFAULT 'pendiente',
  `motivo_rechazo` text DEFAULT NULL,
  `motivo_suspension` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_login` timestamp NULL DEFAULT NULL,
  `token_recuperacion` varchar(255) DEFAULT NULL,
  `token_expiracion` timestamp NULL DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `access_config` longtext DEFAULT NULL,
  `is_deletable` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `matricula` (`matricula`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: estudiantes
DROP TABLE IF EXISTS `estudiantes`;
CREATE TABLE `estudiantes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `matricula` varchar(50) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `grupo_academico_id` int(11) DEFAULT NULL,
  `estrato` int(11) NOT NULL,
  `codigo_qr` varchar(255) DEFAULT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL,
  `faltas_consecutivas` int(11) DEFAULT 0,
  `grupo_etnico` enum('ninguno','indigena','afrodescendiente','rom','raizal','palenquero') DEFAULT 'ninguno',
  `es_desplazado` tinyint(1) DEFAULT 0,
  `fecha_ingreso` date DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `prioridad` int(11) DEFAULT 5,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  UNIQUE KEY `codigo_qr` (`codigo_qr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: grupos_academicos
DROP TABLE IF EXISTS `grupos_academicos`;
CREATE TABLE `grupos_academicos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `jornada` enum('Mañana','Tarde','Completa') NOT NULL DEFAULT 'Mañana',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `director_grupo_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: asistencias
DROP TABLE IF EXISTS `asistencias`;
CREATE TABLE `asistencias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `estudiante_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora_entrada` time NOT NULL,
  `metodo_registro` enum('escaner','camara','manual') NOT NULL,
  `registrado_por` int(11) NOT NULL,
  `validado` tinyint(1) DEFAULT 1,
  `observaciones` text DEFAULT NULL,
  `rechazado` tinyint(1) DEFAULT 0,
  `motivo_rechazo` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_asistencia` (`estudiante_id`,`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: acudientes
DROP TABLE IF EXISTS `acudientes`;
CREATE TABLE `acudientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `estudiante_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `estudiante_id` (`estudiante_id`),
  UNIQUE KEY `cedula` (`cedula`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: configuracion_institucional
DROP TABLE IF EXISTS `configuracion_institucional`;
CREATE TABLE `configuracion_institucional` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_institucion` varchar(255) NOT NULL DEFAULT 'Institución Informativa',
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `nit` varchar(20) DEFAULT NULL,
  `rector` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `limite_cupos_restaurante` int(11) NOT NULL DEFAULT 270,
  `horario_valido_inicio` time NOT NULL DEFAULT '11:00:00',
  `horario_valido_fin` time NOT NULL DEFAULT '15:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: auditoria
DROP TABLE IF EXISTS `auditoria`;
CREATE TABLE `auditoria` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `tabla_afectada` varchar(50) NOT NULL,
  `accion` enum('CREATE','UPDATE','DELETE') NOT NULL,
  `registro_id` int(11) DEFAULT NULL,
  `datos_anteriores` longtext DEFAULT NULL,
  `datos_nuevos` longtext DEFAULT NULL,
  `fecha_accion` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------
-- Datos iniciales obligatorios
-- ------------------------------------------------------

INSERT INTO `usuarios` (`id`, `email`, `password`, `rol`, `estado`) VALUES
(1, 'admin@restaurante.com', '$2b$12$UpZVxPsDwtB2BZTLY9N/cOs/6qlDdYpxHVYAdXL6NcECAn5BJqJvq', 'admin', 'validado');
-- Nota: La contraseña predeterminada del admin debe ser cambiada al iniciar.

INSERT INTO `configuracion_institucional` (`id`, `nombre_institucion`, `limite_cupos_restaurante`) VALUES
(1, 'Institución Educativa de Prueba', 270);

-- Foreign Keys
ALTER TABLE `estudiantes` ADD CONSTRAINT `fk_est_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
ALTER TABLE `estudiantes` ADD CONSTRAINT `fk_est_grupo_acad` FOREIGN KEY (`grupo_academico_id`) REFERENCES `grupos_academicos` (`id`) ON DELETE SET NULL;
ALTER TABLE `acudientes` ADD CONSTRAINT `fk_acudiente_est` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE;
ALTER TABLE `asistencias` ADD CONSTRAINT `fk_asist_est` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
