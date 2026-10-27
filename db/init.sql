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
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fecha, hora) -- Evitar doble reserva en mismo horario
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Insertar servicios de ejemplo
INSERT INTO servicios (nombre, descripcion, duracion_minutos) VALUES
('Consulta General', 'Atención médica general', 30),
('Odontología', 'Consulta odontológica', 45),
('Pediatría', 'Atención pediátrica', 30)
ON CONFLICT DO NOTHING;

-- Crear usuario administrador por defecto (contraseña: admin123)
-- La contraseña se debe cambiar en producción
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador', 'admin@reservafacil.com', '$2b$10$rQZ9vXKqGvLhF5wN3mT8uOeJpYcA2bR4sD6fG8hI0kL2nM4pQ6rS8tU0vW2xY4z', 'admin')
ON CONFLICT (email) DO NOTHING;
