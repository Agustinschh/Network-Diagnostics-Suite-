import SSHClient from '@dylankenneally/react-native-ssh-sftp';
import { SSH } from '../../config/constants';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { CredentialStore } from '../security/CredentialStore';
import { SSH_PROFILES, SshProfileId } from './profiles';

export interface SshCommandResult {
  command: string;
  output: string;
  durationMs: number;
  truncated: boolean;
  error?: string;
}

export class SshService {
  /**
   * Ejecuta una secuencia de comandos de un perfil SSH cerrado sobre el host especificado.
   */
  static async runProfile(
    deviceId: string,
    host: string,
    port: number = SSH.PORT,
    profileId: SshProfileId,
    onResult?: (r: SshCommandResult) => void,
    signal?: AbortSignal
  ): Promise<SshCommandResult[]> {
    if (signal?.aborted) {
      throw new AppError('CANCELED', 'Operación SSH cancelada antes de iniciar.');
    }

    // 1. Obtener credenciales seguras
    const creds = await CredentialStore.getSsh(deviceId);
    if (!creds || !creds.username || !creds.password) {
      throw new AppError(
        'AUTH_FAILED',
        'No se encontraron credenciales SSH para este equipo. Configúralas en la pantalla de credenciales.'
      );
    }

    const profile = SSH_PROFILES[profileId];
    if (!profile) {
      throw new AppError('UNKNOWN', `Perfil SSH desconocido: ${profileId}`);
    }

    let client: any = null;
    const results: SshCommandResult[] = [];

    try {
      logger.info(`Conectando SSH a ${host}:${port} para perfil ${profileId}...`);

      // 2. Conectar con timeout (Promise.race)
      const connectPromise = SSHClient.connectWithPassword(
        host,
        port,
        creds.username,
        creds.password
      );

      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          reject(new AppError('TIMEOUT', `Timeout de conexión SSH (${SSH.CONNECT_TIMEOUT_MS}ms) a ${host}`));
        }, SSH.CONNECT_TIMEOUT_MS);

        if (signal) {
          signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timer);
              reject(new AppError('CANCELED', 'Conexión SSH cancelada por el usuario.'));
            },
            { once: true }
          );
        }
      });

      client = await Promise.race([connectPromise, timeoutPromise]);
      logger.info(`Conexión SSH establecida exitosamente con ${host}`);

      // 3. Ejecutar comandos en secuencia
      for (const cmd of profile.commands) {
        if (signal?.aborted) {
          logger.warn('Ejecución de perfil SSH abortada por el usuario');
          break;
        }

        const start = Date.now();
        let output = '';
        let errorMsg: string | undefined;
        let truncated = false;

        try {
          const cmdExecPromise = client.execute(cmd);
          const cmdTimeoutPromise = new Promise<string>((_, reject) => {
            const timer = setTimeout(() => {
              reject(new AppError('TIMEOUT', `Timeout al ejecutar comando: ${cmd}`));
            }, SSH.COMMAND_TIMEOUT_MS);

            if (signal) {
              signal.addEventListener(
                'abort',
                () => {
                  clearTimeout(timer);
                  reject(new AppError('CANCELED', 'Comando cancelado por el usuario.'));
                },
                { once: true }
              );
            }
          });

          const rawOutput = await Promise.race([cmdExecPromise, cmdTimeoutPromise]);
          let text = typeof rawOutput === 'string' ? rawOutput : String(rawOutput || '');

          // Truncar si excede el tamaño máximo permitido
          if (text.length > SSH.MAX_OUTPUT_BYTES) {
            text = text.slice(0, SSH.MAX_OUTPUT_BYTES) + '\n[... truncado por límite de 256 KB ...]';
            truncated = true;
          }

          output = text;
        } catch (cmdErr: any) {
          errorMsg = cmdErr?.message || 'Error durante la ejecución del comando';
          logger.warn(`Error en comando SSH "${cmd}":`, errorMsg);
        }

        const durationMs = Date.now() - start;
        const result: SshCommandResult = {
          command: cmd,
          output,
          durationMs,
          truncated,
          error: errorMsg,
        };

        results.push(result);
        onResult?.(result);
      }

      return results;
    } catch (err: any) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        'SSH_ERROR',
        `Error en sesión SSH: ${err?.message || 'Error de comunicación SSH'}`
      );
    } finally {
      // 4. Desconectar siempre la sesión
      if (client) {
        try {
          client.disconnect();
          logger.debug(`Sesión SSH con ${host} cerrada.`);
        } catch (closeErr) {
          logger.warn('Error al desconectar cliente SSH:', closeErr);
        }
      }
    }
  }
}
