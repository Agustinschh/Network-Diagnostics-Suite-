const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const logger = {
  debug(...args: any[]) {
    if (isDev) {
      console.log('[NetDiag:DEBUG]', ...args);
    }
  },

  info(...args: any[]) {
    if (isDev) {
      console.info('[NetDiag:INFO]', ...args);
    }
  },

  warn(...args: any[]) {
    console.warn('[NetDiag:WARN]', ...args);
  },

  error(...args: any[]) {
    console.error('[NetDiag:ERROR]', ...args);
  },
};
