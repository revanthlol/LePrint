# LePrint Pi-Agent

The Pi-Agent runs on Raspberry Pi (or any Linux device) connected to a printer. It polls the cloud backend for jobs, downloads files, converts them if needed, and sends to CUPS for printing. It also handles scan and xerox (photocopy) jobs via eSCL/SANE.

## Setup

```bash
cp .env.example .env
# Edit .env with your kiosk ID, cloud URL, and printer IP
npm install
node index.js
```

## Local Development & Testing

### Running without hardware (simulation mode)

1. Copy `.env.example` to `.env` and configure:
   ```
   CLOUD_URL=https://justpri.duckdns.org
   KIOSK_ID=kiosk_dev_yourname     # unique ID per developer
   SIMULATE_PRINTER=true
   SIMULATE_SCANNER=true
   PRINTER_IP=192.168.1.1          # ignored in sim mode
   ```

2. Install and start:
   ```bash
   cd pi-agent && npm install && node index.js
   ```

3. Go to `leprint.in?kiosk_id=kiosk_dev_yourname` to submit jobs.
   Jobs will simulate print/scan with realistic delays.

### Quick UI testing (no pi-agent needed)

Use the mock kiosk built into the backend:

1. Go to `leprint.in?kiosk_id=kiosk_test`
2. Submit any job and complete payment
3. Job auto-completes with real status transitions
   - Default: ~5s total (controlled by `MOCK_COMPLETE_DELAY_MS` on backend)
   - For instant testing: set `MOCK_STEP_DELAY_MS=500 MOCK_COMPLETE_DELAY_MS=1000`

### Multiple developers testing simultaneously

Use unique `KIOSK_ID`s per developer (e.g. `kiosk_dev_rev`, `kiosk_dev_abhay`) to avoid claiming each other's jobs from the queue.
