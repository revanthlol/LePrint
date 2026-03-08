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
  }

  // ==================== AUTO-DISCOVERY ====================

  /**
   * Discover eSCL scanner IP on the local network via mDNS (avahi-browse).
   * Returns the IP address string, or null if not found.
   */
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
          // Format: =;iface;IPv4;name;type;domain;hostname;address;port;txt
          if (parts.length >= 8 && parts[7] && !parts[7].includes(':')) {
            const ip = parts[7];
            // Skip loopback — CUPS often advertises a local eSCL proxy on 127.0.0.1
            if (ip.startsWith('127.')) {
              logger.info(`  Skipping loopback scanner: ${ip} (${parts[3] || 'unknown'})`);
              continue;
            }
            logger.info(`✓ Scanner auto-discovered: ${ip} (${parts[3] || 'unknown'})`);
            return ip;
          }
        }
      } catch (e) {
        // avahi-browse not available or no results, try next type
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

      const result = await xml2js.parseStringPromise(response.data);
      this.capabilities = result;

      // Parse supported settings from capabilities XML
      this._parseCapabilities(result);

      this.logger.info('✓ Scanner capabilities fetched');
      return this.capabilities;
    } catch (error) {
      throw new Error(`Scanner discovery failed: ${error.message}`);
    }
  }

  _parseCapabilities(caps) {
    try {
      const root = caps['scan:ScannerCapabilities'] || {};

      // Try Platen (flatbed) first, then ADF
      const inputCaps = this._dig(root, 'scan:Platen', 'scan:PlatenInputCaps')
                     || this._dig(root, 'scan:Adf', 'scan:AdfSimplexInputCaps');

      if (!inputCaps) {
        this.logger.warn('Could not find input caps in scanner capabilities');
        return;
      }

      this.maxWidth = parseInt(this._val(inputCaps, 'scan:MaxWidth')) || 2550;
      this.maxHeight = parseInt(this._val(inputCaps, 'scan:MaxHeight')) || 3508;

      const profile = this._dig(inputCaps, 'scan:SettingProfiles', 'scan:SettingProfile');
      if (!profile) return;

      // Color modes
      const colorModes = this._dig(profile, 'scan:ColorModes');
      if (colorModes?.['scan:ColorMode']) {
        this.supportedColorModes = [].concat(colorModes['scan:ColorMode']);
      }

      // Resolutions
      const discreteRes = this._dig(profile, 'scan:SupportedResolutions', 'scan:DiscreteResolutions');
      if (discreteRes?.['scan:DiscreteResolution']) {
        const resList = [].concat(discreteRes['scan:DiscreteResolution']);
        this.supportedResolutions = resList
          .map(r => {
            const xr = r['scan:XResolution'];
            return parseInt(Array.isArray(xr) ? xr[0] : xr);
          })
          .filter(Boolean);
      }

      // Document formats
      const fmtContainer = this._dig(profile, 'scan:DocumentFormats');
      if (fmtContainer) {
        const fmts = fmtContainer['pwg:DocumentFormat'] || fmtContainer['scan:DocumentFormat'];
        if (fmts) this.supportedFormats = [].concat(fmts);
      }

      this.logger.info(`  Colors: [${this.supportedColorModes.join(', ')}]`);
      this.logger.info(`  Resolutions: [${this.supportedResolutions.join(', ')}]`);
      this.logger.info(`  Formats: [${this.supportedFormats.join(', ')}]`);
      this.logger.info(`  Max scan area: ${this.maxWidth}x${this.maxHeight}`);
    } catch (e) {
      this.logger.warn(`Could not fully parse capabilities: ${e.message}`);
    }
  }

  // Navigate nested xml2js objects: _dig(obj, 'a', 'b') → obj.a[0].b[0]
  _dig(obj, ...keys) {
    let current = obj;
    for (const key of keys) {
      if (!current?.[key]) return null;
      current = Array.isArray(current[key]) ? current[key][0] : current[key];
    }
    return current;
  }

  // Get scalar value: _val(obj, 'key') → obj.key[0] or obj.key
  _val(obj, key) {
    if (!obj?.[key]) return null;
    return Array.isArray(obj[key]) ? obj[key][0] : obj[key];
  }

  // ==================== OPTION VALIDATION ====================

  _validateOptions(options) {
    let { resolution, colorMode, format } = options;

    // Validate color mode against capabilities
    if (this.supportedColorModes.length > 0 && !this.supportedColorModes.includes(colorMode)) {
      const fallback = this.supportedColorModes.includes('Grayscale8')
        ? 'Grayscale8'
        : this.supportedColorModes[0];
      this.logger.warn(`ColorMode '${colorMode}' not supported, falling back to '${fallback}'`);
      colorMode = fallback;
    }

    // Validate resolution against capabilities
    if (this.supportedResolutions.length > 0 && !this.supportedResolutions.includes(resolution)) {
      const fallback = this.supportedResolutions.includes(300)
        ? 300
        : this.supportedResolutions[0];
      this.logger.warn(`Resolution ${resolution} DPI not supported, falling back to ${fallback}`);
      resolution = fallback;
    }

    // Validate document format against capabilities
    if (this.supportedFormats.length > 0 && !this.supportedFormats.includes(format)) {
      const fallback = this.supportedFormats.includes('application/pdf')
        ? 'application/pdf'
        : this.supportedFormats[0];
      this.logger.warn(`Format '${format}' not supported, falling back to '${fallback}'`);
      format = fallback;
    }

    return { resolution, colorMode, format };
  }

  // ==================== SCAN JOB ====================

  async createScanJob(options = {}) {
    // Validate against what the scanner actually supports
    const validated = this._validateOptions({
      resolution: options.resolution || 300,
      colorMode: options.colorMode || 'RGB24',
      format: options.format || 'application/pdf'
    });

    const width = Math.min(options.width || 2480, this.maxWidth);
    const height = Math.min(options.height || 3508, this.maxHeight);

    this.logger.info(`  Scan settings: ${validated.colorMode}, ${validated.resolution}DPI, ${validated.format}, ${width}x${height}`);

    const scanSettings = `<?xml version="1.0" encoding="UTF-8"?>
<scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03" xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm">
  <pwg:Version>2.0</pwg:Version>
  <scan:Intent>Document</scan:Intent>
  <pwg:ScanRegions>
    <pwg:ScanRegion>
      <pwg:Height>${height}</pwg:Height>
      <pwg:Width>${width}</pwg:Width>
      <pwg:XOffset>0</pwg:XOffset>
      <pwg:YOffset>0</pwg:YOffset>
    </pwg:ScanRegion>
  </pwg:ScanRegions>
  <scan:ColorMode>${validated.colorMode}</scan:ColorMode>
  <scan:XResolution>${validated.resolution}</scan:XResolution>
  <scan:YResolution>${validated.resolution}</scan:YResolution>
  <pwg:DocumentFormat>${validated.format}</pwg:DocumentFormat>
</scan:ScanSettings>`;

    try {
      const response = await axios.post(`${this.baseURL}/ScanJobs`, scanSettings, {
        headers: { 'Content-Type': 'text/xml' },
        maxRedirects: 0,
        validateStatus: status => status === 201
      });

      const jobLocation = response.headers.location;
      const jobId = jobLocation.split('/').pop();

      this.logger.info(`✓ Scan job created: ${jobId}`);
      return { jobId, format: validated.format };
    } catch (error) {
      throw new Error(`Failed to create scan job: ${error.message}`);
    }
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

      // Create scan job (validates options against capabilities)
      const { jobId, format } = await this.createScanJob(options);

      // Determine output file extension based on actual format used
      const timestamp = Date.now();
      let ext = 'pdf';
      if (format.includes('jpeg') || format.includes('jpg')) ext = 'jpg';
      else if (format.includes('png')) ext = 'png';

      const outputPath = path.join(outputDir, `scan_${timestamp}.${ext}`);
      await this.retrieveDocument(jobId, outputPath);

      // If scanner returned a non-PDF format, convert to PDF for the pipeline
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
