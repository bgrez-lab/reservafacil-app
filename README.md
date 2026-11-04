# ReservaFácil SpA

Sistema web de reservas de atención y gestión de citas con dos perfiles:
**cliente** y **administrador**. Construido con Node.js, Express, EJS y
PostgreSQL, con controles de seguridad alineados a OWASP Top 10 y un pipeline
DevSecOps en GitHub Actions.

## Características

- Registro e inicio de sesión con contraseñas protegidas con bcrypt.
- Sesiones persistidas en PostgreSQL y cookies `httpOnly`/`SameSite`.
- Creación y cancelación de reservas con validación de fecha, hora y servicio.
- Protección contra doble reserva mediante transacción e índice único parcial.
- Panel de administración protegido por rol.
- Protección CSRF en todos los formularios que modifican estado.
- Cabeceras de seguridad (Helmet), CSP estricta y CORS restringido por variable
  de entorno.
- Rate limiting en login y registro.
- Auditoría de dependencias, análisis estático, escaneo de secretos y pruebas de
  integración en CI.
- Blueprint de despliegue para Render (`render.yaml`).

## Tecnologías

- Node.js 20+
- Express 4
- PostgreSQL 14+
- EJS 7
- bcrypt 6
- express-session + connect-pg-simple
- Helmet, CORS, express-rate-limit
- Jest + Supertest
- ESLint

## Inicio rápido

### 1. Requisitos

- Node.js 20 o superior (`node -v`).
- PostgreSQL 14 o superior en ejecución.

### 2. Instalar dependencias

```bash
npm ci
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` como mínimo con:

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/reservafacil
SESSION_SECRET=un-secreto-largo-y-aleatorio
NODE_ENV=development
```

Genera un secreto seguro con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Inicializar la base de datos

```bash
npm run db:init
```

El script crea las tablas, índices, servicios de ejemplo y el usuario
administrador inicial (`admin@reservafacil.com` / `admin123`).

### 5. Crear o rotar el administrador

```bash
ADMIN_EMAIL=admin@tu-dominio.cl \
ADMIN_PASSWORD='una-clave-larga-y-unica' \
npm run seed:admin
```

En PowerShell:

```powershell
$env:ADMIN_EMAIL="admin@tu-dominio.cl"
$env:ADMIN_PASSWORD="una-clave-larga-y-unica"
npm run seed:admin
```

### 6. Ejecutar

```bash
npm run dev   # desarrollo con recarga automática
npm start     # producción
```

Abre `http://localhost:3000`.

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión de PostgreSQL |
| `SESSION_SECRET` | Sí en producción | Secreto para firmar cookies de sesión; mínimo 32 caracteres |
| `PORT` | No | Puerto HTTP (por defecto 3000) |
| `NODE_ENV` | No | `development`, `test` o `production` |
| `BCRYPT_ROUNDS` | No | Costo de bcrypt, 10–14 (por defecto 12) |
| `CORS_ORIGIN` | No | Origen(es) permitidos separados por coma; si está vacío, CORS se deshabilita |
| `DATABASE_SSL` | No | `true` para forzar TLS hacia PostgreSQL |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | No | `true` por defecto; no desactivar en producción |
| `ADMIN_NAME` | No | Nombre visible del administrador para `seed:admin` |
| `ADMIN_EMAIL` | No | Email del administrador para `seed:admin` |
| `ADMIN_PASSWORD` | No | Contraseña del administrador para `seed:admin` |

## Scripts

| Comando | Función |
| --- | --- |
| `npm start` | Inicia la aplicación |
| `npm run dev` | Inicia con nodemon |
| `npm test` | Ejecuta Jest con cobertura y umbral del 85% |
| `npm run test:ci` | Igual que `test`, modo CI |
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | Corrige automáticamente lo posible |
| `npm run db:init` | Ejecuta `db/init.sql` |
| `npm run seed:admin` | Crea o actualiza el administrador |
| `npm run audit` | Audita todas las dependencias (falla con high/critical) |
| `npm run audit:prod` | Audita solo dependencias de producción |

## Estructura del proyecto

```text
reservafacil-app/
├── src/                  # Punto de entrada y configuración de Express
├── routes/               # Rutas de autenticación, reservas, admin y salud
├── middleware/           # Autenticación, autorización y CSRF
├── utils/                # Validación y hash de contraseñas
├── views/                # Plantillas EJS
├── public/               # CSS y JavaScript del navegador
├── db/                   # Conexión y esquema SQL
├── scripts/              # Inicialización de BD y administrador
├── tests/                # Pruebas unitarias y de rutas
├── docs/                 # Modelo de amenazas, OWASP y plan de pruebas
├── .github/workflows/    # Pipeline CI/CD
└── render.yaml           # Blueprint de despliegue en Render
```

## Seguridad implementada

- **SQL Injection:** todas las consultas usan parámetros (`$1`, `$2`, ...).
- **XSS:** EJS escapa la salida y la CSP prohíbe scripts inline.
- **CSRF:** token por sesión en formularios POST, comparado en tiempo constante.
- **Autenticación:** bcrypt costo 12, rate limiting y regeneración de sesión.
- **Sesiones:** almacenadas en PostgreSQL; MemoryStore solo en `NODE_ENV=test`.
- **Autorización:** `requireAuth`, `requireAdmin` y verificación de propiedad.
- **Cabeceras:** Helmet con CSP, `frame-ancestors 'none'` y sin `X-Powered-By`.
- **Base de datos:** TLS verificado por defecto y unicidad parcial por horario.
- **Errores:** mensajes genéricos al cliente; detalles solo en logs.
- **Secretos:** `.env` ignorado, `.env.example` sin valores reales y Gitleaks.

Consulta [`docs/controles-owasp.md`](docs/controles-owasp.md) y
[`docs/modelo-de-amenazas.md`](docs/modelo-de-amenazas.md).

## Pruebas

```bash
npm run lint
npm test
npm run audit:prod
npm run audit
```

Resultado local de referencia (2026-11-04):

- 11 suites, 73 pruebas aprobadas.
- Cobertura global: 95.05% statements, 90.74% branches, 95.74% functions,
  94.92% lines.
- `npm run audit:prod`: 0 vulnerabilidades.
- `npm run audit`: solo avisos moderados/bajos en dependencias de desarrollo.

El detalle de casos está en [`docs/plan-de-pruebas.md`](docs/plan-de-pruebas.md).

## CI/CD

`.github/workflows/ci.yml` ejecuta en cada push a `main`/`develop` y en pull
requests:

1. **Calidad:** `npm ci`, ESLint, Jest con cobertura y auditoría de
   dependencias.
2. **Secretos:** Gitleaks sobre todo el historial.
3. **SAST:** Semgrep (`p/javascript`, `p/owasp-top-ten`).
4. **Integración:** PostgreSQL 16, `db:init`, arranque de la app, verificación
   de `/health` y `/`.
5. **Despliegue:** en push a `main`, dispara el hook de Render si existe el
   secreto y ejecuta un smoke test opcional.

El reporte de cobertura se publica como artefacto `coverage-report`.

### Secretos de GitHub necesarios

| Secreto | Uso |
| --- | --- |
| `RENDER_DEPLOY_HOOK_URL` | Disparar el despliegue en Render |
| `RENDER_APP_URL` | URL pública para el smoke test posterior |

Si no están configurados, el pipeline advierte y omite el despliegue sin fallar.

## Despliegue en Render

1. Crea un Blueprint a partir de `render.yaml` o un Web Service manual.
2. Usa `npm ci` como build y `npm start` como start command.
3. Configura `DATABASE_URL`, `SESSION_SECRET`, `BCRYPT_ROUNDS=12`,
   `DATABASE_SSL=true` y `DATABASE_SSL_REJECT_UNAUTHORIZED=false` (Render usa un certificado autofirmado en su PostgreSQL administrado).
4. Ejecuta una vez `npm run db:init` contra la base de producción.
5. Ejecuta `npm run seed:admin` con un `ADMIN_PASSWORD` propio.
6. Configura `RENDER_DEPLOY_HOOK_URL` y `RENDER_APP_URL` en GitHub.

## Documentación

- [`SECURITY.md`](SECURITY.md)
- [`DESIGN.md`](DESIGN.md)
- [`docs/modelo-de-amenazas.md`](docs/modelo-de-amenazas.md)
- [`docs/controles-owasp.md`](docs/controles-owasp.md)
- [`docs/plan-de-pruebas.md`](docs/plan-de-pruebas.md)

## Licencia

MIT
