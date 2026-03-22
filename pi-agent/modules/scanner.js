// pi-agent/modules/scanner.js
// Uses SANE (scanimage) as primary method, raw eSCL HTTP as fallback.
const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

const SIMULATE = process.env.SIMULATE_SCANNER === 'true';

// Minimal valid PDF buffer for simulation
const MOCK_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n0\n%%EOF'
);

// Map frontend color modes to SANE --mode values
const SANE_MODE_MAP = {
  'RGB24': 'Color',
  'Grayscale8': 'Gray',
  'BlackAndWhite1': 'Lineart'
};

class Scanner {
  constructor(printerIP, logger) {
    this.printerIP = printerIP;
    this.logger = logger;
    this.saneDevice = null;  // e.g. "escl:http://192.168.0.4:80"
    this.useSANE = false;
  }

  // ==================== AUTO-DISCOVERY ====================

  static async discoverIP(logger) {
    const serviceTypes = ['_uscan._tcp', '_eSCL._tcp'];

    for (const svcType of serviceTypes) {
      try {
        const output = execSync(
          `avahi-browse -rpt ${svcType} 2>/dev/null | grep "^="`,
          { timeout: 12000, encoding: 'utf-8' }
        );

        const lines = output.trim().split('\n').filter(l => l.startsWith('='));

        for (const line of lines) {
          const parts = line.split(';');
          if (parts.length >= 8 && parts[7] && !parts[7].includes(':')) {
            const ip = parts[7];
            if (ip.startsWith('127.')) {
              logger.info(`  Skipping loopback scanner: ${ip} (${parts[3] || 'unknown'})`);
              continue;
            }
            logger.info(`✓ Scanner auto-discovered: ${ip} (${parts[3] || 'unknown'})`);
            return ip;
          }
        }
      } catch (e) {
        // avahi-browse not available or no results
      }
    }

    logger.warn('⚠ No eSCL scanner found via mDNS discovery');
    return null;
  }

  // ==================== INITIALIZATION ====================

  /**
   * Probe for SANE scanimage availability and find the scanner device.
   * Call this once at startup.
   */
  async init() {
    // Simulation mode — skip all hardware probing
    if (SIMULATE) {
      this.logger.info('[SIM] Scanner simulation mode active — skipping hardware probe');
      return;
    }

    // 1. Check if scanimage exists
    try {
      execSync('which scanimage', { encoding: 'utf-8', timeout: 3000 });
    } catch {
      this.logger.warn('[Scanner] scanimage not found — install sane-utils');
      return;
    }

    // 2. Try to build device URI from known IP
    const deviceURI = `escl:http://${this.printerIP}:80`;

    // 3. Verify the device responds by listing it
    try {
      // Quick test: try to get parameters from the device
      execSync(`scanimage --device-name='${deviceURI}' --help 2>&1 | head -5`, {
        encoding: 'utf-8',
        timeout: 15000
      });
      this.saneDevice = deviceURI;
      this.useSANE = true;
      this.logger.info(`✓ SANE scanner ready: ${deviceURI}`);
      return;
    } catch (e) {
      this.logger.info(`[Scanner] Direct device URI failed, trying discovery...`);
    }

    // 4. Fallback: full SANE device discovery
    try {
      const output = execSync('scanimage -L 2>&1', {
        encoding: 'utf-8',
        timeout: 20000
      });

      // Parse all devices: device `escl:http://192.168.0.4:80' is a HP LaserJet
      const lines = output.split('\n');
      const devices = [];
      for (const line of lines) {
        const match = line.match(/device\s+[`']([^'`]+)[`']/);
        if (match) devices.push(match[1]);
      }

      if (devices.length === 0) {
        this.logger.warn('[Scanner] scanimage -L found no devices');
        return;
      }

      this.logger.info(`[Scanner] Found ${devices.length} device(s): ${devices.join(', ')}`);

      // Priority: escl > airscan > hpaio > anything else
      const pick =
        devices.find(d => d.startsWith('escl:') || d.startsWith('airscan:')) ||
        devices.find(d => d.startsWith('hpaio:')) ||
        devices[0];

      this.saneDevice = pick;
      this.useSANE = true;
      this.logger.info(`✓ SANE scanner selected: ${pick}`);
    } catch (e) {
      this.logger.warn(`[Scanner] SANE discovery failed: ${e.message}`);
    }
  }

  // ==================== SANE-BASED SCANNING ====================

  async scanWithSANE(options, outputDir) {
    const mode = SANE_MODE_MAP[options.colorMode] || 'Color';
    const resolution = options.resolution || 300;
    const timestamp = Date.now();
    const pngPath = path.join(outputDir, `scan_${timestamp}.png`);
    const pdfPath = path.join(outputDir, `scan_${timestamp}.pdf`);

    this.logger.info(`[SANE] Scanning: device=${this.saneDevice}, mode=${mode}, res=${resolution}`);

    try {
      // scanimage outputs to file via --output-file or shell redirect
      const cmd = `scanimage --device-name='${this.saneDevice}' --mode=${mode} --resolution=${resolution} --format=png --output-file='${pngPath}' 2>&1`;
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 120000 });
      if (output.trim()) this.logger.info(`[SANE] ${output.trim()}`);
    } catch (e) {
      const stderr1 = (e.stderr || e.stdout || e.message || '').toString().trim();
      this.logger.info(`[SANE] --output-file failed: ${stderr1}`);
      this.logger.info('[SANE] Retrying with shell redirect...');
      try {
        execSync(
          `scanimage --device-name='${this.saneDevice}' --mode=${mode} --resolution=${resolution} --format=png > '${pngPath}' 2>&1`,
          { encoding: 'utf-8', timeout: 120000, shell: true }
        );
      } catch (e2) {
        const stderr2 = (e2.stderr || e2.stdout || e2.message || '').toString().trim();
        this.logger.error(`[SANE] Redirect also failed: ${stderr2}`);
        throw new Error(`SANE scan failed: ${stderr2}`);
      }
    }

    // Verify output file exists and has content
    if (!fs.existsSync(pngPath) || fs.statSync(pngPath).size === 0) {
      throw new Error('SANE scan produced no output');
    }

    this.logger.info(`✓ Scan captured: ${(fs.statSync(pngPath).size / 1024).toFixed(0)} KB`);

    // Convert PNG to PDF
    this.logger.info('[SANE] Converting to PDF...');
    try {
      execSync(`convert '${pngPath}' '${pdfPath}'`, { timeout: 30000 });
      fs.unlinkSync(pngPath);
      this.logger.info('✓ PDF created');
      return pdfPath;
    } catch (convErr) {
      // If convert fails, return the PNG — backend can still serve it
      this.logger.warn(`PNG→PDF conversion failed: ${convErr.message}`);
      return pngPath;
    }
  }

  // ==================== RAW eSCL FALLBACK ====================

  async scanWithESCL(options, outputDir) {
    const baseURL = `http://${this.printerIP}/eSCL`;

    // Fetch capabilities
    this.logger.info('[eSCL] Fetching scanner capabilities...');
    const capsResp = await axios.get(`${baseURL}/ScannerCapabilities`, { timeout: 30000 });
    this.logger.info(`[eSCL] Capabilities: ${capsResp.data.length} chars`);

    // Build scan settings — try multiple XML formats
    const colorMode = options.colorMode || 'RGB24';
    const resolution = options.resolution || 300;
    const format = 'application/pdf';

    const xmlVariants = [
      // Variant 1: pwg:InputSource (SANE-style)
      `<?xml version="1.0" encoding="UTF-8"?>
<scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03" xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm">
  <pwg:Version>2.0</pwg:Version>
  <pwg:InputSource>Platen</pwg:InputSource>
  <scan:ColorMode>${colorMode}</scan:ColorMode>
  <scan:XResolution>${resolution}</scan:XResolution>
  <scan:YResolution>${resolution}</scan:YResolution>
  <scan:DocumentFormatExt>${format}</scan:DocumentFormatExt>
  <pwg:ScanRegions>
    <pwg:ScanRegion>
      <pwg:ContentRegionUnits>escl:ThreeHundredthsOfInches</pwg:ContentRegionUnits>
      <pwg:Height>3508</pwg:Height>
      <pwg:Width>2480</pwg:Width>
      <pwg:XOffset>0</pwg:XOffset>
      <pwg:YOffset>0</pwg:YOffset>
    </pwg:ScanRegion>
  </pwg:ScanRegions>
</scan:ScanSettings>`,

      // Variant 2: scan:InputSource, pwg:DocumentFormat
      `<?xml version="1.0" encoding="UTF-8"?>
<scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03" xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm">
  <pwg:Version>2.0</pwg:Version>
  <scan:InputSource>Platen</scan:InputSource>
  <scan:Intent>Document</scan:Intent>
  <scan:ColorMode>${colorMode}</scan:ColorMode>
  <scan:XResolution>${resolution}</scan:XResolution>
  <scan:YResolution>${resolution}</scan:YResolution>
  <pwg:DocumentFormat>${format}</pwg:DocumentFormat>
  <pwg:ScanRegions pwg:MustHonor="true">
    <pwg:ScanRegion>
      <pwg:ContentRegionUnits>escl:ThreeHundredthsOfInches</pwg:ContentRegionUnits>
      <pwg:Height>3508</pwg:Height>
      <pwg:Width>2480</pwg:Width>
      <pwg:XOffset>0</pwg:XOffset>
      <pwg:YOffset>0</pwg:YOffset>
    </pwg:ScanRegion>
  </pwg:ScanRegions>
</scan:ScanSettings>`,

      // Variant 3: Minimal — no ScanRegions at all
      `<?xml version="1.0" encoding="UTF-8"?>
<scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03" xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm">
  <pwg:Version>2.0</pwg:Version>
  <pwg:InputSource>Platen</pwg:InputSource>
  <scan:ColorMode>${colorMode}</scan:ColorMode>
  <scan:XResolution>${resolution}</scan:XResolution>
  <scan:YResolution>${resolution}</scan:YResolution>
  <pwg:DocumentFormat>${format}</pwg:DocumentFormat>
</scan:ScanSettings>`,

      // Variant 4: Absolute minimal with Grayscale + JPEG
      `<?xml version="1.0" encoding="UTF-8"?>
<scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03" xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm">
  <pwg:Version>2.0</pwg:Version>
  <pwg:InputSource>Platen</pwg:InputSource>
  <scan:ColorMode>Grayscale8</scan:ColorMode>
  <scan:XResolution>200</scan:XResolution>
  <scan:YResolution>200</scan:YResolution>
  <pwg:DocumentFormat>image/jpeg</pwg:DocumentFormat>
</scan:ScanSettings>`,
    ];

    let lastError = null;
    let usedFormat = format;
    let attempted = 0;

    for (let i = 0; i < xmlVariants.length; i++) {
      attempted++;
      this.logger.info(`[eSCL] Attempt ${i + 1}/${xmlVariants.length}...`);
      try {
        const response = await axios.post(`${baseURL}/ScanJobs`, xmlVariants[i], {
          headers: { 'Content-Type': 'text/xml' },
          maxRedirects: 0,
          validateStatus: s => s === 201,
          timeout: 120000
        });

        const jobLocation = response.headers.location;
        const jobId = jobLocation.split('/').pop();
        this.logger.info(`✓ Scan job created: ${jobId} (variant ${i + 1})`);

        // Variant 4 uses jpeg
        if (i === 3) usedFormat = 'image/jpeg';

        // Retrieve document
        const timestamp = Date.now();
        const ext = usedFormat.includes('jpeg') ? 'jpg' : 'pdf';
        const outputPath = path.join(outputDir, `scan_${timestamp}.${ext}`);
        await this._retrieveDocument(`${baseURL}/ScanJobs/${jobId}/NextDocument`, outputPath);

        // Convert to PDF if needed
        if (ext !== 'pdf') {
          const pdfPath = path.join(outputDir, `scan_${timestamp}.pdf`);
          execSync(`convert '${outputPath}' '${pdfPath}'`, { timeout: 30000 });
          fs.unlinkSync(outputPath);
          return pdfPath;
        }

        return outputPath;
      } catch (error) {
        const status = error.response?.status;
        const body = error.response?.data;
        this.logger.warn(`  Attempt ${i + 1} failed (${error.code || `HTTP ${status}` || 'unknown'}): ${error.message}`);
        if (body && typeof body === 'string' && body.length > 0) {
          this.logger.warn(`  Body: ${body.substring(0, 300)}`);
        }
        lastError = error;
        // Only retry next XML variant on 400 (rejected format).
        // Any other error (timeout, connection, 5xx) means stop trying.
        if (status !== 400) break;
      }
    }

    throw new Error(`eSCL scan failed (${attempted} variant${attempted > 1 ? 's' : ''} tried): ${lastError?.message}`);
  }

  async _retrieveDocument(url, outputPath) {
    let attempts = 0;
    const maxAttempts = 90; // up to 90 seconds of polling
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(url, {
          responseType: 'stream',
          timeout: 60000
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        this.logger.info(`✓ Document saved: ${outputPath}`);
        return outputPath;
      } catch (error) {
        const status = error.response?.status;
        const isRetryable = status === 404 || status === 503
          || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
          || error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED';

        if (isRetryable) {
          if (attempts % 10 === 0) {
            this.logger.info(`[eSCL] Waiting for scan result... (${attempts}s, ${error.code || `HTTP ${status}`})`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
          continue;
        }
        throw error;
      }
    }
    throw new Error(`Scan timeout — document not received after ${maxAttempts}s`);
  }

  // ==================== MAIN ENTRY POINT ====================

  async scan(options, outputDir) {
    // Simulation mode — generate mock PDF
    if (SIMULATE) {
      this.logger.info('[SIM] Simulating scan...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      const mockPath = path.join(outputDir, `scan_${Date.now()}.pdf`);
      fs.writeFileSync(mockPath, MOCK_PDF);
      const size = (MOCK_PDF.length / 1024).toFixed(1);
      this.logger.info(`[SIM] Scan complete — mock.pdf created (${size}kb)`);
      return mockPath;
    }

    this.logger.info('🔍 Starting scan...');

    // SANE path (preferred — handles protocol correctly)
    if (this.useSANE) {
      this.logger.info('[Scanner] Using SANE (scanimage)');
      return this.scanWithSANE(options, outputDir);
    }

    // Raw eSCL fallback
    this.logger.info('[Scanner] Using raw eSCL HTTP (SANE not available)');
    return this.scanWithESCL(options, outputDir);
  }
}

module.exports = Scanner;
