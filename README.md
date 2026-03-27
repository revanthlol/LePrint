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

## ✨ Features

### Print
- 📄 **Multi-format support** — PDF, DOCX, TXT, PNG, JPG (auto-converted to PDF)
- 💳 **Pay per page** — PayU integration with configurable pricing
- 🔄 **Real-time status** — Live job tracking via WebSocket
- 🔒 **Row locking** — `FOR UPDATE SKIP LOCKED` prevents duplicate dispatch
- 🔁 **Auto-retry** — Failed jobs retry up to 3 times
- 📥 **File streaming** — Download URLs instead of base64 encoding
- 🗑️ **Auto-cleanup** — Print queue files cleaned up after 30 minutes
- 💾 **Disk protection** — 500MB limit on print queue directory
- 📑 **Multi-job** — Tab bar appears from the first job onwards (max 5 per session)
- 📊 **Job summary screen** — On completion showing per-job outcomes and timings

### Scan & Xerox
- 🔍 **eSCL scanning** — Works with any AirScan/eSCL-compatible printer
- 📤 **Cloud upload** — Scanned PDFs uploaded to backend automatically
- 📋 **Scan → Print pipeline** — Photocopy mode with up to 20 copies
- 🔄 **Real-time progress** — Status updates via WebSocket for all phases

### Smart Kiosk Logic
- 🖨️ **Capability Awareness** — Automatic brand detection (Epson) and capability profiling
- 🔋 **Heartbeat Resilience** — `safeEmit` queuing for offline recovery and fast heartbeats during jobs
- 📊 **Step indicators** — Visual progress tracking (Paid → Sent → Queued → Printing → Done)
- 💡 **Fun facts ticker** — Educational content displayed during processing

### Guest Mode & Security
- 👤 **Continue as Guest** — UUID-based identity with 3 jobs/day device limit
- 🛡️ **Firebase Auth** — Secure Google OAuth login for registered users
- 👥 **Role-based access** — Multi-tier access control (User, Admin, Superadmin)

### Admin & Monitoring
- 📊 **Dashboard** — System-wide revenue, jobs, and success metrics
- 🖨️ **Health Grid** — Card-based real-time monitor with **Epson branding** and driver detection
- 📋 **Job Audit** — Full history with user/guest isolation and filtering

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

### Data Flow
- **Print:** Upload → Pay → Agent Claims (Row Locked) → Conversion → CUPS Print → Status via WebSocket
- **Scan/Xerox:** Request → eSCL Scan → Cloud Upload (Scan) or CUPS Loop (Xerox) → Download/Completion

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, TailwindCSS, shadcn/ui, Framer Motion, Firebase Auth |
| **Backend** | Node.js, Express, PostgreSQL, Socket.IO, Firebase Admin SDK, PayU |
| **Pi Agent** | Node.js, CUPS, LibreOffice, pdf-lib, eSCL/AirScan (xml2js, axios) |
| **Database** | PostgreSQL with views, triggers, and JSONB capability storage |

---

## 📁 Project Structure

```
LePrint/
├── backend/            # Express Hub + Socket Manager
├── frontend/           # React Dashboard + Public Pages
├── pi-agent/           # Hardware Agent (Modules + Modular Installers)
│   └── scripts/lib/    # Modular bash setup libraries
└── docs/               # Integration plans and testing guides
```

---

## 🚀 Installation

### 1. Backend
```bash
cd backend && npm install
sudo -u postgres psql -f setup-db.sql
psql -U printuser -d printkiosk -f schema.sql
cp .env.example .env && npm run dev
```

### 2. Frontend
```bash
cd frontend && npm install
# Configure Firebase + VITE_API_URL in .env
npm run dev
```

### 3. Pi Agent
```bash
# Modular setup (recommended)
cd pi-agent
./setup.sh

# Manual dependencies
sudo apt install cups libreoffice-writer imagemagick
node index.js
```

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
