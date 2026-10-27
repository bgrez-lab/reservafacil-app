# ReservaFácil SpA

Sistema web de reservas de atención y gestión de citas que opera bajo dos perfiles de usuarios diferenciados.

## Características

- **Clientes/Usuarios Finales**: Registro, inicio de sesión, consulta de disponibilidad, creación, revisión y cancelación de sus propias reservas
- **Personal Administrativo**: Panel de control con rutas protegidas para gestionar la agenda global, supervisar turnos y revisar registros
- **Seguridad**: Consultas parametrizadas, contraseñas con hash bcrypt, control de acceso basado en roles, autenticación por sesión
- **Base de datos persistente**: PostgreSQL
- **Listo para despliegue**: Configurado para Render, Railway, etc.

## Tecnologías

- Node.js + Express
- PostgreSQL (pg)
- bcrypt para hash de contraseñas
- express-session para autenticación
- EJS para vistas
- Helmet, CORS para seguridad

## Instalación

1. Clonar el repositorio
```bash
git clone https://github.com/usuario/reservafacil-spa.git
cd reservafacil-spa
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. Configurar base de datos
- Crear base de datos PostgreSQL
- Ejecutar el script de inicialización en `db/init.sql`

5. Ejecutar en desarrollo
```bash
npm run dev
```

6. Ejecutar en producción
```bash
npm start
```

## Estructura del proyecto

```
reservafacil-app/
├── src/            # Código fuente
├── routes/         # Rutas de la aplicación
├── controllers/    # Lógica de negocio
├── middleware/     # Middlewares (auth, etc.)
├── views/          # Plantillas EJS
├── public/         # Archivos estáticos
├── db/             # Configuración y scripts de BD
├── tests/          # Pruebas
└── .github/        # CI/CD workflows
```

## Seguridad

- **Prevención SQL Injection**: Uso exclusivo de consultas parametrizadas con `$1, $2, ...`
- **Hash de contraseñas**: bcrypt con salt rounds
- **Autenticación**: Sesiones seguras con httpOnly cookies
- **Autorización**: Middleware de roles para rutas protegidas
- **Headers de seguridad**: Helmet
- **Rate limiting**: Protección contra ataques de fuerza bruta

## Despliegue

Este proyecto está preparado para desplegarse en Render.com u otras plataformas PaaS. Requiere:
- Servicio web Node.js
- Base de datos PostgreSQL externa (Neon, Supabase, etc.)
- Variables de entorno configuradas

## Licencia

MIT
