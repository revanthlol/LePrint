// pi-agent/modules/utils.js
// File conversion and utility functions

const fs = require('fs');
const path = require('path');
const { exec, execFile } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const { ConversionError } = require('./errors');

const CONVERSION_TIMEOUT = 60000;

// ==================== CONVERSION TOOLS CHECK ====================
async function checkConversionTools(logger) {
  logger.info('🔧 Checking conversion tools...\n');
  
  return new Promise((resolve) => {
    let toolsFound = { libreoffice: false, imagemagick: false };

    // Check LibreOffice
    exec('libreoffice --version', (error, stdout) => {
      if (error) {
        logger.warn('LibreOffice not found - document conversion disabled');
        logger.warn('   Install: sudo apt install libreoffice-writer');
      } else {
        logger.success(`LibreOffice: ${stdout.trim()}`);
        toolsFound.libreoffice = true;
      }

      // Check ImageMagick
      exec('convert --version', (error, stdout) => {
        if (error) {
          exec('magick --version', (error2, stdout2) => {
            if (error2) {
              logger.warn('ImageMagick not found - image conversion disabled');
              logger.warn('   Install: sudo apt install imagemagick');
            } else {
              logger.success(`ImageMagick: ${stdout2.split('\n')[0]}`);
              toolsFound.imagemagick = true;
            }
            logger.info('');
            resolve(toolsFound);
          });
        } else {
          logger.success(`ImageMagick: ${stdout.split('\n')[0]}`);
          toolsFound.imagemagick = true;
          logger.info('');
          resolve(toolsFound);
        }
      });
    });
  });
}

// ==================== FILE TYPE DETECTION ====================
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  if (ext === '.pdf') return 'pdf';
  if (['.doc', '.docx', '.rtf', '.odt', '.txt', '.md'].includes(ext)) return 'document';
  if (['.png', '.jpg', '.jpeg'].includes(ext)) return 'image';
  
  return 'unknown';
}

// ==================== DOCUMENT CONVERSION ====================
async function convertDocumentToPDF(inputPath, logger) {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${baseName}.pdf`);
    
    logger.info('   🔄 Converting document to PDF...');
    
    const cmd = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
    
    exec(cmd, { timeout: CONVERSION_TIMEOUT }, (error, stdout, stderr) => {
      if (error) {
        logger.error(`   Conversion failed: ${stderr}`);
        reject(new ConversionError(`LibreOffice conversion failed: ${stderr || error.message}`, 'document'));
      } else {
        if (fs.existsSync(outputPath)) {
          const outputSize = fs.statSync(outputPath).size;
          logger.info(`   ✓ Converted to PDF (${(outputSize / 1024).toFixed(1)} KB)`);
          resolve(outputPath);
        } else {
          reject(new ConversionError('PDF output file not created', 'document'));
        }
      }
    });
  });
}

// ==================== IMAGE CONVERSION ====================
async function convertImageToPDF(inputPath, logger, settings = {}) {
  return new Promise((resolve, reject) => {
    logger.info('   🔄 Converting image to PDF...');
    logger.debug(`   Input: ${inputPath}`);
    logger.debug(`   Settings: ${JSON.stringify(settings)}`);

    if (!fs.existsSync(inputPath)) {
      return reject(new ConversionError("Input image does not exist", 'image'));
    }

    const ext = path.extname(inputPath).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".bmp"].includes(ext)) {
      return reject(new ConversionError(`Unsupported image format: ${ext}`, 'image'));
    }

    const outputPath = inputPath.replace(ext, "_final.pdf");
    const A4_WIDTH = 1240;
    const A4_HEIGHT = 1754;
    
    const isFit = (settings.scaling || 'fit') === 'fit';
    
    // Order of arguments: Global settings -> Input file -> Operators -> Output file
    const args = [
      "-density", "150",
      inputPath
    ];

    if (isFit) {
      args.push("-resize", `${A4_WIDTH}x${A4_HEIGHT}`);
    } else {
      args.push("-resize", `${A4_WIDTH}x${A4_HEIGHT}>`);
    }

    args.push(
      "-gravity", "center",
      "-background", "white",
      "-extent", `${A4_WIDTH}x${A4_HEIGHT}`,
      "-units", "PixelsPerInch",
      outputPath
    );

    const tryMagickV7 = () => {
      logger.info('   🔍 Trying ImageMagick v7 (magick)...');
      
      exec(`which magick`, (whichError) => {
        if (whichError) {
          logger.info('   ⚠ ImageMagick v7 not found, trying v6...');
          return tryMagickV6();
        }

        execFile('magick', args, { timeout: CONVERSION_TIMEOUT }, (error, stdout, stderr) => {
          if (stderr && stderr.trim() && !stderr.includes('Warning')) {
            logger.warn(`   ImageMagick stderr: ${stderr.trim()}`);
          }

          if (error) {
            logger.error(`   ImageMagick v7 failed: ${error.message}`);
            return tryMagickV6();
          }

          verifyAndResolve(outputPath, resolve, reject);
        });
      });
    };

    const tryMagickV6 = () => {
      logger.info('   🔍 Trying ImageMagick v6 (convert)...');
      
      exec(`which convert`, (whichError) => {
        if (whichError) {
          return reject(new ConversionError(
            'ImageMagick not found. Install with: sudo apt install imagemagick',
            'image'
          ));
        }

        execFile('convert', args, { timeout: CONVERSION_TIMEOUT }, (error, stdout, stderr) => {
          if (stderr && stderr.trim() && !stderr.includes('Warning')) {
            logger.warn(`   ImageMagick stderr: ${stderr.trim()}`);
          }

          if (error) {
            logger.error(`   ImageMagick v6 failed: ${error.message}`);
            return reject(new ConversionError(`Image conversion failed: ${error.message}`, 'image'));
          }

          verifyAndResolve(outputPath, resolve, reject);
        });
      });
    };

    const verifyAndResolve = (path, res, rej) => {
      if (!fs.existsSync(path)) {
        return rej(new ConversionError('PDF output not created by ImageMagick', 'image'));
      }

      const outputSize = fs.statSync(path).size;
      if (outputSize < 100) {
         return rej(new ConversionError('Generated PDF is nearly empty (corrupt)', 'image'));
      }

      logger.info(`   ✓ Converted to PDF (${(outputSize / 1024).toFixed(1)} KB)`);
      res(path);
    };

    tryMagickV7();
  });
}

// ==================== PDF VERIFICATION ====================
async function verifyPDF(pdfPath, expectedPages, logger) {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const actualPages = pdfDoc.getPageCount();
    
    logger.info(`   ✓ Verified: ${actualPages} pages`);
    
    if (expectedPages && actualPages !== expectedPages) {
      logger.warn(`   ⚠ Page mismatch: expected ${expectedPages}, got ${actualPages}`);
    }
    
    return actualPages;
  } catch (error) {
    throw new ConversionError(`PDF verification failed: ${error.message}`, 'pdf');
  }
}

module.exports = {
  checkConversionTools,
  getFileType,
  convertDocumentToPDF,
  convertImageToPDF,
  verifyPDF
};
