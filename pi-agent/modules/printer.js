// pi-agent/modules/printer.js
// Printer detection, status checking, and print execution via CUPS
// Supports SIMULATE_PRINTER=true for testing without a real printer

const { exec } = require('child_process');
const { PrinterError } = require('./errors');

const SIMULATE = process.env.SIMULATE_PRINTER === 'true';

// ==================== CAPABILITY PROFILE ====================
function loadCapabilities() {
  try {
    const capPath = require('path').join(__dirname, '..', 'printer-capabilities.json');
    const raw = require('fs').readFileSync(capPath, 'utf-8');
    const caps = JSON.parse(raw);
    // Validate it has at least a brand field to be considered populated
    if (caps && caps.brand) {
      return caps;
    }
    return {};
  } catch {
    // File missing, malformed, or unreadable — return empty (generic behavior)
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
  if (SIMULATE) {
    logger.success('🖨️  [SIM] Simulated printer: VIRTUAL_PRINTER');
    return 'VIRTUAL_PRINTER';
  }

  if (printerName !== 'auto') {
    logger.success(`Using configured printer: ${printerName}`);
    return printerName;
  }

  // Capability-aware hint: if we know the brand, try to find a matching queue
  if (CAPABILITIES.brand && CAPABILITIES.brand !== 'generic') {
    try {
      const lpOut = await new Promise((resolve, reject) => {
        exec('lpstat -p 2>/dev/null', (err, stdout) => {
          if (err) return reject(err);
          resolve(stdout || '');
        });
      });
      // Look for a queue name containing the brand (e.g. "EPSON" in "EPSON_L3250")
      const lines = lpOut.split('\n');
      for (const line of lines) {
        const match = line.match(/printer\s+(\S+)/);
        if (match && match[1].toLowerCase().includes(CAPABILITIES.brand.toLowerCase())) {
          logger.success(`Auto-detected ${CAPABILITIES.brand} printer via capability hint: ${match[1]}`);
          return match[1];
        }
      }
      // No brand-matching queue found — fall through to default logic
    } catch {
      // lpstat failed — fall through to default logic
    }
  }

  // Default detection logic
  return new Promise((resolve, reject) => {
    exec('lpstat -p -d', (error, stdout, stderr) => {
      if (error) {
        logger.warn('No printers detected via CUPS');
        logger.warn('Please check: lpstat -p -d');
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
  if (SIMULATE) {
    return { status: 'healthy', detail: 'simulated' };
  }

  if (!printerName) {
    return { status: 'unknown', detail: 'no_printer_configured' };
  }

  // Enhanced: IPP attribute query when advanced status is available
  if (CAPABILITIES.advancedStatusAvailable === true) {
    try {
      const ippResult = await _queryIppStatus(printerName, logger);
      if (ippResult) {
        return ippResult; // { status, detail }
      }
      // null means IPP query returned nothing useful — fall through to lpstat
    } catch {
      // IPP query failed entirely — fall through to lpstat
    }
  }

  // Existing lpstat path (unchanged)
  return new Promise((resolve) => {
    exec(`lpstat -p ${printerName} 2>&1`, { timeout: 5000 }, (error, stdout) => {
      if (error && !stdout) {
        logger.warn(`lpstat failed: ${error.message}`);
        return resolve({ status: 'unknown', detail: 'cups_unavailable' });
      }

      const output = (stdout || '').toLowerCase();

      // Hard errors
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

      // Healthy states
      if (output.includes('idle') || output.includes('processing')) {
        return resolve({ status: 'healthy', detail: null });
      }

      // Unknown/unsupported
      return resolve({ status: 'unknown', detail: 'ipp_unsupported' });
    });
  });
}

/**
 * Query CUPS IPP endpoint for printer-state-reasons.
 * Returns { status, detail } or null if the query is not useful.
 * Uses lpstat -l parsing.
 */
function _queryIppStatus(printerName, logger) {
  return new Promise((resolve) => {
    // Try getting printer-state-reasons via lpstat -l (long format, includes IPP reasons)
    exec(`lpstat -l -p ${printerName} 2>&1`, { timeout: 5000 }, (error, stdout) => {
      if (error || !stdout) {
        return resolve(null); // Can't get info, let caller fall back
      }

      const output = stdout.toLowerCase();

      // Look for printer-state-reasons style keywords in long output
      // These are more specific than the basic lpstat output

      // Hard errors
      if (output.includes('media-empty') || output.includes('media-needed')) {
        logger.debug('[IPP] Detected: media-empty');
        return resolve({ status: 'error', detail: 'media-empty' });
      }
      if (output.includes('toner-empty') || output.includes('marker-supply-empty')) {
        logger.debug('[IPP] Detected: toner-empty');
        return resolve({ status: 'error', detail: 'toner-empty' });
      }
      if (output.includes('media-jam')) {
        logger.debug('[IPP] Detected: media-jam');
        return resolve({ status: 'error', detail: 'media-jam' });
      }
      if (output.includes('cover-open') || output.includes('door-open')) {
        logger.debug('[IPP] Detected: cover-open');
        return resolve({ status: 'error', detail: 'cover-open' });
      }
      if (output.includes('offline') || output.includes('shutdown') || output.includes('not-responding')) {
        logger.debug('[IPP] Detected: offline');
        return resolve({ status: 'error', detail: 'offline' });
      }
      if (output.includes('paused') || output.includes('hold-new-jobs')) {
        logger.debug('[IPP] Detected: paused');
        return resolve({ status: 'error', detail: 'stopped' });
      }

      // Warnings (non-blocking) - mapped to 'healthy' status per user instruction
      if (output.includes('toner-low') || output.includes('marker-supply-low')) {
        logger.debug('[IPP] Detected: toner-low');
        return resolve({ status: 'healthy', detail: 'toner-low' });
      }
      if (output.includes('media-low')) {
        logger.debug('[IPP] Detected: media-low');
        return resolve({ status: 'healthy', detail: 'media-low' });
      }
      if (output.includes('cups-waiting-for-job-completed') || output.includes('connecting-to-device')) {
        logger.debug('[IPP] Detected: connecting');
        return resolve({ status: 'healthy', detail: 'connecting' });
      }

      // If we got output but didn't match anything specific, return null
      // to let the existing lpstat parser handle it
      return resolve(null);
    });
  });
}

// ==================== CUPS JOB STATUS POLLING ====================
/**
 * Poll CUPS for job completion using lpstat.
 * Returns { success: true/false, error?: string }
 * Logs progress every 10s (not every poll) to reduce noise.
 */
function pollCupsJobStatus(cupsJobId, logger) {
  return new Promise((resolve) => {
    const POLL_INTERVAL = 2000; // 2 seconds
    const LOG_INTERVAL = 10000; // Log every 10 seconds
    const MAX_WAIT = 120000;    // 120 seconds
    const startTime = Date.now();
    let lastLogTime = 0;

    const checkStatus = () => {
      exec(`lpstat -o ${cupsJobId} 2>&1`, { timeout: 5000 }, (error, stdout) => {
        if (error) {
          // lpstat not available or errored — fall back to success
          logger.warn(`[CUPS] lpstat polling failed: ${error.message}, assuming print succeeded`);
          return resolve({ success: true });
        }

        const output = (stdout || '').trim().toLowerCase();
        const elapsed = Date.now() - startTime;

        // Empty output means job is no longer in queue — completed
        if (!output || !output.includes(cupsJobId.toLowerCase())) {
          logger.job(`[CUPS] ${cupsJobId} done — ${(elapsed / 1000).toFixed(1)}s total`);
          return resolve({ success: true });
        }

        // Check for failure states
        if (output.includes('aborted') || output.includes('stopped') || output.includes('error')) {
          logger.error(`[CUPS] ${cupsJobId} failed: ${output}`);
          return resolve({ success: false, error: `CUPS job failed: ${output}` });
        }

        // Timeout check
        if (elapsed >= MAX_WAIT) {
          logger.warn(`[CUPS] ${cupsJobId} timed out after ${MAX_WAIT / 1000}s`);
          return resolve({ success: false, error: 'Print job timed out waiting for CUPS confirmation' });
        }

        // Log progress every 10s (not every 2s poll)
        if (elapsed - lastLogTime >= LOG_INTERVAL) {
          logger.job(`[CUPS] ${cupsJobId} still processing... (${(elapsed / 1000).toFixed(0)}s elapsed)`);
          lastLogTime = elapsed;
        }

        // Still printing, poll again
        setTimeout(checkStatus, POLL_INTERVAL);
      });
    };

    // Start polling
    checkStatus();
  });
}

// ==================== PRINT EXECUTION ====================
async function printDocument(printerName, filePath, pages, logger, settings = {}) {
  if (SIMULATE) {
    const fileName = filePath.split('/').pop();
    logger.info(`🖨️  [SIM] Simulating Print Job`);
    logger.info(`   File: ${fileName}`);
    logger.info(`   Pages: ${pages}`);
    logger.info(`   Printer: VIRTUAL_PRINTER`);
    logger.info(`   [SIM] Settings: ${JSON.stringify(settings)}`);

    // Simulate print delay (2-3 seconds)
    const delay = 2000 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    logger.success(`[SIM] Print simulation complete (${(delay / 1000).toFixed(1)}s)`);
    return { success: true, pages, cupsJobId: 'SIM-001' };
  }

  return new Promise((resolve, reject) => {
    logger.info(`🖨️  Sending to CUPS — file: ${filePath.split('/').pop()}, pages: ${pages}`);

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
        reject(new PrinterError(`Print command failed: ${stderr || error.message}`, printerName));
        return;
      }

      logger.success('Print job accepted by CUPS');

      // Parse CUPS job ID from lp output
      // Format: "request id is PRINTER_NAME-NUMBER (N file(s))"
      const jobIdMatch = (stdout || '').match(/request id is (\S+)/);
      const cupsJobId = jobIdMatch ? jobIdMatch[1] : null;

      if (!cupsJobId) {
        // Could not parse job ID — fall back to fire-and-forget
        logger.warn('[CUPS] WARNING: Could not get job ID, falling back to fire-and-forget');
        resolve({ success: true, pages, cupsJobId: null });
        return;
      }

      logger.job(`[CUPS] ${cupsJobId} submitted, polling for completion...`);

      // Poll CUPS for real completion
      try {
        const cupsResult = await pollCupsJobStatus(cupsJobId, logger);
        if (cupsResult.success) {
          resolve({ success: true, pages, cupsJobId });
        } else {
          reject(new PrinterError(cupsResult.error || 'CUPS job failed', printerName));
        }
      } catch (pollError) {
        // Polling itself errored — fall back to success with warning
        logger.warn(`[CUPS] Polling error: ${pollError.message}, assuming print succeeded`);
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
