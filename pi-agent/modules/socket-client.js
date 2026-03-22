// pi-agent/modules/socket-client.js
// Socket.IO connection management, events, and heartbeat

const io = require('socket.io-client');
const printer = require('./printer');

// ==================== SAFE EMIT ====================
/**
 * Emit an event safely. If socket is connected, emit immediately.
 * If disconnected, queue the event for replay on reconnect.
 * Signature matches: safeEmit(socket, state, eventName, payload)
 */
function safeEmit(socket, state, eventName, payload) {
  if (socket.connected) {
    socket.emit(eventName, payload);
    return true;
  }
  state.pendingEvents.push({ eventName, payload, timestamp: Date.now() });
  // Log the queued event with job context if available
  const jobId = payload?.job_id || 'unknown';
  const logger = require('./logger');
  logger.socket(`Event queued (socket down): ${eventName} for job ${jobId}`);
  return false;
}

// ==================== SOCKET INITIALIZATION ====================
function initSocket(cloudServer, logger) {
  logger.socket('📡 Connecting to cloud...');

  const socket = io(cloudServer, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity
  });

  return socket;
}

// ==================== SOCKET EVENT HANDLERS ====================
function setupEventHandlers(socket, kioskId, hostname, state, logger) {
  
  socket.on('connect', async () => {
    state.socketConnectedAt = Date.now();
    logger.socket('Connected to Cloud Hub!');

    try {
      state.printerName = await printer.detectPrinter(process.env.PRINTER_NAME || 'auto', logger);
    } catch (e) {
      logger.warn(`Could not detect printer: ${e.message}`);
    }

    socket.emit('register', {
      kiosk_id: kioskId,
      hostname: hostname,
      printer_name: state.printerName || 'unknown'
    });

    logger.socket(`Registered with cloud — kiosk: ${kioskId}, printer: ${state.printerName || 'unknown'}`);

    // Flush queued events that were stored while disconnected
    if (state.pendingEvents && state.pendingEvents.length > 0) {
      const count = state.pendingEvents.length;
      logger.socket(`Replaying ${count} queued events...`);
      for (const queued of state.pendingEvents) {
        socket.emit(queued.eventName, queued.payload);
        const jobId = queued.payload?.job_id || 'unknown';
        logger.socket(`→ Replayed: ${queued.eventName} for job ${jobId}`);
      }
      state.pendingEvents = [];
    }
  });

  socket.on('disconnect', () => {
    const connectedDuration = state.socketConnectedAt
      ? `${((Date.now() - state.socketConnectedAt) / 1000).toFixed(1)}s`
      : 'unknown';
    const queuedCount = state.pendingEvents ? state.pendingEvents.length : 0;
    logger.socket(`Disconnected after ${connectedDuration} — ${queuedCount} events queued`);
    state.socketConnectedAt = null;
  });

  socket.on('reconnect', (attemptNumber) => {
    logger.socket(`🔁 Reconnected after ${attemptNumber} attempts`);
  });

  socket.on('ping', () => {
    socket.emit('pong', {
      status: 'alive',
      uptime: process.uptime(),
      current_job: state.currentJob,
      pending_count: state.pendingJobs.size,
      poll_count: state.pollCount,
      jobs_fetched_today: state.jobsFetchedToday,
      conversions_today: state.conversionsToday
    });
  });

  socket.on('update_config', (data) => {
    logger.info(`⚙️  Config update received: ${JSON.stringify(data)}`);
  });

  // ==================== SCAN JOB HANDLER ====================
  socket.on('scan_job', async (data) => {
    try {
      logger.job(`📄 Received scan job: ${data.job_id}`);

      // Delegate to job-handler which uses the already-initialized scanner
      const jobHandler = require('./job-handler');
      state.pendingJobs.set(data.job_id, {
        job_id: data.job_id,
        job_type: 'scan',
        scan_options: data.scan_options || {}
      });

      await jobHandler.processScanJob(data.job_id, state._cloudServer, state, socket, logger);
    } catch (error) {
      logger.error(`Scan failed: ${error.message}`);
      safeEmit(socket, state, 'job_state_change', {
        job_id: data.job_id,
        status: 'FAILED',
        status_message: `Scan failed: ${error.message}`
      });
    }
  });
}

// ==================== HEARTBEAT ====================
function startHeartbeat(socket, kioskId, heartbeatInterval, state, logger) {
  let lastPrinterStatus = 'unknown';

  // Normal heartbeat — full payload at configured interval
  const heartbeatId = setInterval(async () => {
    if (!socket.connected) return;

    // Check printer status
    const printerStatusResult = await printer.checkPrinterStatus(state.printerName, logger);

    // Log only if status changed
    if (printerStatusResult.status !== lastPrinterStatus) {
      logger.info(`🖨️  Printer status: ${printerStatusResult.status} (${printerStatusResult.detail || 'ok'})`);
      lastPrinterStatus = printerStatusResult.status;
    }

    socket.emit('heartbeat', {
      kiosk_id: kioskId,
      uptime: process.uptime(),
      printer_status: state.printerName ? 'ready' : 'no_printer',
      printer_ipp_status: printerStatusResult.status,
      printer_ipp_detail: printerStatusResult.detail,
      current_job: state.currentJob,
      pending_jobs: state.pendingJobs.size,
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      poll_count: state.pollCount,
      jobs_fetched_today: state.jobsFetchedToday,
      conversions_today: state.conversionsToday,
      last_poll: state.lastPollTime
    });
  }, heartbeatInterval);

  // Fast heartbeat — minimal keepalive during active jobs (every 8s)
  let fastHeartbeatId = null;

  const fastHeartbeatCheck = setInterval(() => {
    if (state.currentJob && !fastHeartbeatId) {
      // Start fast heartbeat when a job becomes active
      fastHeartbeatId = setInterval(() => {
        if (!state.currentJob) {
          // Job finished, stop fast heartbeat
          clearInterval(fastHeartbeatId);
          fastHeartbeatId = null;
          return;
        }
        if (!socket.connected) return;
        socket.emit('heartbeat', {
          kiosk_id: kioskId,
          current_job: state.currentJob,
          status: 'job_active'
        });
      }, 8000);
    }
  }, 2000);

  return heartbeatId;
}

// ==================== STATUS LOG ====================
function startStatusLog(state, logger) {
  const logId = setInterval(() => {
    logger.info(
      `💚 Agent alive | ` +
      `Uptime: ${Math.floor(process.uptime())}s | ` +
      `Polls: ${state.pollCount} | ` +
      `Fetched: ${state.jobsFetchedToday} | ` +
      `Conversions: ${state.conversionsToday} | ` +
      `Pending: ${state.pendingJobs.size}`
    );
  }, 60000);

  return logId;
}

// ==================== DAILY RESET ====================
function startDailyReset(state, logger) {
  const resetId = setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      state.jobsFetchedToday = 0;
      state.conversionsToday = 0;
      state.pollCount = 0;
      logger.info('📊 Daily counters reset');
    }
  }, 60000);

  return resetId;
}

module.exports = {
  initSocket,
  setupEventHandlers,
  startHeartbeat,
  startStatusLog,
  startDailyReset,
  safeEmit
};
