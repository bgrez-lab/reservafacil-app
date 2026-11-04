# Diseño de seguridad

El diseño de seguridad se documenta en:

- [`docs/modelo-de-amenazas.md`](docs/modelo-de-amenazas.md): activos, actores,
  límites de confianza, amenazas STRIDE, controles y riesgos residuales.
- [`docs/controles-owasp.md`](docs/controles-owasp.md): mapeo contra OWASP Top 10.
- [`docs/plan-de-pruebas.md`](docs/plan-de-pruebas.md): casos automatizados,
  comandos y evidencias.
- [`SECURITY.md`](../SECURITY.md): política de reporte de vulnerabilidades.

## Principios aplicados

1. **Mínimo privilegio:** cada ruta declara el rol que necesita y las consultas
   se limitan al usuario autenticado.
2. **Defensa en profundidad:** validación de entrada, consultas parametrizadas,
   restricciones de base de datos, CSRF, CSP y cabeceras de seguridad.
3. **Valores seguros por defecto:** TLS verificado, cookies `Secure` en
   producción, contraseñas con bcrypt costo 12 y CORS cerrado salvo
   configuración explícita.
4. **Fallo seguro:** errores genéricos al cliente, logs internos y redirección
   controlada ante fallos de base de datos.
5. **Seguridad verificable:** lint, pruebas con cobertura, SCA, SAST, escaneo de
   secretos y pruebas de integración en cada push.

## Identidad visual

La interfaz sigue la guía de estilo de [`DESIGN.md`](../DESIGN.md): lienzo blanco,
tipografía del sistema (SF Pro/Inter), titulares Ink con peso 600 y tracking
negativo, superficies Cloud Card (#ebf0f8), radios de 24–32px y controles en
píldora. Los colores de métrica se reservan para datos y acentos, no para
fondos generales.
