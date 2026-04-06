// pi-agent/setup-wizard.js
// Interactive CLI to configure the LePrint Pi-Agent
// Location setup: GPS-first via gpspipe, manual input as fallback

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');
const { getGPSLocation, isGPSAvailable } = require('./modules/geo');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const logger = {
  socket: (msg) => console.log(`\x1b[36m📡 ${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
  warn:    (msg) => console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`),
  info:    (msg) => console.log(`\x1b[34mℹ️  ${msg}\x1b[0m`),
  error:   (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
};

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setupLocation(config) {
  console.log('\n\x1b[35m--- 📍 Location Setup ---\x1b[0m');

  const gpsAvail = await isGPSAvailable();

  if (gpsAvail) {
    console.log('\x1b[36mGPS hardware detected (gpspipe available). Trying to get a fix...\x1b[0m');
    console.log('\x1b[33mMake sure the GPS antenna has a clear view of the sky.\x1b[0m\n');

    const gps = await getGPSLocation(logger, 10000);

    if (gps.latitude && gps.longitude) {
      logger.success(`GPS fix: ${gps.latitude}, ${gps.longitude}`);
      const confirm = await question(`Use these coordinates? [Y/n]: `);
      if (confirm.toLowerCase() !== 'n') {
        config.LATITUDE  = gps.latitude;
        config.LONGITUDE = gps.longitude;
        logger.success('GPS coordinates saved.');
        return;
      }
    } else {
      logger.warn('No GPS fix obtained. The receiver may not have a satellite lock yet.');
    }
  } else {
    logger.warn('gpspipe not found — GPS tracking unavailable.');
    logger.info('To enable GPS: sudo apt install gpsd gpsd-clients');
    logger.info('Then connect a USB/UART GPS module and run: sudo systemctl start gpsd');
  }

  // Manual entry or skip
  console.log('\nOptions:');
  console.log('  [1] Enter coordinates manually');
  console.log('  [2] Skip — kiosk will not appear on the map');
  const choice = await question('Choose [1/2]: ');

  if (choice.trim() === '1') {
    const lat = await question('Enter Latitude (e.g. 12.9716): ');
    const lon = await question('Enter Longitude (e.g. 77.5946): ');
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
      config.LATITUDE  = parsedLat;
      config.LONGITUDE = parsedLon;
      logger.success(`Manual coordinates saved: ${parsedLat}, ${parsedLon}`);
    } else {
      logger.warn('Invalid coordinates entered — skipping location.');
    }
  } else {
    logger.info('Skipping location. The kiosk will not appear on the public map.');
    logger.info('You can add coordinates later by editing .env and restarting the agent.');
  }
}

async function startWizard() {
  console.log(`
\x1b[35m╔══════════════════════════════════════════╗
║    LePrint Pi-Agent Setup Wizard V2      ║
╚══════════════════════════════════════════╝\x1b[0m
`);

  const config = {};

  // 1. Kiosk ID
  const hostname = os.hostname();
  config.KIOSK_ID = (await question(`Enter Kiosk ID [${hostname}]: `)) || hostname;

  // 2. Server URLs
  config.CLOUD_URL    = (await question('Cloud Server URL [https://justpri.duckdns.org]: ')) || 'https://justpri.duckdns.org';
  config.FRONTEND_URL = (await question('Frontend URL [https://leprint.in]: '))              || 'https://leprint.in';

  // 3. Location (GPS-first)
  await setupLocation(config);

  // 4. Printer
  config.PRINTER_NAME = (await question('CUPS Printer Name [auto]: '))                        || 'auto';
  config.PRINTER_IP   = (await question('Printer IP for scanning [192.168.1.100]: '))         || '192.168.1.100';

  // 5. Write .env
  const envLines = Object.entries(config)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  fs.writeFileSync(path.join(__dirname, '.env'), envLines + '\n');

  console.log(`
\x1b[32m╔══════════════════════════════════════════╗
║   ✅ Setup Complete!                      ║
║   Your .env has been generated.           ║
║   Run 'npm start' to launch the agent.   ║
╚══════════════════════════════════════════╝\x1b[0m
`);

  rl.close();
}

startWizard().catch(err => {
  console.error('Wizard failed:', err);
  rl.close();
  process.exit(1);
});
