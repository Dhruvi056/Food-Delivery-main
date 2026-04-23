/**
 * Lightweight structured logger for BiteBlitz backend.
 * Outputs a consistent [YYYY-MM-DD HH:MM:SS] [LEVEL] message format.
 * Uses console.info / console.warn / console.error so log-level filtering
 * works correctly in any log aggregator or PM2 setup.
 */

const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

export const logger = {
  info(message) {
    console.info(`[${ts()}] [INFO]  ${message}`);
  },

  warn(message) {
    console.warn(`[${ts()}] [WARN]  ${message}`);
  },

  error(message, err) {
    const suffix = err !== undefined ? ` — Error: ${err.toString()}` : '';
    console.error(`[${ts()}] [ERROR] ${message}${suffix}`);
  },
};
