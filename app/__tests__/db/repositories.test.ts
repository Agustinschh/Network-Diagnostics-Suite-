import { database } from '../../src/db';
import {
  devicesRepository,
  diagnosticsRepository,
  installationsRepository,
  outboxRepository,
} from '../../src/db/repositories';

describe('WatermelonDB Repositories & Transactions', () => {
  beforeEach(async () => {
    // Limpiar base de datos en memoria para cada prueba
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  it('creates device, diagnostic, installation and outbox item in transactional consistency', async () => {
    // 1. Crear dispositivo
    const device = await devicesRepository.upsertByIp({
      ipAddress: '192.168.88.1',
      hostname: 'mikrotik.nodo.local',
      macAddress: 'cc:2d:e0:11:22:33',
      vendor: 'MikroTik',
      model: 'hAP ac2',
      openPorts: [22, 80, 161, 8291],
      discoverySource: 'tcp',
    });

    expect(device.id).toBeDefined();
    expect(device.id.length).toBeGreaterThan(10); // UUID format
    expect(device.ipAddress).toBe('192.168.88.1');
    expect(device.parsedOpenPorts).toEqual([22, 80, 161, 8291]);

    // 2. Crear diagnóstico SNMP asociado
    const diagnostic = await diagnosticsRepository.create({
      deviceId: device.id,
      kind: 'snmp',
      snmpSysName: 'MikroTik-Router',
      snmpSysDescr: 'RouterOS 7.12.1',
      snmpUptimeTicks: 360000,
      snmpInterfaces: [
        { index: 1, descr: 'ether1', operStatus: 'up', inOctets: 1024, outOctets: 2048 },
      ],
      success: true,
    });

    expect(diagnostic.id).toBeDefined();
    expect(diagnostic.deviceId).toBe(device.id);
    expect(diagnostic.parsedInterfaces).toHaveLength(1);

    // 3. Crear borrador de instalación y finalizar con outbox
    const installation = await installationsRepository.createDraft({
      deviceId: device.id,
      siteName: 'Nodo Rural El Ombú',
      clientName: 'Cooperativa de Servicios',
      technicianName: 'Agustín',
    });

    await installationsRepository.update(installation.id, {
      latitude: -34.603722,
      longitude: -58.381592,
      accuracy: 8.5,
      technicianNotes: 'Instalación de ONT y router de borde completada.',
      diagnosticIds: [diagnostic.id],
    });

    await installationsRepository.finalize(installation.id, '/storage/reports/report_001.pdf');

    // 4. Encolar en Outbox
    const outboxItem = await outboxRepository.enqueue(
      'INSTALLATION',
      installation.id,
      {
        site: 'Nodo Rural El Ombú',
        deviceIp: device.ipAddress,
      }
    );

    expect(outboxItem.id).toBeDefined();
    expect(outboxItem.status).toBe('PENDING');
    expect(outboxItem.retryCount).toBe(0);

    // 5. Validar consulta de pendientes en Outbox
    const dueItems = await outboxRepository.takeDue(Date.now() + 1000, 10);
    expect(dueItems).toHaveLength(1);
    expect(dueItems[0].entityId).toBe(installation.id);
  });

  it('correctly handles identity update on existing device', async () => {
    const device = await devicesRepository.upsertByIp({
      ipAddress: '192.168.1.1',
      discoverySource: 'tcp',
    });

    expect(device.serialNumber).toBeFalsy();

    await devicesRepository.updateIdentity(device.id, {
      serialNumber: 'SN987654321',
      macAddress: 'aa:bb:cc:dd:ee:ff',
      model: 'HG8145V5',
      vendor: 'Huawei',
    });

    const updated = await devicesRepository.getById(device.id);
    expect(updated?.serialNumber).toBe('SN987654321');
    expect(updated?.macAddress).toBe('aa:bb:cc:dd:ee:ff');
    expect(updated?.model).toBe('HG8145V5');
  });
});
