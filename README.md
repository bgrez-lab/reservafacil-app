# ReservaFácil SpA

Plataforma web de reservas de atención y gestión de citas con dos perfiles:
**cliente/usuario** y **administrador**. Construida con Node.js, Express, EJS y
MongoDB, con autenticación JWT, hash de contraseñas con bcrypt y un pipeline
DevSecOps en GitHub Actions.

## Características

- Registro e inicio de sesión con JWT y contraseñas protegidas con bcrypt.
- Roles: visitante, usuario registrado y administrador.
- Creación y cancelación de reservas con validación de fecha, hora y servicio.
- Protección contra doble reserva mediante índice único parcial en MongoDB.
- Panel administrativo para gestionar reservas, usuarios y módulos configurables.
- Formulario de contacto con persistencia y envío de correo (Nodemailer).
- Enlaces de redes sociales administrables desde el panel.
- Chatbot de atención al cliente con preguntas y respuestas administrables.
- Protección CSRF en formularios que modifican estado (doble submit cookie).
- Cabeceras de seguridad (Helmet), CSP estricta y CORS restringido.
- Rate limiting en login, registro y contacto.
- Auditoría de dependencias, análisis estático, escaneo de secretos y pruebas
  de integración en CI.
- Despliegue en Render (`render.yaml`).

## Tecnologías

- Node.js 20+
- Express 4
- MongoDB (Mongoose)
- EJS 7
- bcrypt 6
- jsonwebtoken
- Nodemailer
- Helmet, CORS, express-rate-limit
- Jest + Supertest
- ESLint

## Inicio rápido

### 1. Requisitos

- Node.js 20 o superior.
- Una base de datos MongoDB (local o MongoDB Atlas).

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
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/reservafacil
JWT_SECRET=un-secreto-largo-y-aleatorio
NODE_ENV=development
```

### 4. Crear el administrador

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

### 5. Ejecutar

```bash
npm run dev   # desarrollo
npm start     # producción
```

Abre `http://localhost:3000`.

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `MONGODB_URI` | Sí | Cadena de conexión de MongoDB |
| `JWT_SECRET` | Sí en producción | Secreto para firmar JWT; mínimo 32 caracteres |
| `PORT` | No | Puerto HTTP (por defecto 3000) |
| `NODE_ENV` | No | `development`, `test` o `production` |
| `BCRYPT_ROUNDS` | No | Costo de bcrypt, 10–14 (por defecto 12) |
| `CORS_ORIGIN` | No | Origen(es) permitidos separados por coma |
| `SMTP_HOST` | No | Servidor SMTP para el formulario de contacto |
| `SMTP_PORT` | No | Puerto SMTP (por defecto 587) |
| `SMTP_SECURE` | No | `true` para TLS directo |
| `SMTP_USER` | No | Usuario SMTP |
| `SMTP_PASS` | No | Contraseña SMTP |
| `SMTP_FROM` | No | Remitente de los correos |
| `CONTACT_EMAIL` | No | Buzón institucional que recibe consultas |
| `ADMIN_NAME` | No | Nombre del administrador para `seed:admin` |
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
| `npm run seed:admin` | Crea o actualiza el administrador |
| `npm run audit` | Audita todas las dependencias |
| `npm run audit:prod` | Audita solo dependencias de producción |

## Seguridad implementada

- **JWT:** tokens firmados con expiración, almacenados en cookie `httpOnly`.
- **CSRF:** patrón double-submit cookie con comparación en tiempo constante.
- **SQL/NoSQL Injection:** consultas mediante Mongoose con validación de esquema.
- **XSS:** EJS escapa la salida y la CSP prohíbe scripts inline.
- **Autenticación:** bcrypt costo 12, rate limiting y mensajes genéricos.
- **Autorización:** middleware `requireAuth` y `requireAdmin`, verificación de propiedad.
- **Cabeceras:** Helmet con CSP, `frame-ancestors 'none'` y sin `X-Powered-By`.
- **Errores:** mensajes genéricos al cliente; detalles solo en logs.
- **Secretos:** `.env` ignorado, `.env.example` sin valores reales y Gitleaks.

## Pruebas

```bash
npm run lint
npm test
npm run audit:prod
```

## CI/CD

`.github/workflows/ci.yml` ejecuta:

1. Calidad: `npm ci`, ESLint, Jest con cobertura y auditoría.
2. Secretos: Gitleaks.
3. SAST: Semgrep.
4. Integración: MongoDB 7, seed de admin y verificación de `/health` y `/`.
5. Despliegue: en push a `main`, dispara el hook de Render si existe el secreto.

## Despliegue en Render

1. Crea un Web Service con `npm ci` y `npm start`.
2. Configura `MONGODB_URI` (MongoDB Atlas recomendado), `JWT_SECRET`, `BCRYPT_ROUNDS=12`.
3. Para el formulario de contacto, configura las variables SMTP.
4. Ejecuta `npm run seed:admin` con un `ADMIN_PASSWORD` propio.

## Documentación

- [`SECURITY.md`](SECURITY.md)
- [`DESIGN.md`](DESIGN.md)
- [`docs/modelo-de-amenazas.md`](docs/modelo-de-amenazas.md)
- [`docs/controles-owasp.md`](docs/controles-owasp.md)
- [`docs/plan-de-pruebas.md`](docs/plan-de-pruebas.md)
- [`docs/diseno-seguridad.md`](docs/diseno-seguridad.md)

## Licencia

MIT
