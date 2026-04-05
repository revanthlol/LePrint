# 🖨️ LePrint

A cloud-based print, scan, and xerox kiosk system. Users scan a QR code, upload documents, pay, and print — all from their phone.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Database Schema](#-database-schema)

---

## 🎯 Overview

LePrint is a three-component kiosk system for libraries, universities, coworking spaces, and print shops:

1. **Scan a QR code** at a physical kiosk
2. **Upload documents** via a web interface on your phone
3. **Pay per page** and print instantly
4. **Scan documents** using the kiosk's eSCL-compatible scanner

### Live URLs
- **Frontend:** https://qr-wifi-printer.vercel.app
- **Backend API:** https://justpri.duckdns.org

---

## 🏗️ Architecture

```
┌─────────────────┐
│   User Device   │
│  (Web Browser)  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐      WebSocket      ┌──────────────────┐
│    Frontend     │◄═══════════════════►│     Backend      │
│  (React/Vite)   │      REST API       │ (Node.js/Express)│
└─────────────────┘                     └────────┬─────────┘
                                                 │
                                        ┌────────┴────────┐
                                        │   PostgreSQL    │
                                        │    Database     │
                                        └────────┬────────┘
                                                 │ Poll + WebSocket
                                                 ▼
                                        ┌─────────────────┐
                                        │    Pi Agent     │
                                        │ (Node.js/CUPS)  │
                                        └────────┬────────┘
                                                 │ CUPS / eSCL
                                                 ▼
                                        ┌─────────────────┐
                                        │  Printer/Scanner│
                                        └─────────────────┘
```

### 🔄 Data Flow
1. **Print Flow**: 
   - User uploads file via Frontend.
   - Backend stores metadata and provides a signed URL/stream.
   - User pays via **Razorpay**.
   - Backend marks job as `PAID`.
   - Pi Agent polls `GET /api/jobs/poll` (using `FOR UPDATE SKIP LOCKED`).
   - Agent downloads, converts (via LibreOffice/ImageMagick), and prints via CUPS.
   - Real-time status updates are sent via Socket.io to the Frontend.

2. **Scan/Xerox Flow**:
   - Frontend requests a scan.
   - Backend emits `SCAN_REQUEST` via WebSocket to the Agent.
   - Agent triggers eSCL scan via network XML/HTTP.
   - Agent uploads scanned PDF to Backend.
   - (Xerox) Agent immediately queues the scanned PDF for printing.

---

## 🛡️ Resilience Features

- **Row Locking**: Backend uses PostgreSQL `SKIP LOCKED` to ensure multiple agents never claim the same job.
- **Heartbeat System**: Agents send heartbeats every 30s (idle) or 2s (during jobs). Backend detects "Offline" kiosks instantly.
- **SafeEmit Queue**: If the agent loses internet during a job, it queues status updates locally and replays them once reconnected.
- **Auto-Retry**: Jobs that fail during the "Printing" phase are automatically retried up to 3 times.
- **Disk Protection**: `pi-agent` monitors its `temp/` directory and enforces a 500MB limit to prevent storage exhaustion.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, TailwindCSS, shadcn/ui, Framer Motion, Firebase Auth |
| **Backend** | Node.js, Express, PostgreSQL, Socket.IO, Firebase Admin SDK, **Razorpay** |
| **Pi Agent** | Node.js, CUPS, LibreOffice, pdf-lib, eSCL/AirScan (xml2js, axios) |
| **Database** | PostgreSQL with views, triggers, and JSONB capability storage |

---

## 📁 Project Structure

```bash
LePrint/
├── backend/            # Express Hub + Socket Manager
│   ├── modules/        # Business logic (Jobs, Kiosks, Payments)
│   └── schema.sql      # Database definitions
├── frontend/           # React Dashboard + Public Pages
│   ├── src/components/ # Reusable UI components
│   └── src/hooks/      # Shared logic (usePrint, useAuth)
├── pi-agent/           # Hardware Agent
│   ├── modules/        # Printing, Scanning, and Socket logic
│   └── scripts/        # Installer and service scripts
└── docs/               # Architecture and Integration guides
```

---

## 🚀 Installation

### 1. Prerequisites
- **Node.js** v18+
- **PostgreSQL** 14+
- **Firebase Project** (Auth + Admin SDK)
- **Razorpay Account** (API Keys)

### 2. Quick Start
```bash
# Clone and install dependencies
git clone https://github.com/revanthlol/LePrint.git
cd LePrint
npm install # Install root workspace dependencies

# Setup Backend
cd backend && cp .env.example .env
npm install
sudo -u postgres psql -f setup-db.sql
psql -U printuser -d printkiosk -f schema.sql

# Setup Frontend
cd ../frontend && cp .env.example .env
npm install

# Setup Pi Agent (on target device)
cd ../pi-agent && ./setup.sh
```

---

## 📖 Usage

### Running Locally
1. **Backend**: `cd backend && npm run dev`
2. **Frontend**: `cd frontend && npm run dev`
3. **Agent**: `cd pi-agent && node index.js`

### Simulation Mode
To test without a physical printer, set `SIMULATE_PRINTER=true` in `pi-agent/.env`.
To test the full UI flow instantly, use `KIOSK_ID=kiosk_test` in the URL.

---

## ⚙️ Configuration

### Important Env Vars
- **Backend:** `FIREBASE_SERVICE_ACCOUNT_PATH`, `ALLOWED_ORIGINS`, `TEST_KIOSK_ID`
- **Pi Agent:** `CLOUD_URL`, `KIOSK_ID`, `SIMULATE_PRINTER`, `PRINTER_NAME`

---

## 🔌 API Reference

### User Endpoints
- `POST /api/jobs/create` — Upload file
- `POST /api/jobs/:id/verify-payment` — Pay and queue
- `GET /api/jobs/:id/status` — Live status polling

### Admin & Agent Endpoints
- `GET /api/admin/metrics` — Global stats
- `GET /api/admin/kiosks` — Health grid with brand detection
- `GET /api/jobs/poll` — Agent-only claim endpoint (row-locked)

---

## 🧪 Testing

- **Mock Kiosk:** Use `kiosk_test` to simulate the full flow without hardware.
- **Simulation:** Set `SIMULATE_PRINTER=true` in `pi-agent/.env`.
- See [TESTING.md](TESTING.md) for full endpoint and hardware tests.

---

## 📊 Database Schema

**Tables:** `users`, `kiosks`, `jobs`, `admin_actions`

**Job Statuses:**
- Print: `PENDING` → `PAID` → `SENT_TO_PI` → `QUEUED` → `PRINTING` → `COMPLETED`
- Scan/Xerox: `PAID` → `DISCOVERING_SCANNER` → `SCANNING` → `COMPLETED`

**Migrations:**
- `001_add_printer_brand.sql` — Injects `printer_brand` and `printer_driver` support.

---

## 🐛 Troubleshooting

- **CORS Errors:** Update `ALLOWED_ORIGINS` in backend `.env`.
- **Printer Missing:** Run `lpstat -p -d`.
- **Scanner Issues:** Test eSCL: `curl http://PRINTER_IP/eSCL/ScannerCapabilities`.
- **Agent Logs:** `journalctl -u leprint-agent -f` (if running as service).
