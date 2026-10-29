import { formatUptime, formatBytes } from '../../utils/format';

export interface ReportData {
  installationId: string;
  createdAt: number;
  siteName: string;
  clientName: string;
  technicianName: string;
  technicianNotes?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  device: {
    ipAddress: string;
    macAddress?: string;
    serialNumber?: string;
    vendor?: string;
    model?: string;
    hostname?: string;
  };
  snmpDiagnostic?: {
    sysName?: string;
    sysDescr?: string;
    uptimeTicks?: number;
    interfaces?: Array<{
      index: number;
      descr: string;
      mac?: string;
      operStatus: string;
      inOctets: number;
      outOctets: number;
    }>;
  };
  sshDiagnostic?: {
    profile?: string;
    output?: string;
  };
  photos: Array<{
    type: string;
    base64Data: string;
  }>;
}

export function escapeHtml(str?: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Trunca la salida de consola SSH a un máximo de 200 líneas por seguridad visual en impresión.
 */
export function truncateSshOutput(output?: string, maxLines: number = 200): string {
  if (!output) return 'Sin salida registrada.';
  const lines = output.split('\n');
  if (lines.length <= maxLines) {
    return output;
  }
  return (
    lines.slice(0, maxLines).join('\n') +
    `\n\n[... salida truncada en el reporte: ${lines.length - maxLines} líneas adicionales omitidas ...]`
  );
}

/**
 * Genera el documento HTML completo para el reporte de instalación en hoja A4.
 */
export function buildReportHtml(data: ReportData): string {
  const shortId = data.installationId.slice(0, 8).toUpperCase();
  const dateStr = new Date(data.createdAt).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const mapsUrl = data.location
    ? `https://maps.google.com/?q=${data.location.latitude},${data.location.longitude}`
    : '';

  // Fotos HTML
  const photosHtml =
    data.photos && data.photos.length > 0
      ? data.photos
          .map(
            (p, idx) => `
        <div class="photo-card">
          <img src="${p.base64Data.startsWith('data:') ? p.base64Data : `data:image/jpeg;base64,${p.base64Data}`}" alt="Foto ${idx + 1}" />
          <div class="photo-caption">${escapeHtml(p.type)}</div>
        </div>
      `
          )
          .join('')
      : '<p class="muted">No se adjuntaron fotografías de evidencia.</p>';

  // Interfaces HTML
  const ifacesHtml =
    data.snmpDiagnostic?.interfaces && data.snmpDiagnostic.interfaces.length > 0
      ? `
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Descripción</th>
            <th>MAC</th>
            <th>Estado</th>
            <th>Tráfico Entrada</th>
            <th>Tráfico Salida</th>
          </tr>
        </thead>
        <tbody>
          ${data.snmpDiagnostic.interfaces
            .map(
              (i) => `
            <tr>
              <td>${i.index}</td>
              <td>${escapeHtml(i.descr)}</td>
              <td><code>${escapeHtml(i.mac || 'N/A')}</code></td>
              <td><span class="badge ${i.operStatus === 'up' ? 'badge-up' : 'badge-down'}">${i.operStatus.toUpperCase()}</span></td>
              <td>${formatBytes(i.inOctets)}</td>
              <td>${formatBytes(i.outOctets)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `
      : '<p class="muted">No hay interfaces registradas en este diagnóstico.</p>';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Instalación - ${escapeHtml(data.siteName)}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0E1116;
      background: #FFFFFF;
      line-height: 1.5;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2F5BEA;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 22pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #2F5BEA;
    }
    .report-title {
      font-size: 14pt;
      font-weight: 600;
      color: #4A5361;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-box {
      text-align: right;
      font-size: 9pt;
      color: #8A93A1;
    }
    .meta-id {
      font-size: 11pt;
      font-weight: 700;
      color: #0E1116;
    }
    h2 {
      font-size: 12pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #2F5BEA;
      border-bottom: 1px solid #E3E6EA;
      padding-bottom: 4px;
      margin-top: 24px;
      margin-bottom: 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .field-group {
      margin-bottom: 8px;
    }
    .field-label {
      font-size: 8pt;
      text-transform: uppercase;
      font-weight: 700;
      color: #8A93A1;
    }
    .field-value {
      font-size: 11pt;
      font-weight: 500;
      color: #0E1116;
    }
    .terminal-box {
      background: #F6F7F9;
      border: 1px solid #E3E6EA;
      border-radius: 4px;
      padding: 10px;
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 8.5pt;
      white-space: pre-wrap;
      word-break: break-all;
      color: #1F2733;
      max-height: 400px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-top: 8px;
    }
    .data-table th, .data-table td {
      border: 1px solid #E3E6EA;
      padding: 6px 8px;
      text-align: left;
    }
    .data-table th {
      background: #F6F7F9;
      font-weight: 600;
      color: #4A5361;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-up {
      background: #E8F6EE;
      color: #15803D;
    }
    .badge-down {
      background: #FDECEC;
      color: #C62828;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 10px;
      page-break-inside: avoid;
    }
    .photo-card {
      border: 1px solid #E3E6EA;
      border-radius: 6px;
      overflow: hidden;
      background: #F6F7F9;
    }
    .photo-card img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      display: block;
    }
    .photo-caption {
      padding: 6px 10px;
      font-size: 8.5pt;
      font-weight: 600;
      color: #4A5361;
      text-align: center;
      background: #FFFFFF;
      border-top: 1px solid #E3E6EA;
    }
    .notes-box {
      background: #F6F7F9;
      border-left: 3px solid #2F5BEA;
      padding: 10px;
      font-size: 10pt;
      margin-top: 8px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      page-break-inside: avoid;
    }
    .signature-line {
      border-top: 1px solid #0E1116;
      width: 220px;
      text-align: center;
      padding-top: 6px;
      font-size: 9.5pt;
      font-weight: 600;
    }
    .muted {
      color: #8A93A1;
      font-size: 9pt;
      font-style: italic;
    }
    code {
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 8.5pt;
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="brand">NetDiag Suite</div>
      <div class="report-title">Reporte Técnico de Instalación</div>
    </div>
    <div class="meta-box">
      <div class="meta-id">ORDEN #${shortId}</div>
      <div>Fecha: ${dateStr}</div>
    </div>
  </div>

  <h2>1. Datos del Sitio y Cliente</h2>
  <div class="grid">
    <div class="field-group">
      <div class="field-label">Sitio / Nodo</div>
      <div class="field-value">${escapeHtml(data.siteName)}</div>
    </div>
    <div class="field-group">
      <div class="field-label">Cliente</div>
      <div class="field-value">${escapeHtml(data.clientName)}</div>
    </div>
    <div class="field-group">
      <div class="field-label">Técnico Responsable</div>
      <div class="field-value">${escapeHtml(data.technicianName)}</div>
    </div>
    <div class="field-group">
      <div class="field-label">Geolocalización GPS</div>
      <div class="field-value">
        ${
          data.location
            ? `${data.location.latitude.toFixed(6)}, ${data.location.longitude.toFixed(6)} <span class="muted">(±${data.location.accuracy.toFixed(1)}m)</span><br><a href="${mapsUrl}" target="_blank" style="color:#2F5BEA; font-size:8.5pt; text-decoration:none;">Ver en Google Maps</a>`
            : '<span class="muted">No registrada</span>'
        }
      </div>
    </div>
  </div>

  <h2>2. Identificación del Equipo Instalado</h2>
  <div class="grid">
    <div class="field-group">
      <div class="field-label">Dirección IP</div>
      <div class="field-value"><code>${escapeHtml(data.device.ipAddress)}</code></div>
    </div>
    <div class="field-group">
      <div class="field-label">Nombre de Host</div>
      <div class="field-value">${escapeHtml(data.device.hostname || 'Sin nombre')}</div>
    </div>
    <div class="field-group">
      <div class="field-label">Dirección MAC</div>
      <div class="field-value"><code>${escapeHtml(data.device.macAddress || 'No detectada')}</code></div>
    </div>
    <div class="field-group">
      <div class="field-label">Número de Serie</div>
      <div class="field-value"><code>${escapeHtml(data.device.serialNumber || 'No registrado')}</code></div>
    </div>
    <div class="field-group">
      <div class="field-label">Fabricante / Proveedor</div>
      <div class="field-value">${escapeHtml(data.device.vendor || 'No identificado')}</div>
    </div>
    <div class="field-group">
      <div class="field-label">Modelo</div>
      <div class="field-value">${escapeHtml(data.device.model || 'No especificado')}</div>
    </div>
  </div>

  ${
    data.snmpDiagnostic
      ? `
  <h2>3. Diagnóstico de Telemetría SNMP</h2>
  <div class="grid">
    <div class="field-group">
      <div class="field-label">sysName</div>
      <div class="field-value">${escapeHtml(data.snmpDiagnostic.sysName || 'N/A')}</div>
    </div>
    <div class="field-group">
      <div class="field-label">Tiempo de Actividad (Uptime)</div>
      <div class="field-value">${formatUptime(data.snmpDiagnostic.uptimeTicks || 0)}</div>
    </div>
    <div class="field-group" style="grid-column: span 2;">
      <div class="field-label">sysDescr</div>
      <div class="field-value" style="font-size:9.5pt;">${escapeHtml(data.snmpDiagnostic.sysDescr || 'N/A')}</div>
    </div>
  </div>
  <div style="margin-top:10px;">
    <div class="field-label">Tabla de Interfaces de Red (MIB-II)</div>
    ${ifacesHtml}
  </div>
  `
      : ''
  }

  ${
    data.sshDiagnostic
      ? `
  <h2>4. Diagnóstico de Configuración SSH</h2>
  <div class="field-group">
    <div class="field-label">Perfil Ejecutado</div>
    <div class="field-value"><strong>${escapeHtml(data.sshDiagnostic.profile || 'Personalizado')}</strong></div>
  </div>
  <div class="terminal-box">${escapeHtml(truncateSshOutput(data.sshDiagnostic.output))}</div>
  `
      : ''
  }

  <h2>5. Evidencia Fotográfica</h2>
  <div class="photos-grid">
    ${photosHtml}
  </div>

  <h2>6. Observaciones Técnicas</h2>
  <div class="notes-box">
    ${escapeHtml(data.technicianNotes || 'Sin observaciones adicionales registradas.')}
  </div>

  <div class="footer">
    <div>
      <p class="muted" style="margin:0;">Generado automáticamente por NetDiag Mobile Suite.<br>Copia fiel de diagnóstico en campo.</p>
    </div>
    <div class="signature-line">
      ${escapeHtml(data.technicianName)}<br>
      <span class="muted" style="font-size:8pt; font-weight:normal;">Firma y aclaración del técnico</span>
    </div>
  </div>

</body>
</html>
  `.trim();
}
