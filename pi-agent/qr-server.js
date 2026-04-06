// pi-agent/qr-server.js - Standalone QR Code Web Display
require('dotenv').config();
const express = require('express');
const QRCode = require('qrcode');
const os = require('os');

const app = express();
const PORT = process.env.QR_SERVER_PORT || 8000;
const DEFAULT_KIOSK_ID = (() => {
  try {
    const username = os.userInfo().username;
    if (username) return username;
  } catch (_) {
    // ignore
  }
  return `kiosk_${os.hostname()}`;
})();
const KIOSK_ID = process.env.KIOSK_ID || DEFAULT_KIOSK_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://leprint.in';
const LOCATION = process.env.LOCATION || 'Unknown Location';
const FLOOR = process.env.FLOOR || 'N/A';
const QR_SERVER_VERSION = '1.0.0';

// Generate QR code URL
const qrUrl = `${FRONTEND_URL}?kiosk_id=${KIOSK_ID}&location=${encodeURIComponent(LOCATION)}&floor=${encodeURIComponent(FLOOR)}`;

// Serve QR code page
app.get('/', async (req, res) => {
  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // HTML page with QR code
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LePrint Kiosk — ${KIOSK_ID}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg: #0a0a0a;
                --card-bg: rgba(255, 255, 255, 0.03);
                --card-border: rgba(255, 255, 255, 0.08);
                --text-main: rgba(255, 255, 255, 0.95);
                --text-muted: rgba(255, 255, 255, 0.4);
                --accent: #ffffff;
                --success: #10b981;
                --radius: 32px;
            }

            * { margin: 0; padding: 0; box-sizing: border-box; }

            body {
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                background-color: var(--bg);
                background-image: 
                    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
                background-size: 32px 32px;
                color: var(--text-main);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 40px;
                overflow: hidden;
                -webkit-font-smoothing: antialiased;
            }

            .main-card {
                background: var(--card-bg);
                backdrop-filter: blur(40px);
                -webkit-backdrop-filter: blur(40px);
                border: 1px solid var(--card-border);
                border-radius: var(--radius);
                width: 100%;
                max-width: 1100px;
                min-height: 640px;
                display: grid;
                grid-template-columns: 1.1fr 0.9fr;
                gap: 20px;
                padding: 24px;
                box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.02);
                animation: float 8s ease-in-out infinite;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            /* Left Info Section */
            .content-area {
                padding: 48px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                background: rgba(255, 255, 255, 0.01);
                border-radius: 24px;
                border: 1px solid rgba(255, 255, 255, 0.02);
            }

            .brand-logo {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 64px;
            }

            .logo-icon {
                width: 56px;
                height: 56px;
                background: #ffffff;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #000;
                box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
            }

            .brand-name {
                font-size: 28px;
                font-weight: 900;
                letter-spacing: -1.5px;
            }

            .hero-text h1 {
                font-size: 56px;
                font-weight: 800;
                letter-spacing: -2.5px;
                line-height: 1.1;
                margin-bottom: 24px;
                background: linear-gradient(to bottom right, #fff, rgba(255, 255, 255, 0.5));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .hero-text p {
                font-size: 18px;
                color: var(--text-muted);
                max-width: 400px;
                line-height: 1.6;
            }

            /* Dashboard Style Info Pill */
            .kiosk-badge {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 20px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 20px;
                width: fit-content;
                margin-bottom: 40px;
            }

            .kiosk-id {
                font-family: ui-monospace, monospace;
                font-weight: 700;
                font-size: 14px;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: var(--text-main);
            }

            .status-dot {
                width: 8px;
                height: 8px;
                background: var(--success);
                border-radius: 50%;
                box-shadow: 0 0 12px var(--success);
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.5; }
                100% { transform: scale(1); opacity: 1; }
            }

            .footer-meta {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .location-meta {
                font-size: 14px;
                color: var(--text-muted);
                display: flex;
                gap: 12px;
                font-weight: 500;
            }

            .location-meta span {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            /* Right QR Section */
            .qr-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
            }

            .qr-outer-glow {
                position: absolute;
                width: 400px;
                height: 400px;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
                pointer-events: none;
            }

            .qr-display-case {
                background: #ffffff;
                padding: 32px;
                border-radius: 40px;
                box-shadow: 0 32px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                cursor: pointer;
            }

            .qr-display-case:hover {
                transform: scale(1.05) translateY(-5px);
            }

            .qr-img {
                width: 300px;
                height: 300px;
                display: block;
            }

            .scan-tooltip {
                margin-top: 32px;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 2px;
                text-transform: uppercase;
                color: var(--text-muted);
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .scan-tooltip::before, .scan-tooltip::after {
                content: '';
                width: 20px;
                height: 1px;
                background: rgba(255, 255, 255, 0.1);
            }

            /* Responsive */
            @media (max-width: 1000px) {
                .main-card { grid-template-columns: 1fr; max-width: 600px; min-height: auto; padding: 20px; }
                .content-area { padding: 32px; align-items: center; text-align: center; }
                .hero-text h1 { font-size: 40px; }
                .hero-text p { margin: 0 auto 24px; }
                .kiosk-badge { margin: 0 auto 32px; }
                .brand-logo { margin-bottom: 40px; }
                .qr-section { padding: 40px 0; }
                body { padding: 20px; }
            }

            @media (max-height: 700px) and (orientation: landscape) {
                body { padding: 10px; }
                .main-card { min-height: 90vh; }
                .hero-text h1 { font-size: 32px; }
                .content-area { padding: 24px; }
                .brand-logo { margin-bottom: 20px; }
                .qr-img { width: 220px; height: 220px; }
            }
        </style>
    </head>
    <body>
        <div class="main-card">
            <div class="content-area">
                <div class="top-meta">
                    <div class="brand-logo">
                        <div class="logo-icon">
                            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                <path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/>
                                <rect width="12" height="8" x="6" y="14" rx="1"/>
                            </svg>
                        </div>
                        <span class="brand-name">LePrint</span>
                    </div>

                    <div class="kiosk-badge">
                        <span class="status-dot"></span>
                        <span class="kiosk-id">${KIOSK_ID}</span>
                    </div>

                    <div class="hero-text">
                        <h1>Print your docs <br>in seconds.</h1>
                        <p>Self-service kiosk system. Upload from mobile, pay securely, and collect your prints instantly.</p>
                    </div>
                </div>

                <div class="footer-meta">
                    <div class="location-meta">
                        <span>📍 ${LOCATION}</span>
                        <span>•</span>
                        <span>Floor ${FLOOR}</span>
                    </div>
                    <div style="font-size: 11px; opacity: 0.2; letter-spacing: 0.5px;">SYSTEM v${QR_SERVER_VERSION} — 0.0.0.0:${PORT}</div>
                </div>
            </div>

            <div class="qr-section">
                <div class="qr-outer-glow"></div>
                <div class="qr-display-case" onclick="window.open('${qrUrl}', '_blank')">
                    <img src="${qrDataUrl}" alt="Scan to Print" class="qr-img">
                </div>
                <div class="scan-tooltip">Scan to Start</div>
            </div>
        </div>

        <script>
            // Refresh logic to keep kiosk state current
            setTimeout(() => location.reload(), 300000);
            
            // Console identify
            console.log("LePrint Kiosk Display v${QR_SERVER_VERSION}");
        </script>
    </body>
    </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).send('Error generating QR code');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    kiosk_id: KIOSK_ID,
    qr_url: qrUrl,
    timestamp: new Date().toISOString()
  });
});

// Get QR code as image
app.get('/qr.png', async (req, res) => {
  try {
    const buffer = await QRCode.toBuffer(qrUrl, {
      width: 400,
      margin: 2
    });
    
    res.type('image/png');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating QR image:', error);
    res.status(500).send('Error generating QR image');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║   QR Display Server Running            ║
║   Port: ${PORT}                           ║
║   Kiosk: ${KIOSK_ID.padEnd(30)}║
╚════════════════════════════════════════╝

🌐 Access QR code at:
   Local:   http://localhost:${PORT}
   Network: http://${getLocalIP()}:${PORT}

📱 QR Code URL: ${qrUrl}
  `);
});

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
