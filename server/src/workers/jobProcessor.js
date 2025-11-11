import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { importJob, updateImportLog, addFailureReason } from '../services/jobImportService.js';
import { connectDatabase } from '../config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to database
const init = async () => {
  await connectDatabase();
};
init();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5');

/**
 * Worker to process job import queue
 */
const worker = new Worker(
  'job-import',
  async (job) => {
    const { job: jobData, sourceUrl, importLogId } = job.data;
    
    try {
      console.log(`🔄 Processing job: ${jobData.title || jobData.externalId}`);
      
      const result = await importJob(jobData, sourceUrl);
      
      // Update import log statistics
      const update = {};
      if (result.type === 'new') {
        update.$inc = { newJobs: 1, totalImported: 1 };
      } else if (result.type === 'updated') {
        update.$inc = { updatedJobs: 1, totalImported: 1 };
      }
      
      if (update.$inc) {
        await updateImportLog(importLogId, update);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to process job ${jobData.externalId}:`, error.message);
      
      // Record failure
      await addFailureReason(
        importLogId,
        jobData.externalId || 'unknown',
        'Import failed',
        error.message
      );
      
      throw error; // Re-throw to mark job as failed
    }
  },
  {
    connection,
    concurrency,
  }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

console.log(`🚀 Job processor worker started with concurrency: ${concurrency}`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});

