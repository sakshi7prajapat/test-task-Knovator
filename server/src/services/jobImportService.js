import Job from '../models/Job.js';
import ImportLog from '../models/ImportLog.js';

/**
 * Import a single job into MongoDB
 * @param {Object} jobData - Job data to import
 * @param {string} sourceUrl - Source URL
 * @returns {Promise<Object>} Result with status and type (new/updated)
 */
export const importJob = async (jobData, sourceUrl) => {
  try {
    // Validate required fields
    if (!jobData.externalId || !jobData.title) {
      throw new Error('Missing required fields: externalId or title');
    }

    // Find existing job
    const existingJob = await Job.findOne({
      externalId: jobData.externalId,
      sourceUrl: sourceUrl,
    });

    if (existingJob) {
      // Update existing job
      Object.assign(existingJob, {
        ...jobData,
        updatedAt: new Date(),
      });
      await existingJob.save();
      return { status: 'updated', type: 'updated', job: existingJob };
    } else {
      // Create new job
      const newJob = new Job({
        ...jobData,
        sourceUrl: sourceUrl,
      });
      await newJob.save();
      return { status: 'created', type: 'new', job: newJob };
    }
  } catch (error) {
    throw new Error(`Failed to import job: ${error.message}`);
  }
};

/**
 * Create or update import log
 * @param {string} fileName - Source URL
 * @param {Object} initialData - Initial log data
 * @returns {Promise<Object>} Import log document
 */
export const createImportLog = async (fileName, initialData = {}) => {
  const importLog = new ImportLog({
    fileName,
    ...initialData,
    status: 'processing',
  });
  await importLog.save();
  return importLog;
};

/**
 * Update import log with results
 * @param {string} importLogId - Import log ID
 * @param {Object} updates - Updates to apply (can include $inc for increments)
 */
export const updateImportLog = async (importLogId, updates) => {
  // Build update query - handle $inc operator properly
  const updateQuery = { ...updates };
  
  // If updates don't have $inc, add status directly
  if (!updates.$inc) {
    updateQuery.status = 'completed';
  } else {
    // If $inc exists, use $set for status
    updateQuery.$set = { ...(updates.$set || {}), status: 'completed' };
  }
  
  await ImportLog.findByIdAndUpdate(importLogId, updateQuery);
};

/**
 * Add failure reason to import log
 * @param {string} importLogId - Import log ID
 * @param {string} jobId - Job ID that failed
 * @param {string} reason - Failure reason
 * @param {string} error - Error message
 */
export const addFailureReason = async (importLogId, jobId, reason, error) => {
  const importLog = await ImportLog.findById(importLogId);
  if (importLog) {
    importLog.failureReasons.push({
      jobId,
      reason,
      error: error.toString(),
    });
    importLog.failedJobs = (importLog.failedJobs || 0) + 1;
    await importLog.save();
  }
};
