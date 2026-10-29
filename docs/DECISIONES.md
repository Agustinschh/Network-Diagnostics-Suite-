# Registro Formal de Decisiones de Arquitectura (ADRs)

Este documento registra las decisiones arquitectónicas clave adoptadas durante el diseño y desarrollo de **Network Diagnostics Suite (NetDiag)**, detallando su contexto, alternativas evaluadas, justificación técnica y consecuencias.

---

## Índice de Decisiones (ADRs)
- [ADR-01: React Native Bare Workflow vs Expo Go](#adr-01-react-native-bare-workflow-vs-expo-go)
- [ADR-02: WatermelonDB con Generador UUID v4 vs SQLite Nativo Manual](#adr-02-watermelondb-con-generador-uuid-v4-vs-sqlite-nativo-manual)
- [ADR-03: Implementación Propia de Codec BER/ASN.1 y PDU SNMP](#adr-03-implementación-propia-de-codec-berasn1-y-pdu-snmp)
- [ADR-04: Estrategia de Descubrimiento LAN en Android 10+ (API 29+)](#adr-04-estrategia-de-descubrimiento-lan-en-android-10-api-29)
- [ADR-05: Perfiles Cerrados de Telecomunicaciones para Sesiones SSH](#adr-05-perfiles-cerrados-de-telecomunicaciones-para-sesiones-ssh)
- [ADR-06: Patrón Outbox con Retroceso Exponencial y Jitter para Sincronización](#adr-06-patrón-outbox-con-retroceso-exponencial-y-jitter-para-sincronización)
- [ADR-07: Almacenamiento Seguro de Credenciales en Keystore de Hardware](#adr-07-almacenamiento-seguro-de-credenciales-en-keystore-de-hardware)
- [ADR-08: Motor de Reportes PDF con Plantilla HTML A4 Responsive](#adr-08-motor-de-reportes-pdf-con-plantilla-html-a4-responsive)

---

### ADR-01: React Native Bare Workflow vs Expo Go
- **Fecha:** 29/10/2026
- **Estado:** Aceptado
- **Contexto:** La aplicación requiere sockets TCP crudos (`react-native-tcp-socket`), datagramas UDP crudos (`react-native-udp`), cliente SSH nativo con libssh2 (`@dylankenneally/react-native-ssh-sftp`), bindings C++ de SQLite para WatermelonDB y acceso a bajo nivel a VisionCamera y Keychain.
- **Alternativas Evaluadas:**
  1. *Expo Go estándar:* No permite compilar código C++/NDK ni drivers nativos que no formen parte del runtime preconstruido de Expo.
  2. *React Native Bare Workflow (CLI):* Control total del build de Gradle, CocoaPods, Android NDK y linking directo de dependencias nativas.
- **Decisión:** Adoptar **React Native Bare Workflow (React Native 0.88.1 CLI)**.
- **Consecuencias:** Permite enlazar cualquier biblioteca nativa de bajo nivel requerida para telecomunicaciones. Requiere gestionar `AndroidManifest.xml` y configuración de compilación local en Android Studio/Gradle.

---

### ADR-02: WatermelonDB con Generador UUID v4 vs SQLite Nativo Manual
- **Fecha:** 29/10/2026
- **Estado:** Aceptado
- **Contexto:** Se requiere persistencia local relacional para cientos de dispositivos, diagnósticos y reportes de campo en modo offline, con sincronización reactiva hacia la UI.
- **Alternativas Evaluadas:**
  1. *SQLite manual (`react-native-sqlite-storage`):* Requiere escribir migraciones manuales en SQL, serialización JSON explícita y gestión manual de escuchas de cambios.
  2. *WatermelonDB:* Motor reactivo optimizado basado en SQLite con lazy-loading en C++, adaptadores en memoria para tests (LokiJS) y soporte nativo de decoradores TypeScript.
- **Decisión:** Implementar **WatermelonDB** con generación de **UUIDs v4** (`uuid.v4()`) para todas las claves primarias en lugar de claves auto-incrementales enteras.
- **Consecuencias:** Idempotencia estricta en el patrón Outbox. Permite a múltiples técnicos en campo crear reportes simultáneamente sin conflicto de IDs al sincronizar con el backend central.

---

### ADR-03: Implementación Propia de Codec BER/ASN.1 y PDU SNMP
- **Fecha:** 29/10/2026
- **Estado:** Aceptado
- **Contexto:** Se requiere consultar métricas MIB-II sobre UDP/161 (sysName, sysUpTime, contadores de tráfico ifInOctets/ifOutOctets).
- **Alternativas Evaluadas:**
  1. *Bibliotecas NPM existentes (`net-snmp`, `snmpjs`):* Requieren polyfills de Node (`dgram`, `crypto`, `stream`), no están optimizadas para React Native y presentan dependencias vulnerables obsoletas.
  2. *Codec BER/ASN.1 propio en TypeScript puro:* Construcción desde cero de codificador y decodificador BER sin dependencias externas sobre `Buffer`.
- **Decisión:** Desarrollar un **codec BER/ASN.1 y procesador PDU propio** (`src/services/snmp/ber.ts`, `pdu.ts`).
- **Consecuencias:** Cero dependencias externas vulnerables, 100% de cobertura en tests unitarios, compatibilidad garantizada tanto con SNMP v1 como v2c (Counter64, TimeTicks, NoSuchInstance) y portabilidad absoluta.

---

### ADR-04: Estrategia de Descubrimiento LAN en Android 10+ (API 29+)
- **Fecha:** 29/10/2026
- **Estado:** Aceptado
- **Contexto:** En versiones modernas de Android (Android 10 en adelante), el kernel de Linux bloquea el acceso a `/proc/net/arp` para aplicaciones no-root, e impide abrir sockets ICMP crudos (ping).
- **Alternativas Evaluadas:**
  1. *Comando `ping` vía proceso shell (`Runtime.getRuntime().exec`):* Comportamiento inconsistente entre fabricantes (Samsung, Xiaomi, Motorola) y posibles bloqueos de SELinux.
  2. *Estrategia híbrida (mDNS + TCP SYN Concurrente + UDP SNMP Probe):* Escaneo de nombres Bonjour, apertura de sockets TCP crudos con detección de `ECONNREFUSED` y sondeo UDP/161 de reserva.
- **Decisión:** Adoptar la **Estrategia Híbrida** con pool de 32 trabajadores TCP y limitación estricta a subredes `/24` (254 hosts).
- **Consecuencias:** Descubrimiento confiable, veloz (menos de 8 segundos por subred) y 100% compatible con las restricciones de permisos y SELinux de Android 10+.

---

### ADR-05: Perfiles Cerrados de Telecomunicaciones para Sesiones SSH
- **Fecha:** 29/10/2026
- **Estado:** Aceptado
- **Contexto:** Los técnicos necesitan ejecutar diagnósticos sobre equipos en producción mediante SSH sin riesgo de interrupción de servicio accidental.
- **Alternativas Evaluadas:**
  1. *Consola interactiva libre:* Riesgo de comandos destructivos (`reload`, `write erase`, `rm -rf`) o bloqueos por comandos que esperan paginación (`--More--`).
  2. *Perfiles cerrados por fabricante:* Conjunto predefinido de comandos seguros de sólo lectura (`show ...`, `print`, `display ...`) y banderas para deshabilitar paginación (`terminal length 0`).
- **Decisión:** Implementar **Perfiles Cerrados de Vendor** (Cisco IOS, MikroTik RouterOS, OpenWrt, Huawei VRP, Linux Genérico) con detección automática sugerida por `sysDescr`.
- **Consecuencias:** Máxima seguridad operacional, prevención de errores humanos en campo y formateo estructurado de salidas para el reporte técnico.

---

### ADR-06: Patrón Outbox con Retroceso Exponencial y Jitter para Sincronización
- **Fecha:** 29/10/2026
- **Estado:** Aceptado
- **Contexto:** Los técnicos trabajan habitualmente sin cobertura. Cuando el dispositivo recupera conexión a Internet (ej. al regresar a la base operativa o al conectarse a una red 4G), múltiples reportes y fotos acumulados deben subirse de manera confiable.
- **Alternativas Evaluadas:**
  1. *Subida síncrona en pantalla:* Bloquea la interfaz del técnico y falla si la señal cae a mitad de camino.
  2. *Patrón Outbox transaccional en segundo plano:* Cada acción se persiste atómicamente en la tabla `outbox` local; un `SyncManager` reactivo a NetInfo procesa los ítems con reintentos exponenciales y variación aleatoria (jitter ±20%).
- **Decisión:** Implementar el **Patrón Outbox desacoplado con Exponential Backoff y Jitter**.
- **Consecuencias:** Resiliencia total ante interrupciones de red. Tolerancia a caídas del servidor y prevención de tormentas de peticiones (*thundering herd problem*).

---

### ADR-07: Almacenamiento Seguro de Credenciales en Keystore de Hardware
- **Fecha:** 29/10/2026
- **Estado:** Aceptado
- **Contexto:** La aplicación almacena temporalmente credenciales de acceso administrativo a routers (SSH y comunidades SNMP).
- **Alternativas Evaluadas:**
  1. *AsyncStorage / SQLite plano:* Inseguro; expone credenciales en texto plano ante volcados de memoria o copias de seguridad de Android.
  2. *`react-native-keychain` con Hardware Keystore:* Almacenamiento respaldado por chip de seguridad TEE / StrongBox con cifrado asimétrico del sistema operativo.
- **Decisión:** Utilizar **`react-native-keychain`** con nivel `SECURITY_LEVEL.SECURE_HARDWARE` y dominios de servicio aislados (`netdiag.ssh.<deviceId>`).
- **Consecuencias:** Cumplimiento con RNF-04. Credenciales inaccesibles incluso con dispositivo rooteado de forma superficial.

---

### ADR-08: Motor de Reportes PDF con Plantilla HTML A4 Responsive
- **Fecha:** 29/10/2026
- **Estado:** Aceptado
- **Contexto:** Se requiere emitir un reporte técnico firmado al finalizar la instalación para entrega al cliente o adjuntar al ticket de soporte.
- **Alternativas Evaluadas:**
  1. *Librería PDF canvas manual (`pdfkit`):* Dibujo por coordenadas x,y extremadamente rígido y propenso a desbordamientos de texto.
  2. *Generación HTML A4 con CSS paged media compilado a PDF nativo:* Plantilla semántica HTML5 con tipografía monoespaciada para tablas de interfaces, mapas de bits Base64 para fotos y sanitización XSS.
- **Decisión:** Implementar **plantilla HTML responsive compilada a PDF** mediante `react-native-html-to-pdf`.
- **Consecuencias:** Reportes con estética editorial profesional, paginación limpia, fotos incrustadas sin dependencias de red y facilidad para compartir vía WhatsApp, correo o almacenamiento local.
