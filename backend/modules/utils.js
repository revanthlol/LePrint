const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PDFDocument } = require('pdf-lib');

// Constants
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-in-production';
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.odt', '.png', '.jpg', '.jpeg'];

// Multer Config
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Supported: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
  }
});

// Helpers
function generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generatePrintToken(jobId, kioskId) {
    const timestamp = Date.now();
    const token = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(`${jobId}:${kioskId}:${timestamp}`)
        .digest('hex');
    return { token, timestamp };
}

async function countPDFPages(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(dataBuffer);
        return pdfDoc.getPageCount();
    } catch (e) {
        console.error('Page count error:', e);
        return 1;
    }
}

function countPagesInRange(rangeStr, maxPages) {
    if (!rangeStr || rangeStr === 'all') return maxPages;
    try {
        const pages = new Set();
        const parts = rangeStr.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [s, e] = trimmed.split('-');
                const start = Math.max(1, parseInt(s) || 1);
                const end = Math.min(maxPages, parseInt(e) || maxPages);
                for (let i = start; i <= end; i++) pages.add(i);
            } else {
                const p = parseInt(trimmed);
                if (p >= 1 && p <= maxPages) pages.add(p);
            }
        }
        return Math.max(1, pages.size);
    } catch {
        return maxPages;
    }
}

module.exports = {
    upload,
    generateJobId,
    generatePrintToken,
    countPDFPages,
    countPagesInRange,
    PRICE_PER_PAGE: 3
};
