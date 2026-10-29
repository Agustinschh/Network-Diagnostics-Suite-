# Network Diagnostics Suite (NetDiag) 📡📱

> **Toolkit móvil de diagnóstico de infraestructura de telecomunicaciones para técnicos de campo.**  
> *Asignatura: Desarrollo de Aplicaciones Móviles (2026)*  
> *Carrera: Licenciatura en Sistemas de Información*

---

## 🚀 Resumen del Sistema

**NetDiag** es una aplicación móvil profesional construida bajo el enfoque **Offline-First** sobre **React Native Bare Workflow (CLI)**. Permite a técnicos de telecomunicaciones auditar, diagnosticar y documentar instalaciones de nodos de red (ONTs, Routers, Switches, Enlaces inalámbricos) en entornos hostiles y sin conectividad a Internet (salas de servidores, azoteas, gabinetes urbanos).

La aplicación interactúa directamente con la red de gestión local del nodo a través de **sockets TCP/UDP crudos** y **SSH nativo**, persistiendo toda la actividad en una base de datos reactiva local (**WatermelonDB / SQLite**) y gestionando la sincronización diferida hacia el backend mediante una cola transaccional (**Outbox Pattern**).

---

## 📋 Características Principales

| Requisito | Funcionalidad | Implementación Técnica |
| :--- | :--- | :--- |
| **RF-01** | **Descubrimiento LAN** | Subred CIDR (/24), mDNS/Bonjour y pool concurrente de 32 trabajadores TCP + sondeo UDP. |
| **RF-02** | **Telemetría SNMP** | Codec BER/ASN.1 propio (UDP/161), OIDs MIB-II (`sysName`, `sysUpTime`, `ifTable`), fallback v2c -> v1. |
| **RF-03** | **Diagnósticos SSH** | Túnel seguro nativo (`react-native-ssh-sftp`), perfiles cerrados por fabricante (Cisco, MikroTik, OpenWrt, Huawei, Linux) y terminal visual. |
| **RF-04** | **Escáner Óptico QR/Barras** | `react-native-vision-camera` v5, normalización de direcciones MAC y detección de seriales duplicados. |
| **RF-05** | **Evidencia Fotográfica & GPS** | Geocodificación GPS de alta precisión ($\le 30\text{ m}$), compresión JPEG 70 (1600 px) y cuota de 12 fotos. |
| **RF-06** | **Reporte Técnico PDF** | Generación local en PDF A4 (`react-native-html-to-pdf`), fotos incrustadas en Base64, sanitización XSS y selector nativo de compartir. |
| **RF-07** | **Sincronización Outbox** | Cola transaccional persistente, escucha de conectividad Wi-Fi (NetInfo), reintentos con Exponential Backoff y Jitter (±20%). |
| **RF-08** | **Historial & Deltas de Tráfico** | Búsqueda reactiva, comparación cronológica de telemetría SNMP con cálculo de deltas (`inOctets - inOctets_previo`). |

---

## 📂 Estructura del Repositorio

```text
trabajo 6/
├── app/                          # Frontend móvil React Native (Bare Workflow)
│   ├── android/                  # Proyecto nativo Gradle Android (minSdk 26, targetSdk 34)
│   ├── src/
│   │   ├── components/           # Componentes UI minimalistas (Screen, Card, Badge, TerminalView)
│   │   ├── config/               # Constantes de puertos, timeouts y perfiles
│   │   ├── db/                   # WatermelonDB (Esquema v1, Modelos relacionales, Repositorios)
│   │   ├── navigation/           # React Navigation (TabsNavigator + RootNavigator tipados)
│   │   ├── screens/              # Pantallas operativas (network, snmp, ssh, evidence, history, settings)
│   │   ├── services/             # Servicios de dominio (discovery, snmp, ssh, evidence, report, sync)
│   │   ├── store/                # Stores de estado reactivo (scanStore, settingsStore con Zustand)
│   │   ├── theme/                # Tokens de diseño, alto contraste y paletas Claro/Oscuro
│   │   └── utils/                # Utilidades puras (codec BER, backoff con jitter, formateo, errores)
│   └── __tests__/                # 11 suites de pruebas unitarias y de integración Jest (42 tests)
├── backend/                      # Servidor stub de sincronización (Node.js + Express + SQLite)
│   ├── src/server.js             # API REST con idempotencia UUID y simulación de fallas de red
│   └── package.json
├── docs/                         # Documentación técnica de soporte
│   ├── ARQUITECTURA.md           # Arquitectura integral, diagramas ER y de secuencia
│   ├── DECISIONES.md             # Registro de Decisiones de Arquitectura (ADRs 01 al 08)
│   └── PROGRESO.md               # Checklist de verificación por fases (Fase 0 a Fase 10)
├── INFORME_REQUERIMIENTOS.md     # Especificación técnica formal (RFs y RNFs)
├── PLAN_IMPLEMENTACION.md        # Plan de trabajo exhaustivo por fases
├── GUIA_ESTILOS.md               # Sistema de diseño, tokens y reglas de UX móvil
└── README.md                     # Guía principal de uso y ejecución
```

---

## 🛠️ Requisitos Previos

- **Node.js:** v18.0.0 o superior (recomendado LTS v20+).
- **Java Development Kit (JDK):** JDK 17 o JDK 21+ (Eclipse Temurin / OpenJDK).
- **Android SDK:** SDK Platform 34+, Build-Tools 34.0.0+, Android NDK 26+.
- **Dispositivo Físico Android o Emulador:** Con Android 8.0 (API 26) o superior conectado a una red Wi-Fi local para interactuar con equipos reales.

---

## ⚡ Guía de Inicio Rápido

### 1. Iniciar el Backend Stub de Sincronización
En una terminal independiente, levante el servidor de sincronización:
```bash
cd backend
npm install
npm start
```
El servidor quedará a la escucha en `http://localhost:3000` (o `http://<IP_DE_TU_PC>:3000` accesible desde la red local o emulador `10.0.2.2:3000`).

Endpoints disponibles:
- `GET /health` — Verificación de salud y estado de la base de datos SQLite.
- `POST /api/v1/sync/installation` — Recepción idempotente de reportes de instalación (UUID).
- `POST /api/v1/sync/diagnostic` — Recepción idempotente de telemetría SNMP y sesiones SSH.
- `POST /api/v1/sync/photo` — Subida de evidencias fotográficas en Base64 / Multipart.

Headers de simulación para pruebas en terreno:
- `X-Simulate-Error: 500` (o `503`, `400`) — Simula caídas del enlace o fallos del servidor.
- `X-Simulate-Delay: 3000` — Simula enlaces satelitales con alta latencia (milisegundos).

---

### 2. Ejecutar la Aplicación Móvil

#### A. Instalar dependencias
```bash
cd app
npm install
```

#### B. Ejecutar validación de tipos y suites de tests
```bash
# Verificación de TypeScript (0 errores)
npx tsc --noEmit

# Ejecutar las 11 suites de pruebas unitarias Jest
npm test
```

#### C. Iniciar el empaquetador Metro
```bash
npm start
```

#### D. Compilar y ejecutar en Android (Dispositivo o Emulador)
```bash
npm run android
```

---

## 📦 Compilación del APK de Release

Para generar el paquete binario instalable (`.apk`) de producción para Android:

```bash
cd app/android
./gradlew assembleRelease
```
El archivo resultante se generará en:  
`app/android/app/build/outputs/apk/release/app-release.apk`

---

## 🔒 Modelo de Seguridad y Credenciales (RNF-04)

- Las credenciales de administración SSH y las comunidades SNMP se almacenan exclusivamente en el **Hardware Keystore** de Android (`react-native-keychain`) bajo servicios aislados por dispositivo (`netdiag.ssh.<deviceId>` y `netdiag.snmp.<deviceId>`).
- Jamás se almacenan contraseñas en texto plano en la base de datos WatermelonDB, AsyncStorage ni en los archivos de log de la aplicación.
- Las salidas de consola SSH y campos de texto se sanean automáticamente contra ataques de Cross-Site Scripting (XSS) antes de renderizarse en el reporte PDF.

---

## 📄 Licencia y Créditos
Desarrollado para la asignatura **Desarrollo de Aplicaciones Móviles (2026)**.  
Licenciatura en Sistemas de Información.

Al estar corriendo la app en android studio, no puedo probar ciertas funciones ya que no dispongo del hardware necesario. la app reconoce cuando esta corriendo el emulador y usa una ip local del emulador para conectarse al backend. no pude probar la geolocalización ni la camara. tampoco pude probar la detección de QR ni de barras.

un video de preba esta subido a mi drive en 
https://drive.google.com/file/d/1HrtDQS9mHtZJBDgc6Pric9pkVsR5yEtU/view?usp=sharing
muestra  la prueba de la app en android studio, con sus pantallas principales y funcionales
