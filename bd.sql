-- Crear base de datos (ejecutar desde la conexión postgres)
CREATE DATABASE greentech;

\connect softcul

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE SCHEMA IF NOT EXISTS infoiot;
SET search_path TO infoiot, public;

-- =====================
-- Tabla de roles
-- =====================
CREATE TABLE rol (
  id SMALLSERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  descripcion TEXT,
  prioridad SMALLINT NOT NULL DEFAULT 10
);

INSERT INTO rol (id, nombre, descripcion, prioridad) VALUES
  (1, 'admin', 'Acceso completo al panel y a la administración de usuarios/sensores', 100),
  (2, 'usuario', 'Usuario estándar con acceso a su propio tablero IoT', 10)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- Usuarios
-- =====================
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  apellido VARCHAR(80),
  correo CITEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  celular VARCHAR(20),
  id_rol SMALLINT NOT NULL REFERENCES rol(id),
  ultimo_acceso TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_password_no_vacio CHECK (length(password) > 0)
);

CREATE INDEX usuarios_rol_idx ON usuarios (id_rol);

-- =====================
-- Tipos de sensor
-- =====================
CREATE TABLE tipo_sensor (
  id SMALLSERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  descripcion TEXT,
  unidad VARCHAR(20)
);

INSERT INTO tipo_sensor (id, nombre, descripcion, unidad) VALUES
  (1, 'DHT11 Temperatura', 'Sensor digital de temperatura DHT11', '°C'),
  (2, 'Sensor de Gas MQ-7', 'Detección de monóxido de carbono', 'ppm'),
  (3, 'Sensor PIR', 'Detección de movimiento infrarrojo pasivo', NULL),
  (4, 'HC-SR04', 'Sensor ultrasónico de distancia', 'cm'),
  (5, 'LDR', 'Sensor de luminosidad', 'lux'),
  (6, 'DHT11 Humedad', 'Sensor digital de humedad relativa DHT11', '%')
ON CONFLICT (id) DO NOTHING;

-- =====================
-- Sensores
-- =====================
CREATE TABLE sensores (
  id SERIAL PRIMARY KEY,
  nombre_sensor VARCHAR(120) NOT NULL,
  referencia VARCHAR(60) NOT NULL UNIQUE,
  id_tipo_sensor SMALLINT NOT NULL REFERENCES tipo_sensor(id),
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sensores_usuario_nombre_uk
  ON sensores (id_usuario, lower(nombre_sensor));

CREATE INDEX sensores_usuario_idx ON sensores (id_usuario);
CREATE INDEX sensores_tipo_idx ON sensores (id_tipo_sensor);


-- =====================
-- Medidas históricas
-- =====================
CREATE TABLE medidas (
  id BIGSERIAL PRIMARY KEY,
  id_sensor INTEGER NOT NULL REFERENCES sensores(id) ON DELETE CASCADE,
  id_usuarios INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  valor_de_la_medida NUMERIC(12,4) NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX medidas_sensor_fecha_idx ON medidas (id_sensor, fecha DESC);
CREATE INDEX medidas_usuario_idx ON medidas (id_usuarios);

-- =====================
-- Tarjetas personalizadas (Power BI / iframes)
-- =====================
CREATE TABLE tarjetas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  iframe_url TEXT NOT NULL,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tarjetas_usuario_idx ON tarjetas (id_usuario);

-- =====================
-- Sesiones JWT opcionales (para extender logout con revocación persistente)
-- =====================
CREATE TABLE sesiones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_en TIMESTAMPTZ,
  revocado BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX sesiones_usuario_idx ON sesiones (usuario_id, revocado);

-- Usuarios iniciales
INSERT INTO usuarios (nombre, apellido, correo, password, celular, id_rol, ultimo_acceso)
VALUES
  ('Admin', 'Principal', 'admin@infoiot.com', '1234567', '+57 300 000 0001', 1, now()),
  ('User', 'Operador', 'user@infoiot.com', '1234567', '+57 300 000 0002', 2, now())
ON CONFLICT (correo) DO NOTHING;

COMMIT;
