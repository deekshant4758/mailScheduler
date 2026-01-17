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

async function startServer() {
  try {
    console.log('🚀 Starting ReachInbox Email Scheduler...\n');

    // Test connections
    console.log('Testing connections...');
    const [dbConnected, redisConnected, emailConnected] = await Promise.all([
      testConnection(),
      testRedisConnection(),
      testEmailConnection(),
    ]);

    if (!dbConnected || !redisConnected || !emailConnected) {
      throw new Error('Failed to connect to required services');
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

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`📧 API available at http://localhost:${PORT}/api/v1`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n⏳ Shutting down gracefully...');
      
      await EmailWorker.close();
      await QueueService.close();
      
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();