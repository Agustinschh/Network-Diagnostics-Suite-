/**
 * Formatea centésimas de segundo (TimeTicks de SNMP) a una representación legible.
 * Ejemplo: 43200000 -> "5 d 0 h" o "3 d 4 h 12 min"
 */
export function formatUptime(ticks: number): string {
  if (ticks <= 0) return '0 s';

  const totalSeconds = Math.floor(ticks / 100);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} d`);
  if (hours > 0 || days > 0) parts.push(`${hours} h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} min`);
  if (parts.length === 0) parts.push(`${seconds} s`);

  return parts.join(' ');
}

/**
 * Formatea contadores de bytes con coma decimal y espacio antes de la unidad.
 * Regla GUIA_ESTILOS §9: "1,2 GB", "340 MB".
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unitIndex = Math.min(i, units.length - 1);

  const val = bytes / Math.pow(1024, unitIndex);
  const formattedVal = val.toFixed(1).replace('.', ',');

  return `${formattedVal} ${units[unitIndex]}`;
}

/**
 * Formatea fecha en estándar rioplatense (dd/MM/yyyy HH:mm).
 */
export function formatDate(dateOrTimestamp: Date | number): string {
  const date = typeof dateOrTimestamp === 'number' ? new Date(dateOrTimestamp) : dateOrTimestamp;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
