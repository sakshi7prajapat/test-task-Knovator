import cron from 'node-cron';
import { fetchAllJobFeeds } from './jobApiService.js';
import { createJobQueue, enqueueJobs } from './queueService.js';
import { createImportLog, updateImportLog } from './jobImportService.js';

let jobQueue = null;

/**
 * Initialize the scheduler service
 */
export const initializeScheduler = () => {
  jobQueue = createJobQueue();
  
  // Schedule job fetching every hour
  const cronExpression = process.env.JOB_FETCH_INTERVAL || '0 * * * *'; // Every hour
  
  console.log(`⏰ Scheduling job fetch with cron: ${cronExpression}`);
  
  cron.schedule(cronExpression, async () => {
    console.log('🔄 Starting scheduled job import...');
    await triggerJobImport();
  });
  
  console.log('✅ Scheduler initialized');
};

/**
 * Manually trigger job import for all feeds
 */
export const triggerJobImport = async () => {
  try {
    const feeds = await fetchAllJobFeeds();
    
    for (const { url, jobs, error } of feeds) {
      if (error) {
        console.error(`❌ Skipping ${url} due to error: ${error}`);
        continue;
      }
      
      if (!jobQueue) {
        jobQueue = createJobQueue();
      }
      
      // Create import log
      const importLog = await createImportLog(url, {
        totalFetched: jobs.length,
        timestamp: new Date(),
      });
      
      const startTime = Date.now();
      
      // Enqueue jobs for processing
      if (jobs.length > 0) {
        await enqueueJobs(jobQueue, url, jobs, importLog._id.toString());
      } else {
        // No jobs to import, mark as completed
        await updateImportLog(importLog._id.toString(), {
          status: 'completed',
          duration: Date.now() - startTime,
        });
      }
      
      console.log(`✅ Import initiated for ${url}: ${jobs.length} jobs queued`);
    }
  } catch (error) {
    console.error('❌ Error in scheduled job import:', error);
  }
};

/**
 * Get the job queue instance
 */
export const getJobQueue = () => {
  if (!jobQueue) {
    jobQueue = createJobQueue();
  }
  return jobQueue;
};

