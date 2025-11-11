import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis.js';

/**
 * Create and configure job import queue
 */
export const createJobQueue = () => {
  const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  };

  return new Queue('job-import', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      },
    },
  });
};

/**
 * Add jobs to the queue for processing
 * @param {string} sourceUrl - The API URL
 * @param {Array} jobs - Array of job objects to import
 * @param {string} importLogId - Import log ID for tracking
 */
export const enqueueJobs = async (queue, sourceUrl, jobs, importLogId) => {
  const jobsToQueue = jobs.map((job) => ({
    name: 'import-job',
    data: {
      job,
      sourceUrl,
      importLogId,
    },
  }));

  await queue.addBulk(jobsToQueue);
  console.log(`✅ Queued ${jobsToQueue.length} jobs for import from ${sourceUrl}`);
};

