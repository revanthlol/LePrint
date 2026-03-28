// pi-agent/setup-wizard.js
// Interactive CLI to configure the LePrint Pi-Agent

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');
const { autoDetect } = require('./modules/geo');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const logger = {
  socket: (msg) => console.log(`\x1b[36m📡 ${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`),
  info: (msg) => console.log(`\x1b[34mℹ️  ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`)
};

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function startWizard() {
  console.log(`
\x1b[35m╔════════════════════════════════════════╗
║      LePrint Pi-Agent Setup Wizard       ║
╚════════════════════════════════════════╝\x1b[0m
`);

  const config = {};

  // 1. Kiosk ID
  const hostname = os.hostname();
  config.KIOSK_ID = await question(`Enter Kiosk ID [${hostname}]: `) || hostname;

  // 2. URLs
  config.CLOUD_URL = await question('Enter Cloud Server URL [https://justpri.duckdns.org]: ') || 'https://justpri.duckdns.org';
  config.FRONTEND_URL = await question('Enter Frontend URL [https://leprint.in]: ') || 'https://leprint.in';

  // 3. Location
  console.log('\n--- Location Setup ---');
  const useAuto = await question('Auto-detect location via IP? (Y/n): ');
  
  if (useAuto.toLowerCase() !== 'n') {
    const detected = await autoDetect(logger);
    if (detected.latitude && detected.longitude) {
      config.LATITUDE = detected.latitude;
      config.LONGITUDE = detected.longitude;
    } else {
      logger.warn('Auto-detection failed. Please enter manually.');
      config.LATITUDE = await question('Enter Latitude: ');
      config.LONGITUDE = await question('Enter Longitude: ');
    }
  } else {
    config.LATITUDE = await question('Enter Latitude: ');
    config.LONGITUDE = await question('Enter Longitude: ');
  }

  // 4. Printer
  config.PRINTER_NAME = await question('Enter CUPS Printer Name [auto]: ') || 'auto';
  config.PRINTER_IP = await question('Enter Printer IP (for scanning) [192.168.1.100]: ') || '192.168.1.100';

  // Write to .env
  const envContent = Object.entries(config)
    .map(([key, val]) => `${key}=${val}`)
    .join('\n');

  fs.writeFileSync(path.join(__dirname, '.env'), envContent);
  
  console.log(`
\x1b[32m╔════════════════════════════════════════╗
║       Setup Complete!                  ║
║  Your .env file has been generated.    ║
║  Run 'npm start' to begin.             ║
╚════════════════════════════════════════╝\x1b[0m
`);

  rl.close();
}

startWizard().catch(err => {
  console.error('Wizard failed:', err);
  rl.close();
});
