# Instrucciones para Claude

Proyecto: **NetDiag — Network Diagnostics Suite** (React Native CLI, sólo Android).

## Orden de lectura
1. `INFORME_REQUERIMIENTOS.md` — qué hay que construir y por qué.
2. `PLAN_IMPLEMENTACION.md` — **fuente de verdad** sobre cómo construirlo. Ante una contradicción con el informe, gana el plan (ver §0.2).
3. `GUIA_ESTILOS.md` — toda decisión visual y de redacción.
4. `docs/PROGRESO.md` — en qué fase está el proyecto (si existe).

## Reglas de trabajo
- Ejecutar las fases **en orden**. No avanzar sin cumplir todos los criterios de aceptación de la fase actual.
- Al cerrar una fase: correr `npx tsc --noEmit` y `npm test` en `app/`, y marcarla en `docs/PROGRESO.md`.
- No agregar librerías fuera del stack de la §2 del plan sin registrarlo en `docs/DECISIONES.md`.
- No hardcodear colores, tamaños ni espaciados: usar `src/theme/tokens.ts`.
- Nunca guardar credenciales fuera de `CredentialStore` (keychain) ni escribirlas en logs.
- Textos de UI en español rioplatense con voseo.
- Sistema operativo de desarrollo: Windows (PowerShell).
