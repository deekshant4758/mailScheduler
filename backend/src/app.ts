import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import emailRoutes from './routes/email.routes';
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check with detailed status
app.get('/health', async (req, res) => {
  try {
    const { db } = require('./config/database');
    const { redisConnection } = require('./config/redis');
    
    // Test DB
    let dbStatus = 'disconnected';
    try {
      await db.raw('SELECT 1');
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
    }
    
    // Test Redis
    let redisStatus = 'disconnected';
    try {
      await redisConnection.ping();
      redisStatus = 'connected';
    } catch (error) {
      redisStatus = 'error';
    }
    
    // Check SMTP config
    const smtpConfigured = !!(
      process.env.SMTP_HOST && 
      process.env.SMTP_USER && 
      process.env.SMTP_PASS
    );
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        database: dbStatus,
        redis: redisStatus,
        smtp: smtpConfigured ? 'configured' : 'not_configured'
      },
      port: process.env.PORT || 5000
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.use(`${apiPrefix}/emails`, emailRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'ReachInbox Email Scheduler API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: apiPrefix
    }
  });
});

// Error handling
app.use(errorHandler);

export default app;