# 🤖 LePrint Pi-Agent

The Pi-Agent is the hardware-facing component of the LePrint system. It runs on a Raspberry Pi (or any Linux-based controller) connected to a printer/scanner via USB or Network. 

It handles the bridge between cloud jobs and physical hardware using CUPS (printing) and eSCL (scanning).

---

## 📋 Table of Contents
- [Data Flow](#-data-flow)
- [Resilience Features](#-resilience-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Usage & Commands](#-usage--commands)
- [Troubleshooting](#-troubleshooting)

---

## 🔄 Data Flow

1. **Job Polling**: The agent performs long-polling on the backend using `FOR UPDATE SKIP LOCKED`. This ensures that even with multiple kiosks, a job is only "claimed" by one agent.
2. **File Processing**: Once claimed, the agent downloads the file, detects its type, and uses **LibreOffice** (for DOCX/TXT) or **ImageMagick** (for Images) to convert it into a CUPS-compatible PDF.
3. **Hardware Interaction**:
   - **Printing**: Dispatched to the local CUPS server.
   - **Scanning**: Dispatched via eSCL (network scanning) to the printer's IP.
4. **Real-time Feedback**: Every state transition (`QUEUED` → `PRINTING` → `COMPLETED`) is emitted via Socket.io to the backend, which forwards it to the user's phone.

---

## 🛡️ Resilience Features

- **Heartbeat Resilience**: The agent sends high-frequency heartbeats during active jobs (every 2s) to keep the backend informed.
- **`safeEmit` Queuing**: If the Wi-Fi drops, the agent queues all job status updates in memory and automatically replays them in order once the connection is restored.
- **Offline Recovery**: If the agent is restarted mid-job, it checks the database for any `SENT_TO_PI` jobs that it previously claimed but didn't finish.
- **Resource Management**: Automatically cleans up its `temp/` folder every 30 minutes and enforces a 500MB storage ceiling.

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js (v18+) |
| **Print Engine** | CUPS (Common Unix Printing System) |
| **Conversion** | LibreOffice, ImageMagick, pdf-lib |
| **Communication** | Socket.io-client, Axios (Polling) |
| **Scanning** | eSCL / AirScan (XML over HTTP) |

---

## 📁 Project Structure

```bash
pi-agent/
├── modules/
│   ├── logger.js        # High-visibility colored logging
│   ├── printer.js       # CUPS wrapper and status tracking
│   ├── scanner.js       # eSCL implementation
│   ├── socket-client.js # WebSocket resilience & safeEmit
│   └── job-handler.js   # Main state machine for jobs
├── scripts/
│   ├── setup.sh         # Modular installer
│   └── lib/             # Installer sub-scripts (cups, libreoffice)
├── index.js             # Entry point
└── .env.example         # Configuration template
```

---

## 🚀 Installation

### 1. Unified Installer (Recommended)
Our modular `setup.sh` handles all dependencies, CUPS configuration, and systemd service creation.

```bash
cd pi-agent
chmod +x setup.sh
./setup.sh
```

### 2. Manual Dependencies
If you prefer manual setup:
```bash
sudo apt update
sudo apt install -y cups libreoffice-writer imagemagick nodejs npm
# Ensure your user is in the 'lpadmin' group
sudo usermod -aG lpadmin $USER
```

### 3. Configuration
Copy the environment template and fill in your kiosk details:
```bash
cp .env.example .env
nano .env
```
Key Variables:
- `CLOUD_URL`: The backend API URL.
- `KIOSK_ID`: Unique ID for this physical hardware.
- `PRINTER_NAME`: Name of the printer as seen in `lpstat -p`.

---

## 📖 Usage & Commands

### Running the Agent
```bash
# Development (with logs)
node index.js

# Production (as a service)
sudo systemctl start leprint-agent
sudo systemctl status leprint-agent
```

### Useful Commands
- **Check Printer List**: `lpstat -p -d`
- **View Agent Logs**: `journalctl -u leprint-agent -f`
- **Test Scanner**: `curl http://YOUR_PRINTER_IP/eSCL/ScannerCapabilities`

### Simulation Mode
To test without hardware, set `SIMULATE_PRINTER=true` and `SIMULATE_SCANNER=true` in `.env`. The agent will mock all physical actions with realistic delays.
