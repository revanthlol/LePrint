// pi-agent/modules/logger.js
// Centralized logging with timestamps, colors, and log levels

const colors = {
  reset:   '\x1b[0m',
  white:   '\x1b[37m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  gray:    '\x1b[90m'
};

const DEBUG = process.env.DEBUG === 'true';

function timestamp() {
  return new Date().toTimeString().slice(0, 8);
}

class Logger {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  info(message) {
    console.log(`${colors.white}[${timestamp()}]${colors.reset} ${message}`);
  }

  success(message) {
    console.log(`${colors.green}[${timestamp()}] ✓${colors.reset} ${message}`);
  }

  warn(message) {
    console.warn(`${colors.yellow}[${timestamp()}] ⚠${colors.reset} ${message}`);
  }

  error(message) {
    console.error(`${colors.red}[${timestamp()}] ✗${colors.reset} ${message}`);
  }

  debug(message) {
    if (DEBUG) {
      console.log(`${colors.gray}[${timestamp()}] [DEBUG]${colors.reset} ${message}`);
    }
  }

  job(message) {
    console.log(`${colors.cyan}[${timestamp()}] [JOB]${colors.reset} ${message}`);
  }

  socket(message) {
    console.log(`${colors.magenta}[${timestamp()}] [SOCKET]${colors.reset} ${message}`);
  }

  section(title) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`[${timestamp()}] ${title}`);
    console.log(`${'='.repeat(50)}`);
  }
}

// Export singleton
module.exports = new Logger();
