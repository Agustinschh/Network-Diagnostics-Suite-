import { buildReportHtml, escapeHtml, truncateSshOutput, ReportData } from '../../src/services/report/template';

describe('Report HTML Template and Sanitization', () => {
  const sampleData: ReportData = {
    installationId: 'abcd-1234-uuid-test',
    createdAt: 1730000000000,
    siteName: 'Torre Central <script>alert("xss")</script>',
    clientName: 'Telecom & Co',
    technicianName: 'Juan "El Técnico" Pérez',
    technicianNotes: 'Potencia óptica: -19.4 dBm. Todo en orden > test.',
    location: {
      latitude: -34.603722,
      longitude: -58.381592,
      accuracy: 8.5,
    },
    device: {
      ipAddress: '192.168.1.1',
      hostname: 'core-router-01',
      macAddress: 'd4:ca:6d:11:22:33',
      serialNumber: 'SN-99887766',
      vendor: 'MikroTik',
      model: 'CCR1036-8G-2S+',
    },
    snmpDiagnostic: {
      sysName: 'CCR-Torre-01',
      sysDescr: 'RouterOS v7.12.1',
      uptimeTicks: 45000000, // 5d 5h
      interfaces: [
        {
          index: 1,
          descr: 'sfp-sfpplus1',
          mac: 'd4:ca:6d:11:22:34',
          operStatus: 'up',
          inOctets: 104857600, // 100 MB
          outOctets: 52428800,  // 50 MB
        },
      ],
    },
    sshDiagnostic: {
      profile: 'mikrotik',
      output: '$ /system resource print\nuptime: 5d5h\nversion: 7.12.1',
    },
    photos: [
      {
        type: 'RACK',
        base64Data: 'mock_base64_rack_data',
      },
    ],
  };

  it('escapes dangerous HTML characters properly', () => {
    const raw = '<script>alert("test")</script> & \'hello\'';
    const escaped = escapeHtml(raw);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&amp;');
    expect(escaped).toContain('&quot;test&quot;');
  });

  it('generates complete HTML containing all mandatory sections and escapes user input', () => {
    const html = buildReportHtml(sampleData);

    // Encabezado y títulos
    expect(html).toContain('NetDiag Suite');
    expect(html).toContain('Reporte Técnico de Instalación');
    expect(html).toContain('ORDEN #ABCD-123');

    // Datos del sitio y cliente sanitizados
    expect(html).toContain('Torre Central &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(html).toContain('Telecom &amp; Co');
    expect(html).toContain('Juan &quot;El Técnico&quot; Pérez');

    // Ubicación GPS y enlace maps
    expect(html).toContain('-34.603722, -58.381592');
    expect(html).toContain('https://maps.google.com/?q=-34.603722,-58.381592');

    // Equipo
    expect(html).toContain('192.168.1.1');
    expect(html).toContain('d4:ca:6d:11:22:33');
    expect(html).toContain('SN-99887766');
    expect(html).toContain('MikroTik');

    // SNMP y tabla de interfaces
    expect(html).toContain('sfp-sfpplus1');
    expect(html).toContain('badge-up');

    // SSH
    expect(html).toContain('/system resource print');

    // Fotos incrustadas con base64
    expect(html).toContain('data:image/jpeg;base64,mock_base64_rack_data');
    expect(html).toContain('RACK');

    // Observaciones y firma
    expect(html).toContain('Potencia óptica: -19.4 dBm');
    expect(html).toContain('Firma y aclaración del técnico');
  });

  it('truncates SSH output when lines exceed the maximum line limit', () => {
    const longOutput = Array.from({ length: 250 }, (_, i) => `line ${i + 1}`).join('\n');
    const truncated = truncateSshOutput(longOutput, 200);

    const lines = truncated.split('\n');
    expect(lines.length).toBeLessThan(210);
    expect(truncated).toContain('salida truncada en el reporte');
  });

  it('keeps SSH output intact when lines are within the limit', () => {
    const shortOutput = 'command 1\nresult 1\ncommand 2\nresult 2';
    const truncated = truncateSshOutput(shortOutput, 200);
    expect(truncated).toBe(shortOutput);
  });
});
