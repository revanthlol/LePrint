// pi-agent/modules/scanner.js
const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class Scanner {
  constructor(printerIP, logger) {
    this.printerIP = printerIP;
    this.baseURL = `http://${printerIP}/eSCL`;
    this.logger = logger;
    this.capabilities = null;
    this.supportedColorModes = [];
    this.supportedResolutions = [];
    this.supportedFormats = [];
    this.maxWidth = 2550;
    this.maxHeight = 3508;
    this.hasPlaten = false;
    this.hasAdf = false;
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

  // ==================== CAPABILITIES ====================

  async getCapabilities() {
    try {
      const response = await axios.get(`${this.baseURL}/ScannerCapabilities`, {
        timeout: 15000
      });

      // Log raw XML for debugging on first fetch
      this.logger.info(`[Scanner] Raw capabilities length: ${response.data.length} chars`);

      const result = await xml2js.parseStringPromise(response.data);
      this.capabilities = result;

      this._parseCapabilities(result);

      this.logger.info('✓ Scanner capabilities fetched');
      return this.capabilities;
    } catch (error) {
      throw new Error(`Scanner discovery failed: ${error.message}`);
    }
  }

  _parseCapabilities(caps) {
    try {
      // The root element may or may not have namespace prefix
      const root = caps['scan:ScannerCapabilities']
                || caps['ScannerCapabilities']
                || caps[Object.keys(caps)[0]]
                || {};

      // Log top-level keys for debugging
      this.logger.info(`[Scanner] Capability root keys: ${Object.keys(root).join(', ')}`);

      // Try Platen (flatbed)
      let inputCaps = this._dig(root, 'scan:Platen', 'scan:PlatenInputCaps');
      if (inputCaps) this.hasPlaten = true;

      // Try ADF if no platen
      if (!inputCaps) {
        inputCaps = this._dig(root, 'scan:Adf', 'scan:AdfSimplexInputCaps');
        if (inputCaps) this.hasAdf = true;
      }

      // Try without namespace prefix
      if (!inputCaps) {
        inputCaps = this._dig(root, 'Platen', 'PlatenInputCaps');
        if (inputCaps) this.hasPlaten = true;
      }

      if (!inputCaps) {
        this.logger.warn('[Scanner] Could not find input caps, logging full structure...');
        this.logger.warn(`[Scanner] Root keys: ${JSON.stringify(Object.keys(root))}`);
        // Try to find any key containing "Platen" or "InputCaps"
        for (const key of Object.keys(root)) {
          if (key.toLowerCase().includes('platen') || key.toLowerCase().includes('input')) {
            this.logger.info(`[Scanner] Found potential input: ${key}`);
            const nested = Array.isArray(root[key]) ? root[key][0] : root[key];
            if (typeof nested === 'object') {
              this.logger.info(`[Scanner]   Sub-keys: ${Object.keys(nested).join(', ')}`);
            }
          }
        }
        return;
      }

      this.logger.info(`[Scanner] Input source: ${this.hasPlaten ? 'Platen' : 'ADF'}`);

      this.maxWidth = parseInt(this._val(inputCaps, 'scan:MaxWidth') || this._val(inputCaps, 'MaxWidth')) || 2550;
      this.maxHeight = parseInt(this._val(inputCaps, 'scan:MaxHeight') || this._val(inputCaps, 'MaxHeight')) || 3508;

      // Setting profiles may be directly under inputCaps or nested
      const profile = this._dig(inputCaps, 'scan:SettingProfiles', 'scan:SettingProfile')
                   || this._dig(inputCaps, 'SettingProfiles', 'SettingProfile');

      if (!profile) {
        this.logger.warn('[Scanner] No SettingProfile found');
        this.logger.info(`[Scanner] InputCaps keys: ${Object.keys(inputCaps).join(', ')}`);
        return;
      }

      // Color modes
      const colorModes = this._dig(profile, 'scan:ColorModes') || this._dig(profile, 'ColorModes');
      if (colorModes) {
        const modes = colorModes['scan:ColorMode'] || colorModes['ColorMode'];
        if (modes) this.supportedColorModes = [].concat(modes);
      }

      // Resolutions
      const discreteRes = this._dig(profile, 'scan:SupportedResolutions', 'scan:DiscreteResolutions')
                       || this._dig(profile, 'SupportedResolutions', 'DiscreteResolutions');
      if (discreteRes) {
        const resList = [].concat(
          discreteRes['scan:DiscreteResolution'] || discreteRes['DiscreteResolution'] || []
        );
        this.supportedResolutions = resList
          .map(r => {
            const xr = r['scan:XResolution'] || r['XResolution'];
            return parseInt(Array.isArray(xr) ? xr[0] : xr);
          })
          .filter(Boolean);
      }

      // Document formats — can be under profile or under inputCaps directly
      const fmtContainer = this._dig(profile, 'scan:DocumentFormats')
                        || this._dig(profile, 'DocumentFormats')
                        || this._dig(inputCaps, 'scan:DocumentFormats')
                        || this._dig(inputCaps, 'DocumentFormats');
      if (fmtContainer) {
        const fmts = fmtContainer['pwg:DocumentFormat']
                  || fmtContainer['scan:DocumentFormat']
                  || fmtContainer['DocumentFormat'];
        if (fmts) this.supportedFormats = [].concat(fmts);
      }

      this.logger.info(`  Colors: [${this.supportedColorModes.join(', ')}]`);
      this.logger.info(`  Resolutions: [${this.supportedResolutions.join(', ')}]`);
      this.logger.info(`  Formats: [${this.supportedFormats.join(', ')}]`);
      this.logger.info(`  Max scan area: ${this.maxWidth}x${this.maxHeight}`);
    } catch (e) {
      this.logger.warn(`[Scanner] Capability parse error: ${e.message}`);
    }
  }

  _dig(obj, ...keys) {
    let current = obj;
    for (const key of keys) {
      if (!current?.[key]) return null;
      current = Array.isArray(current[key]) ? current[key][0] : current[key];
    }
    return current;
  }

  _val(obj, key) {
    if (!obj?.[key]) return null;
    return Array.isArray(obj[key]) ? obj[key][0] : obj[key];
  }

  // ==================== OPTION VALIDATION ====================

  _validateOptions(options) {
    let { resolution, colorMode, format } = options;

    if (this.supportedColorModes.length > 0 && !this.supportedColorModes.includes(colorMode)) {
      const fallback = this.supportedColorModes.includes('Grayscale8')
        ? 'Grayscale8'
        : this.supportedColorModes[0];
      this.logger.warn(`ColorMode '${colorMode}' not supported, using '${fallback}'`);
      colorMode = fallback;
    }

    if (this.supportedResolutions.length > 0 && !this.supportedResolutions.includes(resolution)) {
      // Pick closest supported resolution
      const sorted = [...this.supportedResolutions].sort((a, b) => Math.abs(a - resolution) - Math.abs(b - resolution));
      const fallback = sorted[0];
      this.logger.warn(`Resolution ${resolution} not supported, using ${fallback}`);
      resolution = fallback;
    }

    if (this.supportedFormats.length > 0 && !this.supportedFormats.includes(format)) {
      const fallback = this.supportedFormats.includes('application/pdf')
        ? 'application/pdf'
        : this.supportedFormats[0];
      this.logger.warn(`Format '${format}' not supported, using '${fallback}'`);
      format = fallback;
    }

    return { resolution, colorMode, format };
  }

  // ==================== SCAN JOB ====================

  _buildScanXML(colorMode, resolution, format, width, height) {
    const inputSource = this.hasAdf ? 'Adf' : 'Platen';

    return `<?xml version="1.0" encoding="UTF-8"?>
<scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03" xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm">
  <pwg:Version>2.0</pwg:Version>
  <scan:InputSource>${inputSource}</scan:InputSource>
  <pwg:ScanRegions pwg:MustHonor="true">
    <pwg:ScanRegion>
      <pwg:ContentRegionUnits>escl:ThreeHundredthsOfInches</pwg:ContentRegionUnits>
      <pwg:Height>${height}</pwg:Height>
      <pwg:Width>${width}</pwg:Width>
      <pwg:XOffset>0</pwg:XOffset>
      <pwg:YOffset>0</pwg:YOffset>
    </pwg:ScanRegion>
  </pwg:ScanRegions>
  <scan:ColorMode>${colorMode}</scan:ColorMode>
  <scan:XResolution>${resolution}</scan:XResolution>
  <scan:YResolution>${resolution}</scan:YResolution>
  <pwg:DocumentFormat>${format}</pwg:DocumentFormat>
</scan:ScanSettings>`;
  }

  async createScanJob(options = {}) {
    const validated = this._validateOptions({
      resolution: options.resolution || 300,
      colorMode: options.colorMode || 'RGB24',
      format: options.format || 'application/pdf'
    });

    const width = Math.min(options.width || 2480, this.maxWidth);
    const height = Math.min(options.height || 3508, this.maxHeight);

    // Try validated settings first, then progressively simpler fallbacks
    const attempts = [
      validated,
      { colorMode: 'Grayscale8', resolution: 300, format: 'application/pdf' },
      { colorMode: 'Grayscale8', resolution: 200, format: 'image/jpeg' },
    ];

    // Deduplicate — skip fallbacks that are identical to an earlier attempt
    const seen = new Set();
    const uniqueAttempts = attempts.filter(a => {
      const key = `${a.colorMode}_${a.resolution}_${a.format}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let lastError = null;

    for (let i = 0; i < uniqueAttempts.length; i++) {
      const settings = uniqueAttempts[i];
      const scanSettings = this._buildScanXML(settings.colorMode, settings.resolution, settings.format, width, height);

      this.logger.info(`  Attempt ${i + 1}: ${settings.colorMode}, ${settings.resolution}DPI, ${settings.format}`);

      try {
        const response = await axios.post(`${this.baseURL}/ScanJobs`, scanSettings, {
          headers: { 'Content-Type': 'text/xml' },
          maxRedirects: 0,
          validateStatus: status => status === 201
        });

        const jobLocation = response.headers.location;
        const jobId = jobLocation.split('/').pop();

        this.logger.info(`✓ Scan job created: ${jobId}`);
        return { jobId, format: settings.format };
      } catch (error) {
        const status = error.response?.status;
        const body = error.response?.data;
        this.logger.warn(`  Attempt ${i + 1} failed (HTTP ${status || 'N/A'}): ${error.message}`);
        if (body) {
          const bodyStr = typeof body === 'string' ? body.substring(0, 500) : JSON.stringify(body).substring(0, 500);
          this.logger.warn(`  Response body: ${bodyStr}`);
        }
        lastError = error;

        // Only retry on 400 (bad request = wrong settings), not on other errors
        if (status !== 400) break;
      }
    }

    throw new Error(`Failed to create scan job: ${lastError?.message || 'unknown error'}`);
  }

  // ==================== DOCUMENT RETRIEVAL ====================

  async retrieveDocument(jobId, outputPath) {
    const documentURL = `${this.baseURL}/ScanJobs/${jobId}/NextDocument`;

    try {
      let attempts = 0;
      while (attempts < 30) {
        try {
          const response = await axios.get(documentURL, {
            responseType: 'stream',
            timeout: 10000
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
          if (error.response?.status === 404) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
            continue;
          }
          throw error;
        }
      }

      throw new Error('Scan timeout - document not received');
    } catch (error) {
      throw new Error(`Failed to retrieve document: ${error.message}`);
    }
  }

  // ==================== COMPLETE SCAN WORKFLOW ====================

  async scan(options, outputDir) {
    try {
      this.logger.info('🔍 Starting scan...');

      // Fetch capabilities if not already cached
      if (!this.capabilities) {
        await this.getCapabilities();
      }

      // Create scan job with retry cascade
      const { jobId, format } = await this.createScanJob(options);

      const timestamp = Date.now();
      let ext = 'pdf';
      if (format.includes('jpeg') || format.includes('jpg')) ext = 'jpg';
      else if (format.includes('png')) ext = 'png';

      const outputPath = path.join(outputDir, `scan_${timestamp}.${ext}`);
      await this.retrieveDocument(jobId, outputPath);

      // Convert non-PDF to PDF for the pipeline
      if (ext !== 'pdf') {
        const pdfPath = path.join(outputDir, `scan_${timestamp}.pdf`);
        this.logger.info(`Converting ${ext} → PDF...`);
        try {
          execSync(`convert "${outputPath}" "${pdfPath}"`, { timeout: 30000 });
          fs.unlinkSync(outputPath);
          this.logger.info('✓ Converted to PDF');
          return pdfPath;
        } catch (convErr) {
          this.logger.warn(`Image→PDF conversion failed: ${convErr.message}, using raw ${ext}`);
          return outputPath;
        }
      }

      return outputPath;
    } catch (error) {
      throw new Error(`Scan failed: ${error.message}`);
    }
  }
}

module.exports = Scanner;
