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
- 📑 **Multi-job** — Submit up to 5 jobs per session, track all via switchable tabs. Guests limited to 1 job
- 📊 **Job summary screen** — On completion showing per-job outcomes, timings, and scan downloads

### Scan
- 🔍 **eSCL scanning** — Works with any AirScan/eSCL-compatible printer
- 📤 **Cloud upload** — Scanned PDFs uploaded to backend automatically
- ⬇️ **Download link** — Users get a download URL for their scanned document

### Xerox (Photocopy)
- 📋 **Scan → Print pipeline** — Scan a document and print up to 20 copies
- 💰 **₹5 per copy** — Automatic pricing based on copy count
- 🔄 **Real-time progress** — Scanning and printing status updates via WebSocket

### Job Status UI
- 📊 **Step indicators** — Horizontal progress bar showing exact job phase (e.g. Paid → Sent → Queued → Printing → Done)
- 💡 **Fun facts ticker** — Auto-cycling print/tech trivia displayed during job processing (hover to pause)
- ❌ **Error states** — Clear error UI with "Request Refund" button linking to Contact page

### Guest Mode
- 👤 **Continue as Guest** — No account required, UUID-based identity via `localStorage`
- 🎯 **3 jobs/day limit** — Per-device daily cap with counter reset at midnight
- 🪪 **Sidebar card** — Compact guest session info in sidebar (jobs remaining, sign-in CTA)
- 🔄 **Auto-cleanup** — Guest session automatically cleared when user signs in via Google OAuth
- 🛡️ **Backend support** — `X-Guest-ID` header for guest job creation, metadata-based access control

### Notifications
- 🔔 **In-app toasts** — Sonner-powered dark-themed toasts on job status transitions (queued, printing, done, failed)
- 📱 **Browser push** — Native `Notification` API alerts when tab is backgrounded
- 🚫 **Deduplication** — Same status never notified twice in a row
- 🔕 **Soft permission** — Permission stored in `localStorage`, nudge shown only once

### Authentication
- 🔐 **Firebase Auth** — Google OAuth login
- 🔑 **JWT verification** — All API endpoints authenticated
- 🔁 **Smart redirect** — Logged-in users redirected from `/login`; `?redirect=` param preserved by `ProtectedRoute`
- 👥 **Role-based access** — user, admin, superadmin roles
- 🛡️ **User isolation** — Users only see their own jobs

### Landing Page & Public Pages
- 🌐 **Landing page** — Modular, animated sections (Hero, How it Works, Services, Trust, Testimonials, Locations, CTA)
- 📄 **Compliance pages** — Privacy Policy, Terms & Conditions, Refund Policy, Contact Us, FAQ
- 🧭 **PublicNavbar** — Shared navigation with auth-aware CTA and scroll-hide behavior
- 🦶 **Responsive Footer** — Accordion-based mobile layout with all links

### Admin
- 📊 **Dashboard** — System metrics, revenue, job counts
- 🖨️ **Kiosk health** — Real-time printer status, paper counts, editable location names
- 📋 **Job management** — View and filter all jobs; guest jobs shown with amber badge
- 📝 **Audit logging** — Admin action tracking

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

**Print:** User uploads file → Backend creates job → User pays → Pi Agent polls & claims job (row-locked) → Downloads file → Converts to PDF → Prints via CUPS → Polls `lpstat` for real completion → Status updates via WebSocket

**Scan:** User selects Scan → Chooses options (DPI, color) → Backend creates scan job → Pi Agent polls & scans via eSCL → Uploads PDF to backend → User gets download link

**Xerox:** User selects Xerox → Sets copies & options → Backend creates xerox job → Pi Agent polls, scans via eSCL, prints N copies via CUPS → Status updates via WebSocket

> **Note:** Multi-job state is managed entirely frontend-side — backend and pi-agent are unchanged. Each job entry in the `jobs[]` array has its own status polling loop and notification scope.

### Resilience Features

- **safeEmit:** If the socket disconnects mid-job, events are queued in memory and replayed in order on reconnect (prevents dropped status updates during long xerox scans)
- **Fast heartbeat:** During active jobs, the agent sends a lightweight keepalive every 8s to prevent the backend from timing out the connection
- **CUPS polling:** `printDocument()` parses the CUPS job ID and polls `lpstat` every 2s (logs every 10s) until the print physically completes or times out at 120s
- **Ordered state transitions:** Backend rejects backward state changes (e.g. `PRINTING` → `SCANNING`) using a `STATE_ORDER` map — only forward transitions and `FAILED` are allowed
- **Idempotent completion:** Duplicate `print_complete` / `scan_complete` events (from reconnect replay) are detected and safely ignored

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, TailwindCSS, shadcn/ui, Framer Motion, Firebase Auth, Socket.IO Client |
| **Backend** | Node.js, Express, PostgreSQL, Socket.IO, Firebase Admin SDK, Multer, PayU |
| **Pi Agent** | Node.js, Socket.IO Client, CUPS, LibreOffice, pdf-lib, eSCL/AirScan (xml2js, axios) |
| **Database** | PostgreSQL with views, triggers, constraints, JSONB fields |

---

## 📁 Project Structure

```
LePrint/
├── backend/
│   ├── index.js               # Express server + Socket.IO setup
│   ├── db.js                  # PostgreSQL abstraction layer
│   ├── auth-middleware.js     # Firebase JWT verification
│   ├── schema.sql             # Complete database schema
│   ├── setup-db.sql           # Initial DB/user creation
│   └── modules/
│       ├── job-routes.js      # Print, scan, download endpoints
│       ├── admin-routes.js    # Admin dashboard API
│       ├── kiosk-routes.js    # Public kiosk status endpoint
│       ├── socket-manager.js  # WebSocket event handling
│       ├── logger.js          # Timestamped logging helper
│       ├── tasks.js           # Scheduled cleanup tasks
│       └── utils.js           # File upload, PDF utils
│
├── frontend/
│   └── src/
│       ├── App.jsx            # Router setup + Toaster + providers
│       ├── firebase.js        # Firebase config
│       └── components/
│           ├── landing/       # Modular landing page sections
│           │   ├── Hero.jsx, HowItWorks.jsx, ServicesPricing.jsx
│           │   ├── TrustSecurity.jsx, UseCases.jsx, Testimonials.jsx
│           │   ├── Locations.jsx, WhyLePrint.jsx, CtaBanner.jsx
│           │   └── FadeInSection.jsx
│           ├── Print/         # Upload, print, scan, job progress UI
│           ├── Admin/         # Admin dashboard components
│           ├── Dashboard/     # User dashboard + sidebar guest card
│           ├── Landing.jsx    # Landing page orchestrator
│           ├── Login.jsx      # Google OAuth login + smart redirect
│           ├── AuthProvider.jsx    # Firebase auth context + guest header support
│           ├── GuestContext.jsx    # Guest session (UUID, job limits, auto-cleanup)
│           ├── ProtectedRoute.jsx  # Auth guard + ?redirect= + guest passthrough
│           ├── NotificationProvider.jsx  # Sonner toasts + browser push
│           ├── FeatureCards.jsx    # Shared trust indicator cards
│           ├── PublicNavbar.jsx    # Shared public navigation
│           ├── Footer.jsx         # Shared responsive footer
│           ├── Contact.jsx, FAQPage.jsx  # Public pages
│           ├── PrivacyPolicy.jsx, Terms.jsx, RefundPolicy.jsx
│           └── ui/            # Shared UI primitives
│
├── pi-agent/
│   ├── index.js               # Main entry, config, init
│   └── modules/
│       ├── socket-client.js   # WebSocket connection + safeEmit + scan handler
│       ├── job-handler.js     # Job polling, processing, printing
│       ├── scanner.js         # eSCL scanner module
│       ├── printer.js         # CUPS printing + lpstat polling + status checks
│       ├── utils.js           # File conversion (DOCX→PDF, IMG→PDF)
│       ├── logger.js          # Timestamped logging with 7 levels
│       └── errors.js          # Custom error types
│
├── docs/
│   └── payu-integration.md    # PayU payment integration plan
├── TESTING.md                 # Full testing guide
└── README.md                  # This file
```

---

## 📦 Prerequisites

### Backend
- Node.js ≥ 16
- PostgreSQL ≥ 12
- Firebase project (for auth)

### Frontend
- Node.js ≥ 16
- Vercel account (for deployment)

### Pi Agent
- Raspberry Pi (any model with WiFi) or any Linux machine
- USB/network printer with CUPS support
- *(Optional)* eSCL/AirScan-compatible printer for scanning
- CUPS, LibreOffice, ImageMagick installed

---

## 🚀 Installation

### 1. Backend

```bash
cd backend
npm install

# Setup PostgreSQL
sudo -u postgres psql -f setup-db.sql

# Run schema
psql -U printuser -d printkiosk -f schema.sql

# Configure
cp .env.example .env
# Edit .env with your settings (see Configuration section)

# Start
npm run dev           # Development (with nodemon)
pm2 start index.js    # Production
```

### 2. Frontend

```bash
cd frontend
npm install

# Configure environment variables (see Configuration section)
# Set VITE_API_URL and Firebase config in .env or Vercel dashboard

npm run dev           # Development
vercel                # Deploy to Vercel
```

### 3. Pi Agent

```bash
cd pi-agent
npm install

# Install system dependencies
sudo apt install cups libreoffice-writer imagemagick

# Configure
cp .env.example .env
# Edit .env with your settings (set DEBUG=true for verbose logs)

# Start
node index.js

# Or install as systemd service for auto-start
# View live logs: journalctl -u leprint-agent -f
# Last 50 lines: journalctl -u leprint-agent -n 50
```

All pi-agent logs include `[HH:MM:SS]` timestamps with color-coded levels (info, success, warn, error, debug, job, socket).

---

## ⚙️ Configuration

### Backend `.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `printkiosk` |
| `DB_USER` | Database user | `printuser` |
| `DB_PASSWORD` | Database password | *(required)* |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | Vercel + localhost |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON | `./config/firebase-service-account.json` |
| `BACKEND_URL` | Public URL of backend (for scan download links) | — |

### Frontend (Vercel / `.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

### Pi Agent `.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `CLOUD_URL` | Backend URL | `https://justpri.duckdns.org` |
| `FRONTEND_URL` | Frontend URL (for QR code) | `https://qr-wifi-printer.vercel.app` |
| `KIOSK_ID` | Unique kiosk identifier | `kiosk_{hostname}` |
| `PRINTER_NAME` | CUPS printer name | `auto` (auto-detect) |
| `POLL_INTERVAL` | Job polling interval in ms | `5000` |
| `DEBUG` | Enable verbose debug logging | `false` |
| `SIMULATE_PRINTER` | Simulate printing without hardware | `false` |

---

## 📖 Usage

### For Users

1. **Scan** the QR code displayed at the kiosk
2. **Login** with your Google account — or **Continue as Guest** (3 jobs/day limit)
3. **Choose** a service: Print, Scan, or Xerox
4. **Print:** Upload a document → Review pricing → Pay → Track progress via step indicators → Collect printout
5. **Scan:** Choose DPI & color → Start scan → Download scanned PDF
6. **Xerox:** Set copies & color → Pay → Collect photocopies
7. **Notifications:** In-app toasts appear on status changes; browser push alerts when the tab is backgrounded

### For Admins

1. Login with an admin account (set via `UPDATE users SET role = 'admin' WHERE email = '...'`)
2. Navigate to `/admin` in the frontend
3. Monitor kiosk health, job history, and system metrics
4. Manage paper counts and **location names** per kiosk
5. Guest jobs appear with an amber "Guest" badge and truncated guest ID

---

## 🔌 API Reference

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/kiosk/status?kiosk_id=xxx` | Check kiosk/printer status |
| `POST` | `/api/connect` | Legacy kiosk connection check |

### Authenticated Endpoints (Firebase JWT required)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/jobs/create` | Upload file and create print job |
| `POST` | `/api/jobs/:id/verify-payment` | Mark job as paid |
| `POST` | `/api/jobs/scan` | Create a scan job |
| `POST` | `/api/jobs/xerox` | Create a xerox (photocopy) job |
| `GET` | `/api/jobs/:id/download` | Download job file |
| `GET` | `/api/jobs/:id/status` | Poll job status |
| `GET` | `/api/jobs/my-jobs` | User's job history |
| `GET` | `/api/users/stats` | User stats (pages, spend) |
| `GET` | `/api/user/profile` | User profile + role |

### Pi Agent Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/jobs/poll?kiosk_id=xxx` | Poll for paid jobs (row-locked) |
| `GET` | `/api/jobs/:id/download` | Download file for printing |
| `POST` | `/api/jobs/:id/scan-upload` | Upload scanned file |

### Admin Endpoints (admin role required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/metrics` | System-wide statistics |
| `GET` | `/api/admin/kiosks` | All kiosks with status + location names |
| `GET` | `/api/admin/jobs` | Filterable job list |
| `GET` | `/api/admin/recent-jobs` | Recent jobs with user/guest info |
| `POST` | `/api/admin/kiosks/:id/set-paper` | Update paper count |
| `PATCH` | `/api/admin/kiosks/:id` | Update kiosk settings (location name) |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `register` | Pi → Backend | Kiosk registration |
| `heartbeat` | Pi → Backend | Periodic health update |
| `job_state_change` | Pi → Backend | Job status update |
| `print_complete` | Pi → Backend | Print finished (success/fail + retry) |
| `scan_complete` | Pi → Backend | Scan finished (success/fail) |
| `scan_job` | Backend → Pi | Trigger scan on kiosk |
| `update_config` | Backend → Pi | Remote config update |

---

## 🧪 Testing

See [TESTING.md](TESTING.md) for the complete testing guide covering:
- Database verification
- Backend API tests (all endpoints)
- Pi Agent tests (printing, scanning, retry logic)
- Frontend tests (user flow, admin dashboard)
- WebSocket tests
- End-to-end smoke test checklist

---

## 💳 Payments

Currently using mock payments. PayU integration is planned — see [docs/payu-integration.md](docs/payu-integration.md) for the complete technical plan covering:
- Step-by-step payment flow design
- Frontend and backend responsibilities
- Hash generation and verification
- Security considerations
- Implementation roadmap

---

## 📌 Current Status

### ✅ Completed
- Full print/scan/xerox pipeline (frontend → backend → pi-agent → printer)
- Landing page with 10 modular sections
- Compliance pages (Privacy, Terms, Refund, Contact, FAQ)
- Admin dashboard with metrics, kiosk management, and location names
- Firebase Google OAuth authentication with smart redirect
- Guest mode (3 jobs/day, localStorage-based, auto-cleanup on login)
- Job status UI with step indicators and fun facts ticker
- In-app toast notifications (sonner) + browser push notifications
- Guest job visibility in admin dashboard
- Responsive UI with dark theme
- Socket resilience (safeEmit event queuing + replay, fast heartbeat during jobs)
- CUPS job polling for real print completion tracking
- Ordered state transitions (backward transition rejection)
- Idempotent completion handlers (duplicate event protection)
- Timestamped structured logging across pi-agent and backend

---

## 📝 Logging

### Backend
All route files use `backend/modules/logger.js` for timestamped, structured logging.

| Prefix | Format | Example |
|--------|--------|---------|
| `[JOB]` | `[HH:MM:SS] [JOB] job_id \| TYPE \| STATUS \| context` | `[14:32:01] [JOB] abc123 \| PRINT \| PENDING \| user:uid` |
| `[ADMIN]` | `[HH:MM:SS] [ADMIN] uid \| ACTION \| target: X` | `[14:32:05] [ADMIN] uid \| SET_PAPER_COUNT \| target: kiosk_001` |

### Pi-Agent
7-level colored logger with `[HH:MM:SS]` timestamps, levels: info, success, warn, error, debug, job, socket.

| Level | Format | Example |
|-------|--------|---------|
| job | `[HH:MM:SS] ✓/⚠/✗ [XEROX/SCAN/PRINT] message (elapsed)` | `[14:32:10] ✓ [PRINT] Completed in 12s` |
| socket | `[HH:MM:SS] [SOCKET] message` | `[14:32:00] [SOCKET] Connected to backend` |

### 🔜 Pending
- PayU payment gateway integration (plan ready, implementation pending)
- Production deployment
- Multi-kiosk management at scale

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
psql -U printuser -d printkiosk -h localhost
```

### Pi Agent can't connect
```bash
# Test backend connectivity
curl https://your-backend.com/api/kiosk/status?kiosk_id=test

# Check pi-agent logs for WebSocket errors
journalctl -u leprint-agent -n 50 | grep SOCKET
```

### Printer not found
```bash
# List CUPS printers
lpstat -p -d

# Set default printer
lpoptions -d printer_name
```

### Scanner not working
```bash
# Test eSCL availability
curl http://PRINTER_IP/eSCL/ScannerCapabilities

# Try HTTPS if HTTP fails
curl -k https://PRINTER_IP/eSCL/ScannerCapabilities

# Verify printer and Pi are on the same network
```

### Xerox scans but doesn't print
```bash
# Check pi-agent logs for safeEmit queue events during scan phase
journalctl -u leprint-agent -n 100 | grep "Event queued"

# Verify backend pingTimeout is set to 60000 in backend/index.js
grep pingTimeout backend/index.js

# Check CUPS job ID parsing
journalctl -u leprint-agent -n 100 | grep "CUPS WARNING"
```

### Print marked complete but nothing printed
```bash
# Check for CUPS timeout (printer accepted job but never completed in 120s)
journalctl -u leprint-agent -n 100 | grep "CUPS.*timed out"

# View stuck CUPS jobs
lpstat -o

# Clear CUPS queue and retry
cancel -a
```

### Events arriving out of order in logs
This is handled automatically — the `STATE_ORDER` guard rejects backward transitions.
If still seeing out-of-order events, check for duplicate pi-agent instances:
```bash
ps aux | grep "node index.js"
```

### Image conversion fails
```bash
# Fix ImageMagick policy for PDF
sudo sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-*/policy.xml
```

### CORS errors
```bash
# Update ALLOWED_ORIGINS in backend .env
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
```

---

## 📊 Database Schema

**4 tables:** `users`, `kiosks` (with `location_name`), `jobs` (with JSONB `metadata` for guest info), `admin_actions`

**4 views:** `active_jobs`, `kiosk_stats`, `daily_kiosk_stats`, `system_metrics`

**Job types:** `print`, `scan`, `xerox`

**Job statuses:**
- Print: `PENDING` → `PAID` → `QUEUED` → `SENT_TO_PI` → `PRINTING` → `COMPLETED`
- Scan: `QUEUED` → `DISCOVERING_SCANNER` → `SCANNING` → `PROCESSING` → `COMPLETED`
- Xerox: `PENDING` → `PAID` → `SENT_TO_PI` → `DISCOVERING_SCANNER` → `SCANNING` → `PRINTING` → `COMPLETED`
- Error: `FAILED`, `EXPIRED`, `CANCELLED`

> **Note:** Backward state transitions (e.g. `PRINTING` → `SCANNING`) are rejected by the `STATE_ORDER` guard in `socket-manager.js`. Transitions to `FAILED` are always allowed regardless of current state. Duplicate `print_complete` / `scan_complete` events are idempotently ignored.

**Migration (if upgrading):**
```sql
ALTER TABLE kiosks ADD COLUMN IF NOT EXISTS location_name TEXT;
```
