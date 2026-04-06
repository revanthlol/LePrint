// pi-agent/modules/geo.js
// Hybrid location detection for the kiosk Pi agent.
// Priority: ENV > Backend API > GPS hardware

const { exec } = require('child_process');
const axios = require('axios');

// In-memory cache for location after first successful detection
let cachedLocation = null;

/**
 * Attempt to get precise location from GPS hardware via gpspipe.
 * Requires: gpsd running and a connected GPS receiver.
 *
 * @param {Object} logger Logger instance
 * @param {number} [timeoutMs=8000] How long to wait for a GPS fix
 * @returns {Promise<{latitude: number|null, longitude: number|null, altitude: number|null, source: 'gps'|'none'}>}
 */
async function getGPSLocation(logger, timeoutMs = 8000) {
  return new Promise((resolve) => {
    logger.socket('🛰️  Attempting to read GPS location via gpspipe...');

    // gpspipe -w reads raw GPSD JSON. We look for a TPV (time-position-velocity) report with mode 2 or 3.
    const proc = exec(
      `gpspipe -w -n 20 2>/dev/null`,
      { timeout: timeoutMs, encoding: 'utf8' },
      (error, stdout) => {
        if (error && !stdout) {
          logger.warn('⚠️  gpspipe failed or gpsd not running. No GPS available.');
          return resolve({ latitude: null, longitude: null, altitude: null, source: 'none' });
        }

        // Parse lines looking for a valid TPV fix
        const lines = (stdout || '').split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            // TPV = time/position/velocity report; mode 2=2D fix, 3=3D fix
            if (obj.class === 'TPV' && (obj.mode === 2 || obj.mode === 3) && obj.lat && obj.lon) {
              const lat = parseFloat(obj.lat.toFixed(6));
              const lon = parseFloat(obj.lon.toFixed(6));
              const alt = obj.alt != null ? parseFloat(obj.alt.toFixed(1)) : null;
              logger.success(`📍 GPS fix acquired: ${lat}, ${lon}${alt != null ? ` (alt: ${alt}m)` : ''}`);
              return resolve({ latitude: lat, longitude: lon, altitude: alt, source: 'gps' });
            }
          } catch {
            // Not valid JSON — skip
          }
        }

        logger.warn('⚠️  No valid GPS fix in gpspipe output. GPS hardware may not have a signal yet.');
        resolve({ latitude: null, longitude: null, altitude: null, source: 'none' });
      }
    );

    // Kill gpspipe if it hasn't exited by our timeout
    setTimeout(() => {
      try { proc.kill(); } catch { /* already exited */ }
    }, timeoutMs - 500);
  });
}

/**
 * Fetch location from the backend API based on Kiosk ID.
 *
 * @param {string} kioskId Unique identifier for this kiosk
 * @returns {Promise<{latitude: number, longitude: number, source: 'backend'}|null>}
 */
async function fetchLocationFromBackend(kioskId) {
  const cloudUrl = process.env.CLOUD_URL || 'https://justpri.duckdns.org';
  try {
    const response = await axios.get(`${cloudUrl}/api/kiosks/${kioskId}/location`, {
      timeout: 3000,
      headers: { 'X-Kiosk-ID': kioskId }
    });

    if (response.data && response.data.latitude && response.data.longitude) {
      return {
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        source: 'backend'
      };
    }
  } catch (error) {
    // Silence errors to move to next fallback
  }
  return null;
}

/**
 * Main function: Resolve location using hybrid tiered detection.
 * Priority: ENV > Backend > GPS
 *
 * @param {Object} logger
 * @returns {Promise<{latitude: number|null, longitude: number|null, source: string}>}
 */
async function resolveLocation(logger) {
  // 0. Cache check
  if (cachedLocation) return cachedLocation;

  // 1. ENV CONFIG (Highest Priority)
  const latEnv = process.env.LATITUDE;
  const lonEnv = process.env.LONGITUDE;
  if (latEnv && lonEnv) {
    logger.info('📍 Using location from ENV');
    cachedLocation = {
      latitude: parseFloat(latEnv),
      longitude: parseFloat(lonEnv),
      source: 'env'
    };
    return cachedLocation;
  }

  // 2. BACKEND FETCH (Primary real-world solution)
  const kioskId = process.env.KIOSK_ID;
  if (kioskId) {
    logger.info('🌐 Fetching location from backend...');
    const backendLoc = await fetchLocationFromBackend(kioskId);
    if (backendLoc) {
      cachedLocation = backendLoc;
      return cachedLocation;
    }
  }

  // 3. GPS (Optional fallback)
  logger.info('🛰️ Trying GPS fallback...');
  const gpsLoc = await getGPSLocation(logger, 8000);
  if (gpsLoc.latitude && gpsLoc.longitude) {
    cachedLocation = {
      latitude: gpsLoc.latitude,
      longitude: gpsLoc.longitude,
      source: 'gps'
    };
    return cachedLocation;
  }

  // 4. FAILURE
  logger.error('❌ No location available. Configure LATITUDE/LONGITUDE or register kiosk.');
  return {
    latitude: null,
    longitude: null,
    source: 'none'
  };
}

/**
 * Check if gpsd / gpspipe are available on this system.
 * @returns {Promise<boolean>}
 */
function isGPSAvailable() {
  return new Promise((resolve) => {
    exec('which gpspipe 2>/dev/null', (err, stdout) => {
      resolve(!err && stdout.trim().length > 0);
    });
  });
}

/**
 * Backward compatible entry point — now uses robust resolveLocation logic.
 *
 * @param {Object} logger
 * @returns {Promise<{latitude: number|null, longitude: number|null, source: string}>}
 */
async function autoDetect(logger) {
  return resolveLocation(logger);
}

module.exports = {
  autoDetect,
  resolveLocation,
  getGPSLocation,
  fetchLocationFromBackend,
  isGPSAvailable,
};
