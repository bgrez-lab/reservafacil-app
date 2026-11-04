# Mapeo de controles - OWASP Top 10 (2021)

| Riesgo | Control en ReservaFácil | Evidencia |
| --- | --- | --- |
| A01 Broken Access Control | `requireAuth`, `requireAdmin`, `requireClient`; filtro por `usuario_id`; 403 al cancelar reservas ajenas | `middleware/auth.js`, `routes/reservas.js`, `tests/auth-middleware.test.js`, `tests/routes-reservas.test.js` |
| A02 Cryptographic Failures | bcrypt costo 12; cookies `Secure` en producción; TLS verificado hacia PostgreSQL | `utils/password.js`, `src/app.js`, `db/connection.js`, `tests/password.test.js` |
| A03 Injection | Consultas parametrizadas; validación de IDs, fechas y horas; EJS escapa salida | `routes/*.js`, `utils/validation.js`, `tests/validation.test.js` |
| A04 Insecure Design | Modelo de amenazas, validación en servidor, transacciones y límites de intentos | `docs/modelo-de-amenazas.md`, `routes/auth.js`, `routes/reservas.js` |
| A05 Security Misconfiguration | Helmet, CSP, CORS restringido, `X-Powered-By` deshabilitado, errores genéricos | `src/app.js`, `routes/health.js`, `tests/security.test.js` |
| A06 Vulnerable Components | `npm ci`, auditoría en CI, bcrypt 6 y EJS 7 sin vulnerabilidades de producción | `.github/workflows/ci.yml`, `package-lock.json` |
| A07 Identification and Authentication Failures | Rate limiting, mensajes genéricos, regeneración de sesión, bcrypt, sesión en PostgreSQL | `routes/auth.js`, `middleware/csrf.js`, `tests/routes-auth.test.js` |
| A08 Software and Data Integrity Failures | Dependencias fijadas por `package-lock.json`, workflow con permisos mínimos, hook de despliegue por secreto | `package-lock.json`, `.github/workflows/ci.yml` |
| A09 Security Logging and Monitoring Failures | Logs de errores del servidor sin exponerlos al cliente; `/health` para monitoreo | `routes/*.js`, `routes/health.js` |
| A10 Server-Side Request Forgery | La aplicación no realiza peticiones salientes a URLs controladas por el usuario | Revisión de rutas |

## Controles adicionales

- **CSRF:** patrón synchronizer token por sesión con comparación en tiempo
  constante (`middleware/csrf.js`).
- **CSP:** scripts solo desde el propio origen y Bootstrap CDN; sin `onclick` ni
  bloques `<script>` inline.
- **Doble reserva:** índice único parcial `idx_reservas_slot_unico` sobre
  `(fecha, hora) WHERE estado <> 'cancelada'`.
- **Secretos:** `.env` fuera del repositorio, `.env.example` documental,
  Gitleaks en CI.
- **Contenedores de CI:** healthcheck correcto de PostgreSQL y pruebas de
  integración contra base real.
