# Registro de Decisiones de Arquitectura y Técnicas (ADR)

| Fecha | Decisión | Motivo / Contexto |
|---|---|---|
| 2026-10-29 | Plataforma objetivo primaria: Android | Trabajo práctico y requisitos de entrega orientados a APK y acceso a sockets nativos en dispositivo de prueba. |
| 2026-10-29 | Descubrimiento LAN vía TCP connect + SNMP probe + mDNS | En Android 10+ (API 29+) no es posible acceder a `/proc/net/arp` ni crear sockets ICMP crudos sin root. |
| 2026-10-29 | SNMP v2c predeterminado con fallback a v1 | Compatibilidad con contadores Counter64 y equipos legados de telecomunicaciones. |
| 2026-10-29 | Autenticación SSH inicial: usuario y contraseña | Simplificar el alcance inicial asegurando almacenamiento seguro con Keychain antes de llaves privadas. |
| 2026-10-29 | Inicialización de Fase 0 (Bootstrap nativo) | Inicio de la configuración del proyecto y validación de librerías nativas. |
