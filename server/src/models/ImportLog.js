import mongoose from 'mongoose';

const importLogSchema = new mongoose.Schema({
  // Source URL/feed identifier (fileName)
  fileName: {
    type: String,
    required: true,
    index: true,
  },
  
  // Timestamp of import
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  
  // Total jobs fetched from API
  totalFetched: {
    type: Number,
    default: 0,
  },
  
  // Total jobs successfully imported
  totalImported: {
    type: Number,
    default: 0,
  },
  
  // Number of new jobs created
  newJobs: {
    type: Number,
    default: 0,
  },
  
  // Number of existing jobs updated
  updatedJobs: {
    type: Number,
    default: 0,
  },
  
  // Number of failed jobs
  failedJobs: {
    type: Number,
    default: 0,
  },
  
  // Array of failure reasons
  failureReasons: [{
    jobId: String,
    reason: String,
    error: String,
  }],
  
  // Import status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  
  // Processing duration in milliseconds
  duration: {
    type: Number,
  },
  
  // Error message if import failed
  error: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
importLogSchema.index({ timestamp: -1 });
importLogSchema.index({ fileName: 1, timestamp: -1 });

export default mongoose.model('ImportLog', importLogSchema);

