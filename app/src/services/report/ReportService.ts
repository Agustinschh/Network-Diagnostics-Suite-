import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { database } from '../../db';
import { installationsRepository } from '../../db/repositories/installations';
import { devicesRepository } from '../../db/repositories/devices';
import { diagnosticsRepository } from '../../db/repositories/diagnostics';
import { PhotoService } from '../evidence/PhotoService';
import { buildReportHtml, ReportData } from './template';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class ReportService {
  /**
   * Genera el PDF completo a partir de una instalación existente, integrando datos de
   * sitio, cliente, geolocalización, equipo, telemetría SNMP, comandos SSH y evidencias fotográficas.
   */
  static async generate(installationId: string): Promise<string> {
    logger.info(`Iniciando generación de PDF para instalación ${installationId}...`);

    // 1. Obtener la instalación
    const installation = await installationsRepository.getById(installationId);
    if (!installation) {
      throw new AppError('NOT_FOUND', `Instalación no encontrada: ${installationId}`);
    }

    // 2. Obtener el dispositivo asociado
    const device = await devicesRepository.getById(installation.deviceId);
    if (!device) {
      throw new AppError('NOT_FOUND', `Dispositivo no encontrado para la instalación: ${installation.deviceId}`);
    }

    // 3. Obtener diagnósticos seleccionados
    const allDeviceDiags = await diagnosticsRepository.listByDevice(device.id);
    let selectedIds: string[] = [];
    if (installation.diagnosticIdsJson) {
      try {
        selectedIds = JSON.parse(installation.diagnosticIdsJson);
      } catch {}
    }

    // Filtrar diagnósticos marcados (o el más reciente de cada tipo si no hay lista explícita)
    const snmpDiag = allDeviceDiags.find(
      (d) => d.kind === 'snmp' && (selectedIds.length === 0 || selectedIds.includes(d.id))
    );
    const sshDiag = allDeviceDiags.find(
      (d) => d.kind === 'ssh' && (selectedIds.length === 0 || selectedIds.includes(d.id))
    );

    // 4. Obtener fotos y codificarlas a base64
    const photoRecords = await PhotoService.listByInstallation(installationId);
    const photosWithBase64: Array<{ type: string; base64Data: string }> = [];

    for (const p of photoRecords) {
      try {
        const cleanPath = p.photoLocalUri.replace('file://', '');
        const exists = await RNFS.exists(cleanPath);
        if (exists) {
          const b64 = await RNFS.readFile(cleanPath, 'base64');
          photosWithBase64.push({
            type: p.photoType,
            base64Data: `data:image/jpeg;base64,${b64}`,
          });
        }
      } catch (readErr) {
        logger.warn(`No se pudo leer imagen ${p.photoLocalUri} para el PDF:`, readErr);
      }
    }

    // 5. Construir objeto ReportData
    let ifaces: any[] | undefined;
    if (snmpDiag?.snmpInterfacesJson) {
      try {
        ifaces = JSON.parse(snmpDiag.snmpInterfacesJson);
      } catch {}
    }

    const reportData: ReportData = {
      installationId: installation.id,
      createdAt: installation.createdAt ? new Date(installation.createdAt).getTime() : Date.now(),
      siteName: installation.siteName || 'Sitio Sin Nombre',
      clientName: installation.clientName || 'Cliente No Especificado',
      technicianName: installation.technicianName || 'Técnico de Campo',
      technicianNotes: installation.technicianNotes,
      location:
        installation.latitude && installation.longitude
          ? {
              latitude: installation.latitude,
              longitude: installation.longitude,
              accuracy: installation.accuracy || 10,
            }
          : undefined,
      device: {
        ipAddress: device.ipAddress,
        macAddress: device.macAddress,
        serialNumber: device.serialNumber,
        vendor: device.vendor,
        model: device.model,
        hostname: device.hostname,
      },
      snmpDiagnostic: snmpDiag
        ? {
            sysName: snmpDiag.snmpSysName,
            sysDescr: snmpDiag.snmpSysDescr,
            uptimeTicks: snmpDiag.snmpUptimeTicks,
            interfaces: ifaces,
          }
        : undefined,
      sshDiagnostic: sshDiag
        ? {
            profile: sshDiag.sshProfile,
            output: sshDiag.sshOutput,
          }
        : undefined,
      photos: photosWithBase64,
    };

    // 6. Generar HTML
    const html = buildReportHtml(reportData);

    // 7. Renderizar a PDF mediante react-native-html-to-pdf
    const siteSlug = (installation.siteName || 'sitio')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 30);
    const timeSlug = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    const fileName = `reporte_${siteSlug}_${timeSlug}`;

    let pdfResult: any;
    try {
      pdfResult = await generatePDF({
        html,
        fileName,
        directory: 'Documents',
      });
    } catch (genErr: any) {
      logger.error('Error al generar PDF nativo:', genErr);
      throw new AppError('UNKNOWN', `Error al compilar documento PDF: ${genErr?.message || 'Fallo nativo'}`);
    }

    if (!pdfResult?.filePath) {
      throw new AppError('UNKNOWN', 'El generador de PDF no devolvió la ruta del archivo generado.');
    }

    // 8. Mover el archivo al almacenamiento persistente reports/ de la app
    const reportsDir = `${RNFS.DocumentDirectoryPath}/reports`;
    await RNFS.mkdir(reportsDir);

    const finalPath = `${reportsDir}/${fileName}.pdf`;
    try {
      const generatedPath = pdfResult.filePath.replace('file://', '');
      await RNFS.moveFile(generatedPath, finalPath);
    } catch (moveErr) {
      logger.warn('No se pudo mover el PDF generado, usando ruta nativa:', moveErr);
    }

    const savedPath = (await RNFS.exists(finalPath)) ? finalPath : pdfResult.filePath;

    // 9. Actualizar pdfLocalPath en la BD
    await database.write(async () => {
      await installation.update((rec) => {
        rec.pdfLocalPath = savedPath;
      });
    });

    logger.info(`Reporte PDF generado exitosamente en: ${savedPath}`);
    return savedPath;
  }

  /**
   * Comparte el archivo PDF mediante el selector nativo del sistema (WhatsApp, Mail, etc.).
   */
  static async share(pdfPath: string): Promise<void> {
    if (!pdfPath) {
      throw new AppError('NOT_FOUND', 'Ruta de archivo PDF no válida.');
    }

    const fileUrl = pdfPath.startsWith('file://') ? pdfPath : `file://${pdfPath}`;

    try {
      await Share.open({
        title: 'Compartir reporte de instalación',
        url: fileUrl,
        type: 'application/pdf',
      });
    } catch (err: any) {
      if (err?.message && !err.message.includes('User did not share')) {
        logger.warn('Error al compartir archivo PDF:', err);
      }
    }
  }
}
