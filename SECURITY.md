# Política de seguridad

## Versiones soportadas

| Versión | Soporte |
| --- | --- |
| 1.x | Sí |

## Reporte de vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, **no abras un issue público**.

Envía un correo a `seguridad@reservafacil.example` con:

- Descripción del problema y su impacto.
- Pasos para reproducirlo.
- Versión o commit afectado.
- Evidencia (capturas, peticiones HTTP o pruebas de concepto).
- Recomendación de mitigación, si la tienes.

Recibirás una confirmación en un plazo de 48 horas hábiles y un plan de
corrección en un plazo de 7 días. Por favor, no divulgues el problema hasta
que exista una versión corregida.

## Alcance

Quedan dentro del alcance: autenticación, autorización, gestión de reservas,
manejo de sesiones, validación de entradas, configuración de seguridad y
dependencias del proyecto.

Quedan fuera del alcance: denegación de servicio, ingeniería social, ataques
físicos y pruebas contra entornos de terceros sin autorización.

## Prácticas aplicadas

- Contraseñas con bcrypt (costo 12 por defecto, configurable entre 10 y 14).
- Consultas SQL parametrizadas en todas las rutas.
- Tokens CSRF por sesión para peticiones que modifican estado.
- Cookies de sesión `httpOnly`, `SameSite=Lax` y `Secure` en producción.
- Sesiones almacenadas en PostgreSQL (MemoryStore solo en pruebas).
- Cabeceras de seguridad con Helmet y CSP sin scripts inline.
- Límite de peticiones en login y registro.
- Validación y normalización de entradas del usuario.
- Restricciones de acceso por rol y verificación de propiedad de recursos.
- Índice único parcial para evitar dobles reservas del mismo horario.
- Auditoría de dependencias y escaneo de secretos en CI.

## Divulgación

Este documento describe el proceso de reporte. Las correcciones se publican
como commits firmados en la rama `main` y se reflejan en las notas de versión.
