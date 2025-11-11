import { fetchAllJobFeeds } from '../services/jobApiService.js';
import { createJobQueue, enqueueJobs } from '../services/queueService.js';
import { createImportLog, updateImportLog } from '../services/jobImportService.js';
import { getJobQueue } from '../services/schedulerService.js';
import ImportLog from '../models/ImportLog.js';

/**
 * Manually trigger import for all job feeds
 */
export const triggerImport = async (req, res) => {
  try {
    const queue = getJobQueue();
    const feeds = await fetchAllJobFeeds();
    const results = [];
    
    for (const { url, jobs, error } of feeds) {
      if (error) {
        results.push({
          url,
          success: false,
          error,
          jobsQueued: 0,
        });
        continue;
      }
      
      // Create import log
      const importLog = await createImportLog(url, {
        totalFetched: jobs.length,
        timestamp: new Date(),
      });
      
      const startTime = Date.now();
      
      // Enqueue jobs for processing
      if (jobs.length > 0) {
        await enqueueJobs(queue, url, jobs, importLog._id.toString());
      } else {
        // No jobs to import, mark as completed
        await updateImportLog(importLog._id.toString(), {
          status: 'completed',
          duration: Date.now() - startTime,
        });
      }
      
      results.push({
        url,
        success: true,
        jobsQueued: jobs.length,
        importLogId: importLog._id.toString(),
      });
    }
    
    res.json({
      success: true,
      message: 'Import triggered successfully',
      results,
    });
  } catch (error) {
    console.error('Error triggering import:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get import history
 */
export const getImportHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, fileName } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = fileName ? { fileName: { $regex: fileName, $options: 'i' } } : {};
    
    const [logs, total] = await Promise.all([
      ImportLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ImportLog.countDocuments(query),
    ]);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get import statistics
 */
export const getImportStats = async (req, res) => {
  try {
    const stats = await ImportLog.aggregate([
      {
        $group: {
          _id: null,
          totalImports: { $sum: 1 },
          totalFetched: { $sum: '$totalFetched' },
          totalImported: { $sum: '$totalImported' },
          totalNew: { $sum: '$newJobs' },
          totalUpdated: { $sum: '$updatedJobs' },
          totalFailed: { $sum: '$failedJobs' },
        },
      },
    ]);
    
    res.json({
      success: true,
      stats: stats[0] || {
        totalImports: 0,
        totalFetched: 0,
        totalImported: 0,
        totalNew: 0,
        totalUpdated: 0,
        totalFailed: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching import stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

