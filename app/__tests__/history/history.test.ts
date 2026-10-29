import { database } from '../../src/db';
import {
  devicesRepository,
  diagnosticsRepository,
  installationsRepository,
} from '../../src/db/repositories';
import { formatBytes, formatUptime, formatDate } from '../../src/utils/format';

describe('History & Telemetry Delta Comparison (RF-08)', () => {
  beforeEach(async () => {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  it('retrieves previous diagnostic for same device and calculates accurate traffic deltas', async () => {
    // 1. Crear dispositivo
    const device = await devicesRepository.upsertByIp({
      ipAddress: '10.0.0.1',
      hostname: 'core-router.telecom.local',
    });

    // 2. Primer diagnóstico (hace 10 minutos)
    const t0 = new Date(Date.now() - 600000);
    const diag1 = await database.write(async () => {
      return await diagnosticsRepository.getCollection().create((rec) => {
        rec.deviceId = device.id;
        rec.kind = 'snmp';
        rec.snmpSysName = 'CoreRouter-01';
        rec.snmpSysDescr = 'Cisco IOS-XE 17.3';
        rec.snmpUptimeTicks = 100000;
        rec.snmpInterfacesJson = JSON.stringify([
          { index: 1, descr: 'GigabitEthernet0/0', operStatus: 1, inOctets: 5000000, outOctets: 2000000 },
          { index: 2, descr: 'GigabitEthernet0/1', operStatus: 1, inOctets: 1000000, outOctets: 500000 },
        ]);
        rec.success = true;
        // Asignar created_at previo manualmente
        (rec._raw as any).created_at = t0.getTime();
      });

    });

    // 3. Segundo diagnóstico (actual)
    const diag2 = await database.write(async () => {
      return await diagnosticsRepository.getCollection().create((rec) => {
        rec.deviceId = device.id;
        rec.kind = 'snmp';
        rec.snmpSysName = 'CoreRouter-01';
        rec.snmpSysDescr = 'Cisco IOS-XE 17.3';
        rec.snmpUptimeTicks = 160000;
        rec.snmpInterfacesJson = JSON.stringify([
          // GigabitEthernet0/0 incrementó 3 MB de entrada y 1.5 MB de salida
          { index: 1, descr: 'GigabitEthernet0/0', operStatus: 1, inOctets: 8145728, outOctets: 3572864 },
          // GigabitEthernet0/1 se reinició el contador (reboot o overflow)
          { index: 2, descr: 'GigabitEthernet0/1', operStatus: 1, inOctets: 200000, outOctets: 100000 },
        ]);
        rec.success = true;
      });
    });

    // 4. Buscar diagnóstico anterior a diag2
    const prev = await diagnosticsRepository.getPreviousDiagnostic(
      diag2.deviceId,
      diag2.createdAt,
      'snmp'
    );

    expect(prev).not.toBeNull();
    expect(prev!.id).toBe(diag1.id);

    // 5. Validar cálculo de deltas
    const currIfaces = diag2.parsedInterfaces;
    const prevIfaces = prev!.parsedInterfaces;
    const prevMap = new Map<string, any>(prevIfaces.map((i) => [String(i.index), i]));

    // Interfaz 1: Incremento normal
    const iface1 = currIfaces.find((i) => i.index === 1);
    const iface1Prev = prevMap.get('1');
    const delta1In = iface1.inOctets - iface1Prev.inOctets;
    const delta1Out = iface1.outOctets - iface1Prev.outOctets;

    expect(delta1In).toBe(3145728); // ~3 MB
    expect(delta1Out).toBe(1572864); // ~1.5 MB
    expect(delta1In).toBeGreaterThan(0);
    expect(formatBytes(delta1In)).toBe('3,0 MB');

    // Interfaz 2: Reinicio de contador
    const iface2 = currIfaces.find((i) => i.index === 2);
    const iface2Prev = prevMap.get('2');
    const delta2In = iface2.inOctets - iface2Prev.inOctets;
    expect(delta2In).toBeLessThan(0); // Detección de reinicio
  });

  it('manages installations history with drafts and finalizations', async () => {
    const dev = await devicesRepository.upsertByIp({ ipAddress: '192.168.1.1' });

    const draft = await installationsRepository.createDraft({
      deviceId: dev.id,
      siteName: 'Antena Cerros',
      clientName: 'Cliente A',
    });

    expect(draft.status).toBe('draft');

    await installationsRepository.finalize(draft.id, '/storage/reports/report-1.pdf');
    const updated = await installationsRepository.getById(draft.id);

    expect(updated?.status).toBe('finalized');
    expect(updated?.pdfLocalPath).toBe('/storage/reports/report-1.pdf');
  });

  it('formats dates, uptimes and bytes properly for UI display', () => {
    expect(formatUptime(8640000)).toBe('1 d 0 h');
    expect(formatBytes(1048576)).toBe('1,0 MB');
    expect(formatBytes(0)).toBe('0 B');

    const d = new Date(2026, 9, 29, 14, 30);
    expect(formatDate(d)).toBe('29/10/2026 14:30');
  });
});
