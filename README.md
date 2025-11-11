# Scalable Job Importer with Queue Processing & History Tracking

A full-stack application for importing jobs from multiple XML/RSS feeds, processing them through a Redis queue, storing them in MongoDB, and tracking import history with a modern Next.js admin interface.

## 🏗️ Architecture

- **Backend**: Node.js with Express
- **Frontend**: Next.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Queue**: BullMQ with Redis
- **Scheduler**: node-cron for automated imports

## 📁 Project Structure

```
.
├── client/                 # Next.js frontend application
│   ├── src/
│   │   ├── pages/         # Next.js pages
│   │   └── styles/        # Global styles
│   └── package.json
├── server/                 # Express backend application
│   ├── src/
│   │   ├── config/        # Database and Redis configuration
│   │   ├── controllers/   # API controllers
│   │   ├── models/        # MongoDB models
│   │   ├── services/      # Business logic services
│   │   ├── workers/       # BullMQ worker processes
│   │   └── index.js       # Server entry point
│   └── package.json
├── docs/
│   └── architecture.md    # Detailed architecture documentation
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Redis (local or Redis Cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd test-task-knovator
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**

   Create `server/.env`:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/job_importer
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   WORKER_CONCURRENCY=5
   BATCH_SIZE=100
   JOB_FETCH_INTERVAL=0 * * * *
   ```

   Create `client/.env.local` (optional):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

### Running the Application

1. **Start MongoDB and Redis**
   ```bash
   # MongoDB (if running locally)
   mongod

   # Redis (if running locally)
   redis-server
   ```

2. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

3. **Start the worker process** (in a separate terminal)
   ```bash
   cd server
   npm run worker
   ```

4. **Start the frontend**
   ```bash
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📋 Features

### Backend Features

- ✅ **Multi-source Job Fetching**: Fetches jobs from 9 different XML/RSS feeds
- ✅ **XML to JSON Conversion**: Automatically parses XML feeds into JSON
- ✅ **Queue-based Processing**: Uses BullMQ with Redis for scalable job processing
- ✅ **Worker System**: Background workers process jobs with configurable concurrency
- ✅ **Import History Tracking**: Tracks all imports with detailed metrics
- ✅ **Automated Scheduling**: Cron job runs every hour to fetch new jobs
- ✅ **Error Handling**: Comprehensive error handling with retry logic
- ✅ **API Endpoints**: RESTful API for triggering imports and viewing history

### Frontend Features

- ✅ **Import History Dashboard**: View all import runs with detailed statistics
- ✅ **Real-time Statistics**: Overview of total imports, new jobs, updated jobs, and failures
- ✅ **Manual Import Trigger**: Button to manually trigger job imports
- ✅ **Pagination**: Navigate through import history
- ✅ **Status Indicators**: Visual badges for import status
- ✅ **Responsive Design**: Modern, clean UI with responsive layout

## 🔌 API Endpoints

### `POST /api/import/trigger`
Manually trigger import for all configured job feeds.

**Response:**
```json
{
  "success": true,
  "message": "Import triggered successfully",
  "results": [
    {
      "url": "https://jobicy.com/?feed=job_feed",
      "success": true,
      "jobsQueued": 50,
      "importLogId": "..."
    }
  ]
}
```

### `GET /api/import/history`
Get import history with pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `fileName` (optional: filter by URL)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "fileName": "https://jobicy.com/?feed=job_feed",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "totalFetched": 50,
      "totalImported": 48,
      "newJobs": 30,
      "updatedJobs": 18,
      "failedJobs": 2,
      "status": "completed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### `GET /api/import/stats`
Get aggregated import statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalImports": 100,
    "totalFetched": 5000,
    "totalImported": 4800,
    "totalNew": 3000,
    "totalUpdated": 1800,
    "totalFailed": 200
  }
}
```

### `GET /health`
Health check endpoint.

## 🔄 How It Works

1. **Scheduled Import**: A cron job runs every hour (configurable) to fetch jobs from all configured APIs
2. **API Fetching**: The system fetches XML/RSS feeds from multiple sources
3. **XML Parsing**: XML responses are converted to JSON format
4. **Queue Enqueuing**: Jobs are added to a Redis queue for processing
5. **Worker Processing**: Background workers process jobs concurrently:
   - Check if job exists (by externalId + sourceUrl)
   - Create new job or update existing one
   - Track statistics (new/updated/failed)
6. **History Tracking**: Each import run is logged with detailed metrics
7. **Frontend Display**: Admin UI shows import history and statistics

## 🛠️ Configuration

### Environment Variables

**Server (`server/.env`):**
- `PORT`: Server port (default: 3001)
- `MONGODB_URI`: MongoDB connection string
- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password (optional)
- `WORKER_CONCURRENCY`: Number of concurrent workers (default: 5)
- `BATCH_SIZE`: Batch size for processing (default: 100)
- `JOB_FETCH_INTERVAL`: Cron expression for scheduling (default: `0 * * * *`)

**Client (`client/.env.local`):**
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3001)

## 📊 Database Schema

### Job Model
- `externalId`: Unique identifier from source API
- `sourceUrl`: Source feed URL
- `title`, `description`, `company`, `location`, etc.
- `rawData`: Original data from API
- Compound index on `externalId` + `sourceUrl` for efficient lookups

### ImportLog Model
- `fileName`: Source URL
- `timestamp`: Import time
- `totalFetched`: Total jobs fetched
- `totalImported`: Successfully imported
- `newJobs`: New records created
- `updatedJobs`: Existing records updated
- `failedJobs`: Failed imports
- `failureReasons`: Array of failure details

## 🚀 Deployment

### Using Docker (Optional)

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
  
  redis:
    image: redis:latest
    ports:
      - "6379:6379"
  
  server:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/job_importer
      - REDIS_HOST=redis
    depends_on:
      - mongodb
      - redis
  
  worker:
    build: ./server
    command: npm run worker
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/job_importer
      - REDIS_HOST=redis
    depends_on:
      - mongodb
      - redis
```

### Cloud Deployment

**Backend (Render/Vercel):**
- Deploy server to Render or similar platform
- Use MongoDB Atlas for database
- Use Redis Cloud for queue storage
- Set environment variables in platform settings

**Frontend (Vercel):**
- Deploy Next.js app to Vercel
- Set `NEXT_PUBLIC_API_URL` to your backend URL

## 🧪 Testing

### Manual Testing

1. **Trigger Import**: Use the "Trigger Import" button in the UI or call `POST /api/import/trigger`
2. **Check Queue**: Monitor Redis queue for jobs
3. **View History**: Check import history in the UI
4. **Verify Jobs**: Query MongoDB to verify jobs were imported

### Monitoring

- Check worker logs for processing status
- Monitor Redis queue size
- Check MongoDB for imported jobs
- Review import logs for failures

## 📝 Notes

- The system handles multiple XML feed formats (RSS, Atom, custom)
- Jobs are deduplicated by `externalId` + `sourceUrl`
- Failed jobs are logged with detailed error messages
- The queue system supports retry with exponential backoff
- Import history is preserved for analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

ISC

