// backend/modules/logger.js
// Lightweight timestamped logger for backend modules
// No external dependencies — pure Node.js

function ts() {
  return new Date().toTimeString().slice(0, 8);
}

const log = {
  info:   (msg) => console.log(`[${ts()}] ${msg}`),
  warn:   (msg) => console.warn(`[${ts()}] ⚠ ${msg}`),
  error:  (msg) => console.error(`[${ts()}] ✗ ${msg}`),
  job:    (msg) => console.log(`[${ts()}] [JOB] ${msg}`),
  socket: (msg) => console.log(`[${ts()}] [SOCKET] ${msg}`),
};

module.exports = log;
