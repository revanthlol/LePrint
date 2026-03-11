# LePrint Pi Agent 🖨️

The print agent that runs on your Raspberry Pi (or any laptop) to handle actual printing via CUPS.

## Prerequisites

### Hardware

- Raspberry Pi (any model) OR any laptop/desktop
- USB printer connected
- Network connection to reach cloud backend

### Software

- **Node.js 16+** (check: `node --version`)
- **CUPS** (Common Unix Printing System)

## Installation

### 1. Install CUPS

**Ubuntu/Debian/Raspberry Pi OS:**

```bash
sudo apt update
sudo apt install cups
sudo systemctl start cups
sudo systemctl enable cups
```

**macOS:**

Already installed! Just make sure it's running:

```bash
sudo cupsctl WebInterface=yes
```

**Verify CUPS is working:**

```bash
lpstat -p # Should list your connected printers
```

### 2. Add your user to printer group

```bash
sudo usermod -aG lpadmin "$USER"
# Log out and back in for changes to take effect
```

### 3. Install Agent Dependencies

```bash
cd pi-agent
npm install
```

### 4. Run Setup Wizard

```bash
npm run setup
```

The wizard will:

- Detect connected printers
- Let you choose auto-detect or manual selection
- Generate a `.env` file

## Configuration

### Manual .env Setup

If you skip the wizard, create `.env` manually:

```env

CLOUD_URL=http://your-cloud-server.com:3001

PRINTER_NAME=auto

```

**PRINTER_NAME Options:**

-`auto` - Automatically detects default printer (recommended)

-`HP_LaserJet_1020` - Specific printer name from `lpstat -p`

-`Brother_HL_L2350DW` - Another example

### Finding Your Printer Name

```bash

lpstat-p

# Output example:

# printer HP_LaserJet is idle.  enabled since Fri 14 Feb 2025

# printer Brother_Printer is idle.  enabled since Fri 14 Feb 2025

```

## Running the Agent

### Development (with auto-restart)

```bash
npm run dev
```

### Production

```bash
npm start
```

### Run on Boot (systemd service)

Create `/etc/systemd/system/LePrint-agent.service`:

```ini
[Unit]
Description=LePrint Agent
After=network.target cups.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/LePrint-agent
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable LePrint-agent
sudo systemctl start LePrint-agent
sudo systemctl status LePrint-agent
```

## Logs & Monitoring

View logs in real-time:

```bash
# If running with systemd
sudo journalctl -u LePrint-agent -f

# If running manually, logs appear in console
```

Healthy agent output:

```

🖨️  LePrint Agent Starting...

📡 Connecting to Cloud: http://your-server.com:3001

✅ Connected to Cloud Hub!

🎯 Auto-detected printer: HP_LaserJet

🚀 Agent ready and listening for jobs!

💚 Agent alive | Uptime: 45s

```

## Troubleshooting

### Printer Not Detected

```bash

# Check if printer is connected

lpstat-p


# Check CUPS status

sudosystemctlstatuscups


# Test print manually

echo"Test"|lp

```

### Permission Denied

```bash

# Add user to lpadmin group

sudousermod-aGlpadmin $USER

newgrplpadmin# Or log out/in

```

### Agent Can't Connect to Cloud

- Check `CLOUD_URL` in `.env`
- Verify cloud backend is running
- Check firewall rules: `sudo ufw allow 3001`

### Print Jobs Fail

- Ensure printer is set as default: `lpoptions -d YourPrinterName`
- Check printer queue: `lpq`
- Clear stuck jobs: `cancel -a`

## How It Works

1. Agent connects to cloud backend via Socket.io
2. Registers itself as available printer
3. Cloud backend forwards print jobs from users
4. Agent receives PDF buffer
5. Saves to temp file
6. Counts pages using pdf-lib
7. Sends to CUPS via `lp` command
8. Reports status back to cloud
9. Cleans up temp files

## File Structure

```
pi-agent/
├── index.js           # Main agent logic
├── setup.sh           # Install/update vs uninstall menu
├── package.json       # Dependencies
├── .env              # Configuration (created by setup)
└── print-queue/      # Temp directory (auto-created)
```

## Security Notes

- Agent should run on trusted local network
- Don't expose CUPS web interface to internet
- Use HTTPS for production cloud backend
- Consider VPN for remote printer access

## Performance

-**Memory Usage**: ~50MB idle

-**Startup Time**: 2-3 seconds

-**Print Latency**: ~1-2 seconds from cloud to CUPS

-**Tested With**: PDF files up to 50 pages

## Next Steps

After getting the agent running:

1. Generate printer QR code (see main README)
2. Test with frontend at `https://leprint.in`
3. Monitor logs for any issues
4. Set up auto-start on boot for production

## Support

Having issues? Check:

1. Agent logs (console or journalctl)
2. CUPS logs: `/var/log/cups/error_log`
3. Backend logs on cloud server

---

**Built for LePrint** | Works on Pi, Mac, Linux
