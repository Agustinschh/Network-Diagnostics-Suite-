# Checklist de Progreso de Fases — Network Diagnostics Suite

- [x] **Fase 0 — Bootstrap y validación de módulos nativos**
  - [x] Repositorio Git inicializado y `.gitignore` configurado.
  - [x] Documentos de arquitectura y decisiones creados.
  - [x] Proyecto React Native CLI (`app/`) inicializado (RN 0.88.1 Bare Workflow).
  - [x] Dependencias nativas instaladas y configuradas (`newArchEnabled=false` en gradle.properties para sockets legados).
  - [x] Permisos configurados en `AndroidManifest.xml` (red, Wi-Fi multicast, GPS, cámara).
  - [x] Smoke test de verificación nativa implementado (`src/dev/NativeSmokeTest.tsx`).
  - [x] Suite de tests Jest (`npm test`) y verificación de tipos (`tsc --noEmit`) pasando en verde.
- [ ] **Fase 1 — Sistema de diseño y navegación**
- [ ] **Fase 2 — Persistencia local (WatermelonDB)**
- [ ] **Fase 3 — Descubrimiento LAN (RF-01)**
- [ ] **Fase 4 — Cliente SNMP y codec BER (RF-02)**
- [ ] **Fase 5 — Credenciales seguras y SSH (RF-03)**
- [ ] **Fase 6 — Cámara, QR, fotos y GPS (RF-04, RF-05)**
- [ ] **Fase 7 — Instalación y reporte PDF (RF-05, RF-06)**
- [ ] **Fase 8 — Backend stub y sincronización outbox (RF-07)**
- [ ] **Fase 9 — Historial (RF-08)**
- [ ] **Fase 10 — QA, APK release, documentación y demo**
