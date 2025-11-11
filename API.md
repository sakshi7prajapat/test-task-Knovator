# API Reference

Base URL: `http://localhost:3001` (or your deployed backend URL)

## Endpoints

### Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Trigger Import

**POST** `/api/import/trigger`

Manually trigger import for all configured job feeds.

**Request:**
```bash
curl -X POST http://localhost:3001/api/import/trigger
```

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
      "importLogId": "65a1b2c3d4e5f6g7h8i9j0k1"
    },
    {
      "url": "https://www.higheredjobs.com/rss/articleFeed.cfm",
      "success": true,
      "jobsQueued": 30,
      "importLogId": "65a1b2c3d4e5f6g7h8i9j0k2"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

### Get Import History

**GET** `/api/import/history`

Retrieve import history with pagination.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page
- `fileName` (optional) - Filter by source URL (partial match)

**Request:**
```bash
# Get first page
curl http://localhost:3001/api/import/history

# Get specific page
curl http://localhost:3001/api/import/history?page=2&limit=20

# Filter by URL
curl "http://localhost:3001/api/import/history?fileName=jobicy"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "fileName": "https://jobicy.com/?feed=job_feed",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "totalFetched": 50,
      "totalImported": 48,
      "newJobs": 30,
      "updatedJobs": 18,
      "failedJobs": 2,
      "status": "completed",
      "failureReasons": [
        {
          "jobId": "job-123",
          "reason": "Import failed",
          "error": "Missing required fields: externalId or title"
        }
      ],
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:05:00.000Z"
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

---

### Get Import Statistics

**GET** `/api/import/stats`

Get aggregated statistics across all imports.

**Request:**
```bash
curl http://localhost:3001/api/import/stats
```

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

---

## Data Models

### ImportLog

```typescript
{
  _id: string;
  fileName: string;           // Source URL
  timestamp: Date;            // Import time
  totalFetched: number;      // Jobs fetched from API
  totalImported: number;      // Successfully imported
  newJobs: number;            // New records created
  updatedJobs: number;        // Existing records updated
  failedJobs: number;         // Failed imports
  failureReasons: Array<{     // Failure details
    jobId: string;
    reason: string;
    error: string;
  }>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration?: number;          // Processing time in ms
  error?: string;             // Error message if failed
  createdAt: Date;
  updatedAt: Date;
}
```

### Job

```typescript
{
  _id: string;
  externalId: string;         // Unique ID from source
  sourceUrl: string;          // Source feed URL
  title: string;
  description?: string;
  company?: string;
  location?: string;
  jobType?: string;
  category?: string;
  salary?: string;
  applyUrl?: string;
  publishedDate?: Date;
  rawData?: object;           // Original API response
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request
- `500` - Internal Server Error

---

## Rate Limiting

Currently, there is no rate limiting implemented. For production, consider adding:
- Rate limiting middleware
- Request throttling
- API key authentication

---

## CORS

CORS is enabled for all origins in development. For production, configure specific origins:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

