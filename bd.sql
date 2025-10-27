-- ========================================
-- Configuración inicial opcional
-- ========================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ========================================
-- TABLA: rol
-- ========================================
CREATE TABLE IF NOT EXISTS `rol` (
  `id` BIGINT(16) NOT NULL AUTO_INCREMENT,
  `nombre` CHAR(30) NOT NULL,
  `descripcion` TEXT NULL,
  `prioridad` SMALLINT(16) NOT NULL DEFAULT 10,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rol_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ========================================
-- TABLA: tipo_sensor
-- ========================================
CREATE TABLE IF NOT EXISTS `tipo_sensor` (
  `id` BIGINT(16) NOT NULL AUTO_INCREMENT,
  `nombre` CHAR(120) NOT NULL,
  `descripcion` TEXT NULL,
  `unidad` CHAR(20) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tipo_sensor_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ========================================
-- TABLA: usuarios
-- NOTA: Se cambió `citext` por `VARCHAR` (MySQL no soporta citext)
-- ========================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT(32) NOT NULL AUTO_INCREMENT,
  `nombre` CHAR(80) NOT NULL,
  `apellido` CHAR(80) DEFAULT NULL,
  `correo` VARCHAR(120) NOT NULL,
  `password` TEXT NOT NULL,
  `celular` CHAR(20) DEFAULT NULL,
  `id_rol` BIGINT(16) NOT NULL,
  `ultimo_acceso` TIMESTAMP NULL DEFAULT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_correo_key` (`correo`),
  KEY `usuarios_rol_idx` (`id_rol`),
  CONSTRAINT `usuarios_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ========================================
-- TABLA: tarjetas
-- ========================================
CREATE TABLE IF NOT EXISTS `tarjetas` (
  `id` INT(32) NOT NULL AUTO_INCREMENT,
  `nombre` CHAR(120) NOT NULL,
  `iframe_url` TEXT NOT NULL,
  `id_usuario` INT(32) NOT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tarjetas_usuario_idx` (`id_usuario`),
  CONSTRAINT `tarjetas_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ========================================
-- TABLA: sensores
-- ========================================
CREATE TABLE IF NOT EXISTS `sensores` (
  `id` INT(32) NOT NULL AUTO_INCREMENT,
  `nombre_sensor` CHAR(120) NOT NULL,
  `referencia` CHAR(60) NOT NULL,
  `id_tipo_sensor` BIGINT(16) NOT NULL,
  `id_usuario` INT(32) NOT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sensores_referencia_key` (`referencia`),
  KEY `sensores_tipo_idx` (`id_tipo_sensor`),
  KEY `sensores_usuario_idx` (`id_usuario`),
  UNIQUE KEY `sensores_usuario_nombre_uk` (`id_usuario`,`nombre_sensor`),
  CONSTRAINT `sensores_id_tipo_sensor_fkey` FOREIGN KEY (`id_tipo_sensor`) REFERENCES `tipo_sensor` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `sensores_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ========================================
-- TABLA: medidas
-- ========================================
CREATE TABLE IF NOT EXISTS `medidas` (
  `id` BIGINT(64) NOT NULL AUTO_INCREMENT,
  `id_sensor` INT(32) NOT NULL,
  `id_usuarios` INT(32) NOT NULL,
  `valor_de_la_medida` DOUBLE(12,4) NOT NULL,
  `fecha` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `medidas_sensor_fecha_idx` (`id_sensor`,`fecha`),
  KEY `medidas_usuario_idx` (`id_usuarios`),
  CONSTRAINT `medidas_id_sensor_fkey` FOREIGN KEY (`id_sensor`) REFERENCES `sensores` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `medidas_id_usuarios_fkey` FOREIGN KEY (`id_usuarios`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ========================================
-- TABLA: sesiones
-- NOTA: uuid_generate_v4() no existe en MySQL, se usa UUID() en inserciones
-- ========================================
CREATE TABLE IF NOT EXISTS `sesiones` (
  `id` CHAR(36) NOT NULL,
  `usuario_id` INT(32) NOT NULL,
  `token` TEXT NOT NULL,
  `creado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expira_en` TIMESTAMP NULL DEFAULT NULL,
  `revocado` BOOLEAN NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `sesiones_usuario_idx` (`usuario_id`,`revocado`),
  CONSTRAINT `sesiones_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ========================================
-- DATOS INICIALES
-- ========================================
INSERT INTO `rol` (`id`,`nombre`,`descripcion`,`prioridad`) VALUES
(1,'admin','Acceso completo al panel y a la administración de usuarios/sensores',100),
(2,'usuario','Usuario estándar con acceso a su propio tablero IoT',10)
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `descripcion` = VALUES(`descripcion`),
  `prioridad` = VALUES(`prioridad`);

INSERT INTO `tipo_sensor` (`id`,`nombre`,`descripcion`,`unidad`) VALUES
(1,'DHT11 Temperatura','Sensor digital de temperatura DHT11','°C'),
(2,'Sensor de Gas MQ-7','Detección de monóxido de carbono','ppm'),
(3,'Sensor PIR','Detección de movimiento infrarrojo pasivo',NULL),
(4,'HC-SR04','Sensor ultrasónico de distancia','cm'),
(5,'LDR','Sensor de luminosidad','lux'),
(6,'DHT11 Humedad','Sensor digital de humedad relativa DHT11','%')
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `descripcion` = VALUES(`descripcion`),
  `unidad` = VALUES(`unidad`);

INSERT INTO `usuarios` (`id`,`nombre`,`apellido`,`correo`,`password`,`celular`,`id_rol`,`ultimo_acceso`,`fecha_creacion`) VALUES
(1,'Admin','Principal','admin@infoiot.com','1234567','+57 300 000 0001',1,NOW(),NOW()),
(2,'User','Operador','user@infoiot.com','1234567','+57 300 000 0002',2,NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `apellido` = VALUES(`apellido`),
  `password` = VALUES(`password`),
  `celular` = VALUES(`celular`),
  `id_rol` = VALUES(`id_rol`),
  `ultimo_acceso` = VALUES(`ultimo_acceso`);
