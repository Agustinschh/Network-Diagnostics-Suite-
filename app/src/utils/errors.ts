export type ErrorCode =
  | 'TIMEOUT'
  | 'NETWORK_UNREACHABLE'
  | 'AUTH_FAILED'
  | 'PERMISSION_DENIED'
  | 'PARSE_ERROR'
  | 'SNMP_ERROR'
  | 'NOT_FOUND'
  | 'STORAGE_ERROR'
  | 'UNKNOWN';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: any;

  constructor(code: ErrorCode, message?: string, details?: any) {
    super(message || code);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  TIMEOUT: 'El equipo no respondió. Revisá la IP y que el servicio esté habilitado.',
  NETWORK_UNREACHABLE: 'No hay conexión con la red. Conectate al Wi-Fi del equipo.',
  AUTH_FAILED: 'Usuario o contraseña incorrectos.',
  PERMISSION_DENIED: 'Falta un permiso para continuar. Podés habilitarlo en Ajustes.',
  PARSE_ERROR: 'El equipo respondió con datos que no pudimos leer.',
  SNMP_ERROR: 'El equipo rechazó la consulta SNMP. Revisá la comunidad.',
  NOT_FOUND: 'No encontramos este registro.',
  STORAGE_ERROR: 'No se pudo guardar en el teléfono. Revisá el espacio disponible.',
  UNKNOWN: 'Algo salió mal. Probá de nuevo.',
};

export function userErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return ERROR_MESSAGES[error.code] || ERROR_MESSAGES.UNKNOWN;
  }
  if (error instanceof Error) {
    return error.message || ERROR_MESSAGES.UNKNOWN;
  }
  return ERROR_MESSAGES.UNKNOWN;
}
