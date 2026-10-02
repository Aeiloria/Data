// System Network Routing Context Initialization
const isLocalhost = Boolean(
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '[::1]' ||
   window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-3]|[01]?\d?\d)){3}$/))
);

export const ENV_CONFIG = {
  // Toggle endpoints dynamically depending on deployment footprint
  API_BASE_URL: isLocalhost 
    ? 'http://localhost:3000/api'
    : '/api',
  ARCGIS_API_KEY: (import.meta as any).env?.VITE_ARCGIS_API_KEY || 'DEVELOPMENT_FALLBACK_KEY_2099',
  PRODUCTION_MODE: (import.meta as any).env?.PROD || false
};
