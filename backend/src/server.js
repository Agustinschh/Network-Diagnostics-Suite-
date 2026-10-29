const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de CORS y JSON con límite amplio para fotografías en Base64
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Inicialización de SQLite
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'netdiag_sync.db'));

// Inicializar tablas para persistencia idempotente
db.exec(`
  CREATE TABLE IF NOT EXISTS server_installations (
    id TEXT PRIMARY KEY,
    device_id TEXT,
    site_name TEXT,
    client_name TEXT,
    technician_name TEXT,
    latitude REAL,
    longitude REAL,
    accuracy REAL,
    diagnostic_ids_json TEXT,
    pdf_local_path TEXT,
    status TEXT,
    payload_json TEXT,
    synced_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS server_diagnostics (
    id TEXT PRIMARY KEY,
    device_id TEXT,
    kind TEXT,
    ssh_profile TEXT,
    success INTEGER,
    error_code TEXT,
    payload_json TEXT,
    synced_at INTEGER
  );
`);

// Middleware para simular latencia o errores de red vía encabezados HTTP
app.use((req, res, next) => {
  const simError = req.header('X-Simulate-Error');
  const simDelay = req.header('X-Simulate-Delay');

  const proceed = () => {
    if (simError) {
      const code = parseInt(simError, 10) || 500;
      return res.status(code).json({
        error: 'SIMULATED_ERROR',
        message: `Error simulado por encabezado HTTP (${code})`,
      });
    }
    next();
  };

  if (simDelay) {
    const ms = parseInt(simDelay, 10) || 1000;
    setTimeout(proceed, ms);
  } else {
    proceed();
  }
});

// 1. Healthcheck
app.get('/api/v1/sync/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    version: '1.0.0',
    service: 'NetDiag Sync Backend Stub',
  });
});

// 2. Sincronización de instalaciones (Idempotente)
app.post('/api/v1/sync/installations', (req, res) => {
  const payload = req.body;
  const id = payload.installationId || payload.id;

  if (!id) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Se requiere ID de instalación' });
  }

  try {
    const existing = db.prepare('SELECT id FROM server_installations WHERE id = ?').get(id);

    if (existing) {
      return res.status(200).json({
        status: 'already_exists',
        id,
        message: 'Instalación ya registrada previamente (idempotente).',
      });
    }

    const insert = db.prepare(`
      INSERT INTO server_installations (
        id, device_id, site_name, client_name, technician_name,
        latitude, longitude, accuracy, diagnostic_ids_json, pdf_local_path,
        status, payload_json, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      payload.deviceId || null,
      payload.siteName || null,
      payload.clientName || null,
      payload.technicianName || null,
      payload.latitude || null,
      payload.longitude || null,
      payload.accuracy || null,
      JSON.stringify(payload.diagnosticIds || []),
      payload.pdfLocalPath || null,
      payload.status || 'finalized',
      JSON.stringify(payload),
      Date.now()
    );

    console.log(`[BACKEND] Instalación sincronizada: ${id} (${payload.siteName})`);
    return res.status(201).json({ status: 'created', id });
  } catch (err) {
    console.error('[BACKEND] Error al procesar instalación:', err);
    return res.status(500).json({ error: 'DB_ERROR', message: err.message });
  }
});

// 3. Sincronización de diagnósticos (Idempotente)
app.post('/api/v1/sync/diagnostics', (req, res) => {
  const payload = req.body;
  const id = payload.diagnosticId || payload.id;

  if (!id) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Se requiere ID de diagnóstico' });
  }

  try {
    const existing = db.prepare('SELECT id FROM server_diagnostics WHERE id = ?').get(id);

    if (existing) {
      return res.status(200).json({
        status: 'already_exists',
        id,
        message: 'Diagnóstico ya registrado previamente (idempotente).',
      });
    }

    const insert = db.prepare(`
      INSERT INTO server_diagnostics (
        id, device_id, kind, ssh_profile, success, error_code, payload_json, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      payload.deviceId || null,
      payload.kind || 'snmp',
      payload.sshProfile || null,
      payload.success ? 1 : 0,
      payload.errorCode || null,
      JSON.stringify(payload),
      Date.now()
    );

    console.log(`[BACKEND] Diagnóstico sincronizado: ${id} (${payload.kind})`);
    return res.status(201).json({ status: 'created', id });
  } catch (err) {
    console.error('[BACKEND] Error al procesar diagnóstico:', err);
    return res.status(500).json({ error: 'DB_ERROR', message: err.message });
  }
});

// 4. Resumen estadístico
app.get('/api/v1/sync/summary', (req, res) => {
  const totalInstallations = db.prepare('SELECT count(*) as count FROM server_installations').get().count;
  const totalDiagnostics = db.prepare('SELECT count(*) as count FROM server_diagnostics').get().count;
  res.json({
    totalInstallations,
    totalDiagnostics,
  });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NetDiag Sync Stub] Escuchando en http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;
