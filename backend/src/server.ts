import app from './app';
import { testConnection } from './config/database';
import { testRedisConnection } from './config/redis';
import { testEmailConnection } from './config/email';
import { QueueService } from './services/queue.service';
import { EmailWorker } from './workers/email.worker';
import { EmailService } from './services/email.service';
import { RateLimiterService } from './services/ratelimiter.service';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

async function startServer() {
  try {
    console.log('🚀 Starting ReachInbox Email Scheduler...\n');

    // Test critical connections (DB and Redis)
    console.log('Testing critical connections...');
    const [dbConnected, redisConnected] = await Promise.all([
      testConnection(),
      testRedisConnection(),
    ]);

    if (!dbConnected || !redisConnected) {
      throw new Error('Failed to connect to critical services (Database or Redis)');
    }

    // Test email connection (non-blocking - warn if fails)
    console.log('Testing email connection...');
    const emailConnected = await testEmailConnection().catch((error) => {
      console.warn('⚠️ Email service connection failed (non-critical):', error.message);
      console.warn('⚠️ Server will start, but emails may not send until SMTP is configured');
      return false;
    });

    if (emailConnected) {
      console.log('✅ Email service connected successfully');
    }

    console.log('\n📦 Initializing services...');

    // Initialize queue service
    QueueService.initialize();

    // Initialize email worker
    EmailWorker.initialize();

    // Restore rate limits from database
    await RateLimiterService.restoreFromDatabase();

    // Restore scheduled emails
    await EmailService.restoreScheduledEmails();

    // Start Express server - THIS MUST HAPPEN
    const server = app.listen(Number(PORT), HOST, () => {
      console.log(`\n✅ Server running on ${HOST}:${PORT}`);
      console.log(`📧 API available at http://${HOST}:${PORT}/api/v1`);
      console.log(`🏥 Health check: http://${HOST}:${PORT}/health\n`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Email configured: ${emailConnected ? 'Yes' : 'No (configure SMTP to send emails)'}\n`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n⏳ Shutting down gracefully...');
      
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
      
      await EmailWorker.close();
      await QueueService.close();
      
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();