# Network Diagnostics Suite 📡📱
> **Toolkit móvil de diagnóstico de infraestructura de telecomunicaciones para técnicos de campo**  
> *Trabajo Práctico — Desarrollo de Aplicaciones Móviles (2026)*  
> *Licenciatura en Sistemas de Información*

---

## 📌 Documentación del Proyecto

El documento principal de especificación técnica y requerimientos funcionales/no funcionales se encuentra en:

👉 **[INFORME_REQUERIMIENTOS.md](./INFORME_REQUERIMIENTOS.md)**

Documentos complementarios:
- **[PLAN_IMPLEMENTACION.md](./PLAN_IMPLEMENTACION.md)** — plan por fases, decisiones cerradas y criterios de aceptación.
- **[GUIA_ESTILOS.md](./GUIA_ESTILOS.md)** — sistema de diseño minimalista (tokens, componentes, pantallas, redacción).
- **[CLAUDE.md](./CLAUDE.md)** — instrucciones para agentes.

---

## 🎯 Resumen Rápido para Agentes y Desarrolladores (Claude / LLMs)

- **Tecnología Base:** React Native CLI (Bare Workflow, sin Expo Go por requerir sockets nativos C++/Java y cliente SSH).
- **Dominio:** Diagnóstico en campo de routers, ONTs, switches y antenas sin dependencia de Internet.
- **Protocolos Clave:**
  - **mDNS / Zeroconf** (`react-native-zeroconf`) para descubrimiento LAN.
  - **SNMP v1/v2c** sobre UDP/161 (`react-native-udp`) con parser propio BER/ASN.1 (OIDs MIB-II).
  - **SSH Embebido** (`react-native-ssh-sftp`) para ejecutar diagnósticos de consola de red.
  - **Cámara & QR** (`react-native-vision-camera`) para identificar números de serie.
  - **Geolocalización & PDF** (`react-native-geolocation-service` + `react-native-html-to-pdf`).
- **Arquitectura de Datos:** Offline-first estricto con **WatermelonDB** + patrón de cola de sincronización diferida (**Outbox Pattern**) disparada mediante `@react-native-community/netinfo`.
- **Seguridad:** Credenciales resguardadas en hardware seguro vía `react-native-keychain` (Android Keystore / iOS Keychain).
