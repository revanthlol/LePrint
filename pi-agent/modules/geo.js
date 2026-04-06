// pi-agent/modules/geo.js
// GPS-first location detection for the kiosk Pi agent.
// Uses gpspipe (gpsd) to read actual GPS hardware.
// IP-based fallback has been intentionally removed — it is too inaccurate.

const { exec } = require('child_process');

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
 * Main entry point — try GPS only.
 * If no GPS found, returns nulls (caller should skip or prompt user).
 *
 * @param {Object} logger
 * @returns {Promise<{latitude: number|null, longitude: number|null, source: string}>}
 */
async function autoDetect(logger) {
  const gpsAvail = await isGPSAvailable();

  if (!gpsAvail) {
    logger.warn('⚠️  gpspipe not found. Install gpsd + gpsd-clients to enable GPS tracking.');
    logger.info('   → Kiosk will start without a map location. Set LATITUDE/LONGITUDE in .env to pin it manually.');
    return { latitude: null, longitude: null, source: 'none' };
  }

  return getGPSLocation(logger);
}

module.exports = {
  autoDetect,
  getGPSLocation,
  isGPSAvailable,
};
