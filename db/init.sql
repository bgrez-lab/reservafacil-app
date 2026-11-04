-- Inicialización de base de datos para ReservaFácil SpA

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Crear tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_minutos INTEGER NOT NULL DEFAULT 30,
    activo BOOLEAN DEFAULT TRUE
);

-- Crear tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Un horario solo puede tener una reserva activa. Las canceladas liberan el cupo.
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_fecha_hora_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_slot_unico
    ON reservas(fecha, hora)
    WHERE estado <> 'cancelada';

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Insertar servicios de ejemplo de forma idempotente
INSERT INTO servicios (nombre, descripcion, duracion_minutos)
SELECT v.nombre, v.descripcion, v.duracion_minutos
FROM (VALUES
    ('Consulta General', 'Atención médica general', 30),
    ('Odontología', 'Consulta odontológica', 45),
    ('Pediatría', 'Atención pediátrica', 30)
) AS v(nombre, descripcion, duracion_minutos)
WHERE NOT EXISTS (
    SELECT 1 FROM servicios s WHERE s.nombre = v.nombre
);

-- Crear usuario administrador por defecto (contraseña: admin123)
-- La contraseña se debe cambiar en producción con: npm run seed:admin
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador', 'admin@reservafacil.com', '$2b$12$gbndSSD.ASDJ7MGz0DdD9O44JR2Y9HUSPXceHtWXUI1aJV36o9HWu', 'admin')
ON CONFLICT (email) DO NOTHING;
