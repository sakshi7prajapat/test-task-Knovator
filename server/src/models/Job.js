import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  // Unique identifier from the source API
  externalId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Source URL/feed identifier
  sourceUrl: {
    type: String,
    required: true,
    index: true,
  },
  
  // Job title
  title: {
    type: String,
    required: true,
  },
  
  // Job description
  description: {
    type: String,
  },
  
  // Company name
  company: {
    type: String,
  },
  
  // Job location
  location: {
    type: String,
  },
  
  // Job type (full-time, part-time, etc.)
  jobType: {
    type: String,
  },
  
  // Job category
  category: {
    type: String,
  },
  
  // Salary information
  salary: {
    type: String,
  },
  
  // Application URL
  applyUrl: {
    type: String,
  },
  
  // Publication date
  publishedDate: {
    type: Date,
  },
  
  // Raw data from API (for reference)
  rawData: {
    type: mongoose.Schema.Types.Mixed,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for efficient lookups
jobSchema.index({ externalId: 1, sourceUrl: 1 }, { unique: true });

export default mongoose.model('Job', jobSchema);

