# System Architecture Documentation

## Overview

This document describes the architecture, design decisions, and implementation details of the Scalable Job Importer system.

## System Architecture

```
┌─────────────────┐
│   Next.js UI    │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼─────────────────────────────────────┐
│         Express API Server                    │
│  ┌─────────────────────────────────────────┐ │
│  │  Controllers                            │ │
│  │  - Import Controller                    │ │
│  │  - History Controller                   │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │  Services                               │ │
│  │  - Job API Service                      │ │
│  │  - Queue Service                        │ │
│  │  - Import Service                       │ │
│  │  - Scheduler Service                    │ │
│  └─────────────────────────────────────────┘ │
└────────┬──────────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
    ┌────▼────┐        ┌────▼────┐      ┌─────▼─────┐
    │ MongoDB │        │  Redis  │      │  Workers  │
    │         │        │ (Queue) │      │ (BullMQ)  │
    └─────────┘        └─────────┘      └───────────┘
```

## Component Breakdown

### 1. Frontend (Next.js)

**Technology**: Next.js 14 with TypeScript

**Responsibilities**:
- Display import history with pagination
- Show aggregated statistics
- Provide manual import trigger
- Real-time status updates

**Key Features**:
- Server-side rendering for better performance
- Responsive design with modern UI
- Error handling and loading states
- Pagination for large datasets

### 2. Backend API (Express)

**Technology**: Node.js with Express

**Responsibilities**:
- RESTful API endpoints
- Request validation
- Error handling
- Integration with services

**Endpoints**:
- `POST /api/import/trigger` - Trigger manual import
- `GET /api/import/history` - Get import history
- `GET /api/import/stats` - Get aggregated statistics
- `GET /health` - Health check

### 3. Job API Service

**File**: `server/src/services/jobApiService.js`

**Responsibilities**:
- Fetch jobs from multiple XML/RSS feeds
- Parse XML to JSON
- Handle different feed formats (RSS, Atom, custom)
- Error handling for API failures

**Key Design Decisions**:
- **Multiple Feed Support**: Handles different XML structures (RSS, Atom, custom formats)
- **Robust Parsing**: Uses `xml2js` with flexible extraction logic
- **Error Isolation**: Each feed failure doesn't stop other feeds
- **ID Generation**: Generates unique IDs when source doesn't provide one

**Feed Formats Handled**:
1. **RSS 2.0** (Jobicy feeds)
   - Structure: `rss.channel.item[]`
   - Fields: title, description, link, pubDate, etc.

2. **Atom** (HigherEdJobs)
   - Structure: `feed.entry[]`
   - Fields: title, content, published, etc.

### 4. Queue Service

**Technology**: BullMQ with Redis

**File**: `server/src/services/queueService.js`

**Responsibilities**:
- Create and configure job queue
- Enqueue jobs for processing
- Configure retry logic

**Key Design Decisions**:
- **BullMQ over Bull**: BullMQ is the modern, actively maintained version
- **Retry Strategy**: Exponential backoff (3 attempts)
- **Job Retention**: 
  - Completed jobs: 24 hours
  - Failed jobs: 7 days
- **Bulk Operations**: Uses `addBulk` for efficient enqueuing

### 5. Worker System

**Technology**: BullMQ Workers

**File**: `server/src/workers/jobProcessor.js`

**Responsibilities**:
- Process queued jobs
- Import jobs into MongoDB
- Update import statistics
- Handle failures

**Key Design Decisions**:
- **Concurrency**: Configurable (default: 5)
- **Error Handling**: Failures are logged but don't stop processing
- **Statistics Tracking**: Real-time updates to import logs
- **Graceful Shutdown**: Handles SIGTERM/SIGINT

**Processing Flow**:
1. Receive job from queue
2. Extract job data and metadata
3. Call import service
4. Update statistics based on result (new/updated)
5. Handle errors and log failures

### 6. Import Service

**File**: `server/src/services/jobImportService.js`

**Responsibilities**:
- Import individual jobs
- Create/update jobs in MongoDB
- Manage import logs
- Track statistics

**Key Design Decisions**:
- **Upsert Logic**: Check for existing job by `externalId + sourceUrl`
- **Update Strategy**: Update existing jobs with new data
- **Validation**: Required fields check before import
- **Atomic Operations**: Uses MongoDB transactions where needed

**Deduplication Strategy**:
- Compound unique index on `(externalId, sourceUrl)`
- Prevents duplicate jobs from same source
- Allows same job from different sources

### 7. Scheduler Service

**Technology**: node-cron

**File**: `server/src/services/schedulerService.js`

**Responsibilities**:
- Schedule automated imports
- Trigger imports on schedule
- Coordinate with queue service

**Key Design Decisions**:
- **Cron Expression**: Configurable via environment variable
- **Default Schedule**: Every hour (`0 * * * *`)
- **Error Isolation**: Feed failures don't stop other feeds
- **Manual Trigger**: Can be triggered via API

### 8. Database Models

#### Job Model

**File**: `server/src/models/Job.js`

**Schema Design**:
- **Unique Constraint**: `externalId + sourceUrl` (compound index)
- **Flexible Fields**: Supports various job data structures
- **Raw Data Storage**: Stores original API response for debugging
- **Timestamps**: Automatic createdAt/updatedAt tracking

**Indexes**:
- `{ externalId: 1, sourceUrl: 1 }` - Unique compound index
- `{ sourceUrl: 1 }` - For filtering by source
- `{ createdAt: -1 }` - For recent jobs query

#### ImportLog Model

**File**: `server/src/models/ImportLog.js`

**Schema Design**:
- **Tracking Fields**: Comprehensive metrics
- **Failure Details**: Array of failure reasons
- **Status Tracking**: pending → processing → completed/failed
- **Duration**: Processing time tracking

**Indexes**:
- `{ timestamp: -1 }` - For chronological queries
- `{ fileName: 1, timestamp: -1 }` - For source-specific queries

## Data Flow

### Import Flow

```
1. Scheduler/Cron triggers import
   ↓
2. Job API Service fetches from all feeds
   ↓
3. XML parsed to JSON
   ↓
4. Import log created for each feed
   ↓
5. Jobs enqueued to Redis queue
   ↓
6. Workers process jobs concurrently
   ↓
7. Jobs imported to MongoDB (create/update)
   ↓
8. Statistics updated in import log
   ↓
9. Import log marked as completed
```

### Query Flow

```
1. Frontend requests import history
   ↓
2. API Controller receives request
   ↓
3. Query MongoDB ImportLog collection
   ↓
4. Apply pagination and filters
   ↓
5. Return formatted response
   ↓
6. Frontend displays data
```

## Scalability Considerations

### Horizontal Scaling

1. **Workers**: Can run multiple worker processes
   - Each worker connects to same Redis queue
   - BullMQ handles job distribution
   - No conflicts or duplicate processing

2. **API Servers**: Can run multiple instances
   - Stateless design
   - Shared MongoDB and Redis
   - Load balancer can distribute requests

3. **Database**: MongoDB supports sharding
   - Can shard by sourceUrl or date
   - Replica sets for read scaling

### Performance Optimizations

1. **Queue Processing**:
   - Configurable concurrency
   - Batch operations where possible
   - Efficient job serialization

2. **Database**:
   - Indexes on frequently queried fields
   - Compound indexes for common queries
   - Lean queries for read operations

3. **API**:
   - Pagination to limit response size
   - Efficient aggregation queries
   - Caching headers (can be added)

## Error Handling Strategy

### API Level
- Try-catch blocks around all operations
- Meaningful error messages
- HTTP status codes
- Error logging

### Service Level
- Individual feed failures don't stop others
- Retry logic for transient failures
- Validation before processing
- Graceful degradation

### Worker Level
- Job failures logged with details
- Failed jobs tracked in import log
- Retry with exponential backoff
- Dead letter queue for persistent failures

## Security Considerations

1. **Input Validation**: Validate all API inputs
2. **SQL Injection**: Not applicable (MongoDB)
3. **XSS**: Frontend sanitizes user input
4. **CORS**: Configured for specific origins
5. **Environment Variables**: Sensitive data in .env
6. **Rate Limiting**: Can be added (not implemented)

## Future Enhancements

### Potential Improvements

1. **Real-time Updates**:
   - Socket.IO or Server-Sent Events
   - Live import progress
   - Real-time statistics

2. **Advanced Features**:
   - Job search and filtering
   - Export functionality
   - Email notifications
   - Webhook support

3. **Monitoring**:
   - Metrics collection (Prometheus)
   - Logging aggregation (ELK stack)
   - Health checks and alerts

4. **Testing**:
   - Unit tests for services
   - Integration tests for API
   - E2E tests for frontend

5. **Performance**:
   - Redis caching layer
   - Database query optimization
   - CDN for static assets

## Technology Choices

### Why Express over Nest.js?
- Simpler for this use case
- Faster development
- Less boilerplate
- Sufficient for requirements

### Why BullMQ over Bull?
- Modern, actively maintained
- Better TypeScript support
- Improved performance
- Better Redis connection handling

### Why MongoDB?
- Flexible schema for varying job structures
- Good for document storage
- Easy horizontal scaling
- JSON-like structure matches API responses

### Why Next.js?
- Server-side rendering
- Good developer experience
- TypeScript support
- Easy deployment

## Deployment Architecture

### Development
```
Local Machine
├── MongoDB (local)
├── Redis (local)
├── Server (npm run dev)
├── Worker (npm run worker)
└── Client (npm run dev)
```

### Production
```
Load Balancer
├── API Servers (multiple instances)
│   └── Express + Scheduler
├── Workers (multiple instances)
│   └── BullMQ Workers
├── MongoDB Atlas (managed)
└── Redis Cloud (managed)
```

## Conclusion

This architecture provides:
- ✅ Scalability through queue-based processing
- ✅ Reliability through error handling and retries
- ✅ Maintainability through modular design
- ✅ Observability through import history tracking
- ✅ Flexibility through configurable components

The system can evolve to microservices if needed, with clear separation of concerns and well-defined interfaces.

