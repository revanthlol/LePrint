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
                max-width: 1200px;
                min-height: 700px;
                display: grid;
                grid-template-columns: 1.2fr 0.8fr;
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
                border: 1px solid rgba(255, 255, 255, 0.01);
            }

            .brand-logo {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 48px;
            }

            .logo-icon {
                width: 52px;
                height: 52px;
                background: #ffffff;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #000;
                box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
            }

            .brand-name {
                font-size: 24px;
                font-weight: 900;
                letter-spacing: -1.2px;
            }

            .hero-text h1 {
                font-size: 56px;
                font-weight: 800;
                letter-spacing: -2.5px;
                line-height: 1.1;
                margin-bottom: 20px;
                background: linear-gradient(to bottom right, #fff, rgba(255, 255, 255, 0.6));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            /* Kiosk ID Block */
            .id-container {
                margin: 32px 0;
            }

            .id-label {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: var(--text-muted);
                margin-bottom: 12px;
                display: block;
            }

            .id-value {
                font-family: ui-monospace, monospace;
                font-size: 32px;
                font-weight: 900;
                background: rgba(255, 255, 255, 0.05);
                padding: 8px 20px;
                border-radius: 12px;
                border-left: 4px solid var(--success);
                width: fit-content;
                color: #fff;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            }

            /* Instructions Grid */
            .instructions-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-top: 40px;
            }

            .step-card {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                padding: 24px;
                border-radius: 20px;
                transition: background 0.3s ease;
            }

            .step-card:hover {
                background: rgba(255, 255, 255, 0.04);
            }

            .step-icon {
                width: 32px;
                height: 32px;
                color: var(--text-muted);
                margin-bottom: 16px;
            }

            .step-title {
                font-size: 15px;
                font-weight: 700;
                margin-bottom: 8px;
                color: #fff;
            }

            .step-desc {
                font-size: 13px;
                color: var(--text-muted);
                line-height: 1.5;
            }

            .step-highlight {
                color: var(--success);
                font-weight: 600;
            }

            /* Right QR Section */
            .qr-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 0 32px 32px 0;
            }

            .qr-outer-glow {
                position: absolute;
                width: 500px;
                height: 500px;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
                pointer-events: none;
            }

            .qr-display-case {
                background: #ffffff;
                padding: 32px;
                border-radius: 40px;
                box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                cursor: pointer;
            }

            .qr-display-case:hover {
                transform: scale(1.04) rotate(1deg);
            }

            .qr-img {
                width: 320px;
                height: 320px;
                display: block;
            }

            .scan-badge {
                margin-top: 40px;
                padding: 10px 24px;
                background: #fff;
                color: #000;
                font-size: 12px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 2px;
                border-radius: 99px;
                box-shadow: 0 8px 24px rgba(255, 255, 255, 0.1);
            }

            /* Responsive */
            @media (max-width: 1100px) {
                .main-card { grid-template-columns: 1fr; max-width: 600px; min-height: auto; padding: 20px; }
                .content-area { padding: 40px; }
                .instructions-container { grid-template-columns: 1fr; }
                .qr-section { padding: 60px 0; border-radius: 24px; margin-top: 20px; }
                .hero-text h1 { font-size: 40px; }
            }

            @media (max-height: 800px) and (orientation: landscape) {
                .main-card { min-height: 95vh; }
                .hero-text h1 { font-size: 42px; }
                .content-area { padding: 32px; }
                .qr-img { width: 240px; height: 240px; }
            }
        </style>
    </head>
    <body>
        <div class="main-card">
            <div class="content-area">
                <div class="top-meta">
                    <div class="brand-logo">
                        <div class="logo-icon">
                            <svg viewBox="0 0 24 24" width="26" height="26" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                <path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/>
                                <rect width="12" height="8" x="6" y="14" rx="1"/>
                            </svg>
                        </div>
                        <span class="brand-name">LePrint</span>
                    </div>

                    <div class="hero-text">
                        <h1>Ready to print?</h1>
                        <div class="id-container">
                            <span class="id-label">Current Kiosk ID</span>
                            <div class="id-value">${KIOSK_ID}</div>
                        </div>
                    </div>

                    <div class="instructions-container">
                        <div class="step-card">
                            <div class="step-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                </svg>
                            </div>
                            <div class="step-title">Option 1: Quick Scan</div>
                            <div class="step-desc">Open your camera or <span class="step-highlight">Google Lens</span> and point it at the QR code on the right.</div>
                        </div>
                        <div class="step-card">
                            <div class="step-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="2" y1="12" x2="22" y2="12"></line>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                </svg>
                            </div>
                            <div class="step-title">Option 2: Direct URL</div>
                            <div class="step-desc">Go to <span class="step-highlight">leprint.in</span> in your browser and enter this Kiosk ID when prompted.</div>
                        </div>
                    </div>
                </div>

                <div class="footer-meta">
                    <div class="location-meta">
                        <span>📍 ${LOCATION}</span>
                        <span>•</span>
                        <span>Floor ${FLOOR}</span>
                    </div>
                    <div style="font-size: 11px; opacity: 0.1; letter-spacing: 0.5px;">SYSTEM v${QR_SERVER_VERSION} — 0.0.0.0:${PORT}</div>
                </div>
            </div>

            <div class="qr-section">
                <div class="qr-outer-glow"></div>
                <div class="qr-display-case" onclick="window.open('${qrUrl}', '_blank')">
                    <img src="${qrDataUrl}" alt="Scan to Print" class="qr-img">
                </div>
                <div class="scan-badge">Scan to Start</div>
            </div>
        </div>

        <script>
            // Refresh logic to keep kiosk state current
            setTimeout(() => location.reload(), 300000);
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
