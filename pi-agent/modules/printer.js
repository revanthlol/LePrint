// pi-agent/modules/printer.js
// Printer detection, status checking, and print execution via CUPS
// Supports SIMULATE_PRINTER=true for testing without a real printer

const { exec, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrinterError } = require('./errors');

const SIMULATE_PRINTER = process.env.SIMULATE_PRINTER === 'true';

// ==================== CAPABILITY PROFILE ====================
function loadCapabilities() {
  try {
    const capPath = path.join(__dirname, '..', 'printer-capabilities.json');
    const raw = fs.readFileSync(capPath, 'utf-8');
    const caps = JSON.parse(raw);
    if (caps && caps.brand) {
      return caps;
    }
    return {};
  } catch {
    return {};
  }
}

const CAPABILITIES = loadCapabilities();

function logCapabilities(logger) {
  if (!CAPABILITIES.brand) {
    logger.info('[PRINTER] No capability profile found — using generic defaults');
    return;
  }
  logger.info(`[PRINTER] Capability profile loaded:`);
  logger.info(`  Brand: ${CAPABILITIES.brand}`);
  logger.info(`  Driver: ${CAPABILITIES.driver || 'generic'}`);
  logger.info(`  Connection: ${CAPABILITIES.connectionType || 'unknown'}`);
  logger.info(`  Advanced status: ${CAPABILITIES.advancedStatusAvailable ? 'yes' : 'no'}`);
  logger.info(`  Scanner: ${CAPABILITIES.scannerAvailable ? 'yes' : 'no'}`);
}

// ==================== PRINTER DETECTION ====================
async function detectPrinter(printerName, logger) {
  if (SIMULATE_PRINTER) {
    logger.success('🖨️  [SIM] Simulated printer: VIRTUAL_PRINTER');
    return 'VIRTUAL_PRINTER';
  }

  if (printerName && printerName !== 'auto') {
    logger.success(`Using configured printer: ${printerName}`);
    return printerName;
  }

  if (CAPABILITIES.brand && CAPABILITIES.brand !== 'generic') {
    try {
      const lpOut = await new Promise((resolve, reject) => {
        exec('lpstat -p 2>/dev/null', (err, stdout) => {
          if (err) return reject(err);
          resolve(stdout || '');
        });
      });
      const lines = lpOut.split('\n');
      for (const line of lines) {
        const match = line.match(/printer\s+(\S+)/);
        if (match && match[1].toLowerCase().includes(CAPABILITIES.brand.toLowerCase())) {
          logger.success(`Auto-detected ${CAPABILITIES.brand} printer via capability hint: ${match[1]}`);
          return match[1];
        }
      }
    } catch {
      // lpstat failed — fall through
    }
  }

  return new Promise((resolve, reject) => {
    exec('lpstat -p -d', (error, stdout) => {
      if (error) {
        logger.warn('No printers detected via CUPS');
        return reject(new PrinterError('No printers available', null));
      }

      const lines = stdout.split('\n');
      let defaultPrinter = null;
      const availablePrinters = [];

      lines.forEach(line => {
        if (line.startsWith('system default destination:')) {
          defaultPrinter = line.split(':')[1].trim();
        } else if (line.startsWith('printer ')) {
          const match = line.match(/printer\s+(\S+)/);
          if (match) availablePrinters.push(match[1]);
        }
      });

      if (defaultPrinter) {
        logger.success(`Auto-detected default: ${defaultPrinter}`);
        return resolve(defaultPrinter);
      }

      if (availablePrinters.length > 0) {
        const firstPrinter = availablePrinters[0];
        logger.success(`Using first available: ${firstPrinter}`);
        return resolve(firstPrinter);
      }

      reject(new PrinterError('No printers found', null));
    });
  });
}

// ==================== PRINTER STATUS CHECK ====================
async function checkPrinterStatus(printerName, logger) {
  if (SIMULATE_PRINTER) {
    return { status: 'healthy', detail: 'simulated' };
  }

  if (!printerName) {
    return { status: 'unknown', detail: 'no_printer_configured' };
  }

  if (CAPABILITIES.advancedStatusAvailable === true) {
    try {
      const ippResult = await _queryIppStatus(printerName, logger);
      if (ippResult) return ippResult;
    } catch {
      // IPP failed — fall through
    }
  }

  return new Promise((resolve) => {
    exec(`lpstat -p ${printerName} 2>&1`, { timeout: 5000 }, (error, stdout) => {
      if (error && !stdout) {
        return resolve({ status: 'unknown', detail: 'cups_unavailable' });
      }

      const output = (stdout || '').toLowerCase();
      if (output.includes('out of paper') || output.includes('media empty') || output.includes('no media')) {
        return resolve({ status: 'error', detail: 'media-empty' });
      }
      if (output.includes('out of ink') || output.includes('toner empty') || output.includes('ink empty')) {
        return resolve({ status: 'error', detail: 'toner-empty' });
      }
      if (output.includes('cover open') || output.includes('door open')) {
        return resolve({ status: 'error', detail: 'cover-open' });
      }
      if (output.includes('stopped') && !output.includes('idle')) {
        return resolve({ status: 'error', detail: 'stopped' });
      }
      if (output.includes('not connected') || output.includes('offline')) {
        return resolve({ status: 'error', detail: 'offline' });
      }

      if (output.includes('idle') || output.includes('processing')) {
        return resolve({ status: 'healthy', detail: null });
      }

      return resolve({ status: 'unknown', detail: 'ipp_unsupported' });
    });
  });
}

function _queryIppStatus(printerName, logger) {
  return new Promise((resolve) => {
    exec(`lpstat -l -p ${printerName} 2>&1`, { timeout: 5000 }, (error, stdout) => {
      if (error || !stdout) return resolve(null);
      const output = stdout.toLowerCase();
      if (output.includes('media-empty') || output.includes('media-needed')) return resolve({ status: 'error', detail: 'media-empty' });
      if (output.includes('toner-empty') || output.includes('marker-supply-empty')) return resolve({ status: 'error', detail: 'toner-empty' });
      if (output.includes('media-jam')) return resolve({ status: 'error', detail: 'media-jam' });
      if (output.includes('cover-open') || output.includes('door-open')) return resolve({ status: 'error', detail: 'cover-open' });
      if (output.includes('offline') || output.includes('shutdown') || output.includes('not-responding')) return resolve({ status: 'error', detail: 'offline' });
      if (output.includes('paused') || output.includes('hold-new-jobs')) return resolve({ status: 'error', detail: 'stopped' });

      if (output.includes('toner-low') || output.includes('marker-supply-low')) return resolve({ status: 'healthy', detail: 'toner-low' });
      if (output.includes('media-low')) return resolve({ status: 'healthy', detail: 'media-low' });
      
      return resolve(null);
    });
  });
}

// ==================== CUPS JOB STATUS POLLING ====================
function pollCupsJobStatus(cupsJobId, logger) {
  return new Promise((resolve) => {
    const POLL_INTERVAL = 2000;
    const LOG_INTERVAL = 10000;
    const MAX_WAIT = 120000;
    const startTime = Date.now();
    let lastLogTime = 0;

    const checkStatus = () => {
      exec(`lpstat -o ${cupsJobId} 2>&1`, { timeout: 5000 }, (error, stdout) => {
        if (error) {
          logger.warn(`[CUPS] lpstat polling failed: ${error.message}, assuming print succeeded`);
          return resolve({ success: true });
        }

        const output = (stdout || '').trim().toLowerCase();
        const elapsed = Date.now() - startTime;

        if (!output || !output.includes(cupsJobId.toLowerCase())) {
          logger.job(`[CUPS] ${cupsJobId} done — ${(elapsed / 1000).toFixed(1)}s total`);
          return resolve({ success: true });
        }

        if (output.includes('aborted') || output.includes('stopped') || output.includes('error')) {
          logger.error(`[CUPS] ${cupsJobId} failed: ${output}`);
          return resolve({ success: false, error: `CUPS job failed: ${output}` });
        }

        if (elapsed >= MAX_WAIT) {
          logger.warn(`[CUPS] ${cupsJobId} timed out after ${MAX_WAIT / 1000}s`);
          return resolve({ success: false, error: 'Print job timed out' });
        }

        if (elapsed - lastLogTime >= LOG_INTERVAL) {
          logger.job(`[CUPS] ${cupsJobId} still processing... (${(elapsed / 1000).toFixed(0)}s elapsed)`);
          lastLogTime = elapsed;
        }

        setTimeout(checkStatus, POLL_INTERVAL);
      });
    };
    checkStatus();
  });
}

// ==================== PRINT EXECUTION ====================
async function printDocument(printerName, filePath, pages, logger, settings = {}) {
  return new Promise((resolve, reject) => {
    logger.info(`   🖨️  Printing: ${filePath.split('/').pop()} (${pages} pages)...`);

    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File to print does not exist: ${filePath}`));
    }

    if (SIMULATE_PRINTER) {
      logger.info('   ☁ SIMULATION: Sending print command to virtual printer...');
      setTimeout(() => {
        logger.info('   ✓ SIMULATION: Print job submitted successfully');
        resolve({ success: true, pages: pages || 1, cupsJobId: `SIM_${Date.now()}` });
      }, 1000);
      return;
    }

    const opts = [];
    if (settings.colorMode === 'bw') opts.push('-o ColorModel=KGray');
    if (settings.orientation === 'landscape') opts.push('-o landscape');
    if (settings.copies && settings.copies > 1) opts.push(`-n ${settings.copies}`);
    if (settings.pageRange && settings.pageRange !== 'all' && /^[\d,\-]+$/.test(settings.pageRange)) {
      opts.push(`-o page-ranges=${settings.pageRange}`);
    }
    if (settings.scaling === 'fit') opts.push('-o fit-to-page');
    
    const optStr = opts.length ? opts.join(' ') + ' ' : '';
    const cmd = `lp -d ${printerName} ${optStr}"${filePath}"`;

    exec(cmd, async (error, stdout, stderr) => {
      if (error) {
        logger.error(`Print failed: ${stderr || error.message}`);
        return reject(new PrinterError(`Print command failed: ${stderr || error.message}`, printerName));
      }

      const jobIdMatch = (stdout || '').match(/request id is (\S+)/);
      const cupsJobId = jobIdMatch ? jobIdMatch[1] : null;

      if (!cupsJobId) {
        logger.warn('[CUPS] WARNING: Could not parse job ID, fire-and-forget');
        return resolve({ success: true, pages, cupsJobId: null });
      }

      logger.job(`[CUPS] ${cupsJobId} submitted, polling...`);

      try {
        const cupsResult = await pollCupsJobStatus(cupsJobId, logger);
        if (cupsResult.success) {
          resolve({ success: true, pages, cupsJobId });
        } else {
          reject(new PrinterError(cupsResult.error || 'CUPS job failed', printerName));
        }
      } catch (pollError) {
        logger.warn(`[CUPS] Polling error: ${pollError.message}, assuming success`);
        resolve({ success: true, pages, cupsJobId });
      }
    });
  });
}

module.exports = {
  detectPrinter,
  checkPrinterStatus,
  printDocument,
  logCapabilities,
  CAPABILITIES
};
