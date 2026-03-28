// pi-agent/modules/geo.js
// IP-based geolocation utility to automatically detect kiosk coordinates

const axios = require('axios');

/**
 * Attempt to auto-detect the kiosk's location based on its public IP.
 * Uses the free ipapi.co service which doesn't require an API key for modest use.
 * @param {Object} logger Logger instance
 * @returns {Promise<{latitude: number|null, longitude: number|null, city: string|null}>}
 */
async function autoDetect(logger) {
  try {
    logger.socket('🌍 Attempting to auto-detect location via IP...');
    
    // Using ipapi.co (free tier, no key required for basic usage)
    const response = await axios.get('https://ipapi.co/json/', {
      timeout: 5000,
      headers: { 'User-Agent': 'LePrint-Pi-Agent' }
    });

    if (response.data && response.data.latitude && response.data.longitude) {
      const { latitude, longitude, city, region, country_name } = response.data;
      logger.success(`📍 Auto-detected location: ${city}, ${region}, ${country_name} (${latitude}, ${longitude})`);
      return { latitude, longitude, city };
    }

    logger.warn('⚠️  Could not resolve location data from IP-geolocation service.');
    return { latitude: null, longitude: null, city: null };
  } catch (error) {
    logger.warn(`⚠️  IP-based Geolocation failed: ${error.message}`);
    return { latitude: null, longitude: null, city: null };
  }
}

module.exports = {
  autoDetect
};
