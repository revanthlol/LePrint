// backend/index.js - V5 Modular Refactor
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const multer = require('multer');

const db = require('./db');
const { initializeFirebase } = require('./auth-middleware');
const log = require('./modules/logger');

// Module Imports
const jobRoutes = require('./modules/job-routes');
const adminRoutes = require('./modules/admin-routes');
const { initSocketServer } = require('./modules/socket-manager');
const { startScheduledTasks } = require('./modules/tasks');
const kioskRoutes = require('./modules/kiosk-routes');
const contactRoutes = require('./modules/contact-routes');
const app = express();
const server = http.createServer(app);

// Make db accessible to routes
app.set('db', db);

initializeFirebase();

// ==================== CORS ====================
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'https://qr-wifi-printer.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'https://justpri.duckdns.org'
    ];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            log.warn('CORS blocked: ' + origin);
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());

// ==================== SOCKET.IO ====================
const io = new Server(server, { 
    cors: { 
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

initSocketServer(io);

// ==================== ROUTES ====================
app.use('/api', jobRoutes);
app.use('/api', adminRoutes);
app.use('/api/kiosk', kioskRoutes);
app.use('/api', contactRoutes);
// Global Error Handler for Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large',
        message: 'Maximum file size is 50MB' 
      });
    }
    return res.status(400).json({ error: error.message });
  } else if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
});

// ==================== SCHEDULED TASKS ====================
startScheduledTasks();

// ==================== STARTUP ====================
const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        const dbConnected = await db.testConnection();
        
        if (!dbConnected) {
            log.error('Database connection failed. Please check your configuration.');
            process.exit(1);
        }
        
        server.listen(PORT, '0.0.0.0', () => {
            log.info(`LePrint Server V5 started | Port: ${PORT} | DB: PostgreSQL | Auth: Firebase | Model: Pull-Based`);
        });
    } catch (error) {
        log.error('Failed to start server: ' + error.message);
        process.exit(1);
    }
}

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGINT', async () => {
    log.info('Shutting down server...');
    try {
        await db.closePool();
        log.info('Database connections closed');
    } catch (error) {
        log.error('Error closing database: ' + error.message);
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    log.info('Received SIGTERM...');
    await db.closePool();
    process.exit(0);
});

startServer();