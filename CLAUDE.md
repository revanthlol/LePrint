# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JusPri — a cloud-based print, scan, and xerox kiosk system. Users scan a QR code at a physical kiosk, upload documents from their phone, pay, and print. Three independent components communicate via REST API and Socket.IO.

## Architecture

```
Frontend (React/Vite, Vercel)  ←→  Backend (Express, Oracle VM)  ←→  Pi-Agent (Node.js, Raspberry Pi)
                                        ↕                                    ↕
                                   PostgreSQL                         CUPS Printer / eSCL Scanner
```

- **Backend** (`backend/`): Express + Socket.IO server on Oracle VM, managed by PM2. PostgreSQL database. Firebase Admin SDK for JWT auth.
- **Frontend** (`frontend/`): React 18 + Vite, deployed to Vercel. Firebase Auth (Google OAuth). Tailwind + shadcn/ui.
- **Pi-Agent** (`pi-agent/`): Runs on the kiosk machine. Polls backend for jobs, prints via CUPS, scans via SANE (scanimage) with raw eSCL HTTP fallback.

## Common Commands

```bash
# Backend
cd backend && npm install
node index.js                     # Start server (port 3001)
pm2 start index.js --name backend # Production

# Frontend
cd frontend && npm install
npm run dev                       # Dev server (Vite, port 5173)
npm run build                     # Production build
vercel                            # Deploy

# Pi-Agent
cd pi-agent && npm install
node index.js                     # Start agent
# System deps: sudo apt install cups libreoffice-writer imagemagick sane-utils sane-airscan

# Database
sudo -u postgres psql -f setup-db.sql
psql -U printuser -h localhost -d printkiosk -f schema.sql
```

No test framework is configured. Testing is manual (see TESTING.md).

## Key Data Flows

**Print:** Frontend uploads file → `POST /api/jobs/create` → user pays → `POST /api/jobs/:id/verify-payment` (status → PAID) → Pi-Agent polls `GET /api/jobs/poll` (atomically claims with `FOR UPDATE SKIP LOCKED`, status → SENT_TO_PI) → downloads file → converts to PDF if needed → prints via CUPS → emits `print_complete` socket event → Backend updates status to COMPLETED and decrements paper count.

**Scan:** Frontend → `POST /api/jobs/scan` → Backend checks kiosk socket is connected, emits `scan_job` event to pi-agent → Pi-Agent scans via SANE/eSCL → uploads result to `POST /api/jobs/:id/scan-upload` → user gets download link.

**Xerox:** Like print but pi-agent scans first, then prints N copies. Job goes through: PENDING → PAID → SENT_TO_PI → SCANNING → PRINTING → COMPLETED.

## Important Architectural Details

- **Job polling with row locking**: `GET /api/jobs/poll` uses `FOR UPDATE SKIP LOCKED` to prevent duplicate dispatch when multiple agents poll simultaneously.
- **Print retry**: Failed print jobs retry up to 3 times (retry_count 0→1→2→FAILED) with exponential backoff (30s, 60s). Retry state stored in `metadata.retry_after`.
- **Scanner dual-mode**: Pi-agent uses SANE `scanimage` as primary scanner (handles eSCL protocol correctly). Falls back to raw eSCL HTTP with 4 XML variant attempts if SANE unavailable.
- **Scanner IP discovery**: Auto-discovers via mDNS (`avahi-browse` for `_uscan._tcp` / `_eSCL._tcp`). Skips 127.x.x.x addresses (CUPS local proxy). Falls back to `PRINTER_IP` env var.
- **Socket events flow through `socket-manager.js`**: All pi-agent socket events (`print_complete`, `scan_complete`, `job_state_change`, `heartbeat`) are handled here, updating the database.
- **File uploads**: Multer stores files in `backend/uploads/`. Pi-agent downloads them via streaming. Cleanup: uploads after 2 hours, print-queue after 30 minutes.

## File Conversion (Pi-Agent)

- DOCX/TXT → PDF: LibreOffice headless (`libreoffice --convert-to pdf`)
- Images → PDF: ImageMagick (`convert`) or Sharp
- PNG scan output → PDF: ImageMagick

## Job Statuses

- Print: `PENDING → PAID → SENT_TO_PI → QUEUED → PRINTING → COMPLETED`
- Scan: `QUEUED → DISCOVERING_SCANNER → SCANNING → PROCESSING → COMPLETED`
- Xerox: `PENDING → PAID → SENT_TO_PI → SCANNING → PRINTING → COMPLETED`
- Error states: `FAILED`, `EXPIRED`, `CANCELLED`

## Auth

- Frontend: Firebase SDK, Google OAuth provider
- Backend: `verifyToken` middleware verifies Firebase JWT from `Authorization: Bearer <token>` header
- Admin: Users with `role = 'admin'` in the `users` table. Admin routes check role in DB (not Firebase claims).
- Pi-Agent endpoints (`/api/jobs/poll`, `/api/jobs/:id/download`, `/api/jobs/:id/scan-upload`) have no auth — secured by kiosk_id knowledge.

## Database

PostgreSQL with tables: `users`, `kiosks`, `jobs`, `admin_actions`. Schema in `backend/schema.sql`. Connection config via env vars (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`). The `db.js` module provides an abstraction layer; raw queries available via `db.query()`.

## Environment Files

Each component has its own `.env`. Key vars:
- Backend: `PORT`, `DB_*`, `FIREBASE_SERVICE_ACCOUNT_PATH`, `BACKEND_URL`, `ALLOWED_ORIGINS`
- Frontend: `VITE_API_URL`, `VITE_FIREBASE_*` (all prefixed `VITE_`)
- Pi-Agent: `CLOUD_URL`, `KIOSK_ID`, `PRINTER_NAME`, `PRINTER_IP`, `FRONTEND_URL`, `POLL_INTERVAL`

## Frontend Routing

- `/` — PrintInterface (main kiosk UI, expects `?kiosk_id=` query param)
- `/history` — User job history
- `/admin` — Admin dashboard (requires admin role)
- `/login` — Google OAuth login
- `/faq` — Public FAQ page
