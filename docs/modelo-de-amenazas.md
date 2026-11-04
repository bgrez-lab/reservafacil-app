# Modelo de amenazas - ReservaFácil SpA

## 1. Alcance

Aplicación web de reservas con dos perfiles:

- **Cliente:** se registra, inicia sesión, crea y cancela sus reservas.
- **Administrador:** consulta indicadores, revisa todas las reservas, cambia
  estados y lista usuarios.

Componentes: aplicación Node.js/Express, vistas EJS, PostgreSQL, sesiones
persistidas en PostgreSQL, CI/CD en GitHub Actions y despliegue en Render.

## 2. Activos

| Activo | Impacto si se compromete |
| --- | --- |
| Credenciales y hashes de contraseñas | Suplantación de identidad, acceso a datos personales |
| Sesiones de usuario y administrador | Ejecución de acciones no autorizadas |
| Datos de reservas (nombre, email, fecha, hora) | Exposición de datos personales y manipulación de agenda |
| Panel de administración | Modificación masiva del estado de reservas |
| Base de datos PostgreSQL | Pérdida o alteración de toda la información |
| Secretos de despliegue (`SESSION_SECRET`, `DATABASE_URL`, hook de Render) | Compromiso total del entorno |

## 3. Actores y límites de confianza

| Actor | Confianza |
| --- | --- |
| Visitante anónimo | No confiable |
| Cliente autenticado | Confianza limitada, solo sobre sus propios recursos |
| Administrador | Alta, con permisos globales |
| Atacante externo | No confiable |
| Servicios externos (CDN Bootstrap, Render) | Confianza acotada por CSP y TLS |

Límites de confianza:

1. Navegador → aplicación (HTTP/TLS).
2. Aplicación → PostgreSQL (TLS con verificación de certificado).
3. GitHub Actions → Render (secreto del hook de despliegue).

## 4. Amenazas y controles (STRIDE)

| Categoría | Amenaza | Control implementado |
| --- | --- | --- |
| Spoofing | Fuerza bruta o credential stuffing en `/login` | bcrypt costo 12, rate limit 10 intentos/15 min, mensaje genérico de error |
| Spoofing | Secuestro de sesión | Cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción, regeneración de sesión al autenticar, `rolling` |
| Tampering | Alteración de precios/servicios o IDs en formularios | Validación de `servicio_id`, fecha y hora; consultas parametrizadas; verificación de servicio activo |
| Tampering | Doble reserva del mismo horario por concurrencia | Transacción con `BEGIN/COMMIT`, `SELECT ... FOR UPDATE` e índice único parcial |
| Repudiation | Usuario niega haber cancelado una reserva | Registro de `fecha_modificacion` y sesión autenticada |
| Information disclosure | Errores de base de datos expuestos al cliente | Mensajes genéricos en rutas y `/health`; detalles solo en logs del servidor |
| Information disclosure | Acceso a reservas de otro usuario | Filtro por `usuario_id` y respuesta 403 al cancelar recursos ajenos |
| Denial of service | Envío masivo de registros o logins | `express-rate-limit` y límite de cuerpo de 100 KB |
| Elevation of privilege | Cliente accede a `/admin/*` | `requireAdmin` valida `req.session.rol` |
| Elevation of privilege | CSRF en formularios | Token sincronizado por sesión, comparación con `timingSafeEqual`, CSP sin scripts inline |
| Elevation of privilege | Inyección SQL | Consultas exclusivamente parametrizadas (`$1`, `$2`, ...) |
| Elevation of privilege | XSS | EJS escapa por defecto (`<%= %>`), CSP estricta y JS externo |
| Elevation of privilege | Clickjacking | `frame-ancestors 'none'` y `X-Frame-Options` |
| Elevation of privilege | Fuga de secretos en el repositorio | `.env` ignorado, `.env.example` sin secretos reales, Gitleaks en CI |

## 5. Flujo de datos resumido

```text
Navegador
  │ HTTPS + cookie de sesión + token CSRF
  ▼
Express (Helmet, CORS restringido, sesión PostgreSQL, CSRF, rutas)
  │ Consultas parametrizadas + TLS verificado
  ▼
PostgreSQL (usuarios, servicios, reservas, sesiones)
```

## 6. Riesgos residuales

| Riesgo | Estado | Mitigación pendiente |
| --- | --- | --- |
| Dependencias de desarrollo con avisos moderados | Aceptado | No afectan producción (`npm run audit:prod` = 0); se actualizan al migrar Jest/ESLint |
| Rate limiting en memoria por instancia | Aceptado | Usar almacén compartido (Redis) si se escala horizontalmente |
| Sin MFA para administradores | Aceptado | Incorporar TOTP si el cliente lo requiere |
| Sin verificación de email ni recuperación de contraseña | Aceptado | Funcionalidad futura con tokens de un solo uso |
| Contraseña inicial `admin123` | Controlado | `npm run seed:admin` con `ADMIN_PASSWORD` y aviso explícito en el script |
| Sin pruebas de carga ni pentest externo | Pendiente | Planificar antes de producción |

## 7. Revisión

Este modelo se revisa en cada cambio de arquitectura, autenticación, modelo de
datos o proveedor de infraestructura.
