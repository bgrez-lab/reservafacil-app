# Plan de pruebas y evidencias

## 1. Objetivo

Verificar que los controles de seguridad y la funcionalidad de ReservaFácil
funcionan de forma reproducible en local y en integración continua.

## 2. Entorno

| Elemento | Versión |
| --- | --- |
| Node.js (CI) | 20 |
| PostgreSQL (CI) | 16 |
| Jest | 29 |
| ESLint | 8 |
| Semgrep | 1.85.0 |
| Gitleaks | 8.18.4 |

## 3. Comandos

```bash
npm ci                 # instalación reproducible
npm run lint           # análisis estático
npm test               # pruebas + cobertura (umbral 85%)
npm run audit:prod     # dependencias de producción
npm run audit          # todas las dependencias (falla con high/critical)
npm run db:init        # esquema + datos semilla
npm run seed:admin     # crea/actualiza administrador con variables de entorno
```

## 4. Casos de prueba automatizados

### 4.1 Validación (`tests/validation.test.js`)

- Normalización de email (espacios y mayúsculas).
- Longitud de nombre (2–100 caracteres).
- Formato y longitud máxima de email.
- Contraseña mínima y límite de 72 bytes de bcrypt.
- Fechas con formato inválido, fechas inexistentes y fechas pasadas.
- Horas válidas, formato 12 h y valores fuera de rango.
- Identificadores de servicio numéricos y rechazo de payloads tipo inyección.
- Validación completa de registro, login y reserva.

### 4.2 Contraseñas (`tests/password.test.js`)

- Hash bcrypt con costo 12, longitud 60 y verificación correcta/incorrecta.
- Salt distinto para la misma contraseña.
- Hash semilla del administrador verificable con `admin123`.

### 4.3 CSRF (`tests/csrf.test.js`)

- Generación y reutilización del token por sesión.
- Métodos seguros sin token.
- Rechazo de POST sin token, con token incorrecto y con distinto largo.
- Aceptación del token por cuerpo y cabecera.
- Error explícito si no existe sesión.

### 4.4 Autorización (`tests/auth-middleware.test.js`)

- Redirección al login sin sesión.
- Bloqueo de clientes en rutas de administrador.
- Acceso permitido para administrador y cliente según corresponda.

### 4.5 Seguridad HTTP (`tests/security.test.js`)

- Cabeceras `X-Content-Type-Options`, `X-Frame-Options` y CSP.
- CSP con `default-src 'self'`, CDN permitido y `frame-ancestors 'none'`.
- CORS deshabilitado si no se configura origen.
- Token CSRF presente en formularios de login y registro.
- Rechazo de POST sin token o con token de otra sesión.
- Respuesta 404 controlada.

### 4.6 Rutas de autenticación (`tests/routes-auth.test.js`)

- Registro inválido, email duplicado, registro exitoso y error de base de datos.
- Login con usuario inexistente, cuenta inactiva, contraseña incorrecta y éxito.
- Regeneración de sesión, cierre de sesión por POST y protección posterior.
- Redirección de usuarios autenticados fuera de login/registro.

### 4.7 Rutas de reservas (`tests/routes-reservas.test.js`)

- Listado de servicios y error controlado.
- Validación de fecha/hora/servicio.
- Servicio inexistente o inactivo.
- Conflicto de horario dentro de transacción.
- Creación exitosa con `COMMIT` y redirección correcta.
- Traducción de violación de unicidad (`23505`) a 409.
- Listado de reservas propias y error controlado.
- Cancelación con ID inválido, recurso ajeno, reserva ya cancelada y éxito.

### 4.8 Rutas de administración (`tests/routes-admin.test.js`)

- Indicadores del dashboard y tolerancia a fallos.
- Listado global de reservas y usuarios.
- Actualización de estado válida.
- Rechazo de ID o estado inválido.
- Redirección segura ante error de base de datos.

### 4.9 Salud (`tests/health.test.js`)

- `/health` responde `ok` cuando PostgreSQL responde.
- `/health` no filtra credenciales ni detalles internos cuando falla.

## 5. Pruebas en integración continua

| Etapa | Herramienta | Criterio de éxito |
| --- | --- | --- |
| Lint | ESLint | 0 errores |
| Pruebas | Jest | 73 pruebas, cobertura ≥ 85% |
| SCA producción | npm audit `--omit=dev` | 0 vulnerabilidades |
| SCA total | npm audit | Sin high/critical |
| Secretos | Gitleaks | 0 hallazgos |
| SAST | Semgrep (p/javascript, p/owasp-top-ten) | 0 hallazgos de severidad ERROR |
| Integración | PostgreSQL 16 + `db:init` + `/health` + `/` | HTTP 200 y `status: ok` |

## 6. Evidencias locales

Fecha de ejecución: **2026-11-04**.

```text
$ npm run lint
> eslint .
(sin errores)

$ npm test
Test Suites: 11 passed, 11 total
Tests:       73 passed, 73 total
All files: 95.05% statements, 90.74% branches, 95.74% functions, 94.92% lines

$ npm run audit:prod
found 0 vulnerabilities

$ npm run audit
28 vulnerabilities (4 low, 24 moderate)  # solo dependencias de desarrollo
```

## 7. Evidencias de CI

- Workflow: `.github/workflows/ci.yml`.
- Ejecución fallida original (referencia del diagnóstico):
  `https://github.com/bgrez-lab/reservafacil-app/actions/runs/40581753733`.
- La nueva ejecución debe adjuntar el artefacto `coverage-report` y finalizar
  en verde tras el push a `main`.

## 8. Pruebas manuales recomendadas antes de producción

1. Registro, login, creación y cancelación de reserva en navegador.
2. Intento de cancelar una reserva ajena (debe responder 403).
3. Intento de abrir `/admin/dashboard` como cliente (debe responder 403).
4. Envío de formulario sin token CSRF (debe responder 403).
5. Verificación de cookie `Secure` y `SameSite=Lax` en producción.
6. Cambio de contraseña del administrador con `ADMIN_PASSWORD`.
