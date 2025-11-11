# Setup Guide

This guide will help you set up and run the Job Importer application.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
- **Redis** - [Download](https://redis.io/download) or use [Redis Cloud](https://redis.com/try-free/) (free tier available)

## Step-by-Step Setup

### 1. Clone and Navigate

```bash
cd /home/dell/test-task-knovator
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Install Client Dependencies

```bash
cd ../client
npm install
```

### 4. Configure Environment Variables

#### Server Configuration

Create `server/.env` file:

```bash
cd ../server
cat > .env << EOF
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/job_importer
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
WORKER_CONCURRENCY=5
BATCH_SIZE=100
JOB_FETCH_INTERVAL=0 * * * *
EOF
```

**For MongoDB Atlas:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/job_importer
```

**For Redis Cloud:**
```
REDIS_HOST=your-redis-host.redis.cloud
REDIS_PORT=12345
REDIS_PASSWORD=your-redis-password
```

#### Client Configuration (Optional)

Create `client/.env.local` file:

```bash
cd ../client
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
```

### 5. Start MongoDB

**Local MongoDB:**
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# Or run directly
mongod
```

**MongoDB Atlas:**
- No local setup needed, just use the connection string in `.env`

### 6. Start Redis

**Local Redis:**
```bash
# On macOS with Homebrew
brew services start redis

# On Linux
sudo systemctl start redis

# Or run directly
redis-server
```

**Redis Cloud:**
- No local setup needed, just use the connection details in `.env`

### 7. Start the Application

You'll need **3 terminal windows/tabs**:

#### Terminal 1: Backend Server
```bash
cd server
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
✅ Redis connected successfully
⏰ Scheduling job fetch with cron: 0 * * * *
✅ Scheduler initialized
🚀 Server running on port 3001
```

#### Terminal 2: Worker Process
```bash
cd server
npm run worker
```

You should see:
```
✅ MongoDB connected successfully
✅ Redis connected successfully
🚀 Job processor worker started with concurrency: 5
```

#### Terminal 3: Frontend
```bash
cd client
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000
- Local:        http://localhost:3000
```

### 8. Access the Application

- **Frontend UI**: Open [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Health Check**: [http://localhost:3001/health](http://localhost:3001/health)

### 9. Test the Application

1. **Trigger an Import**:
   - Click the "Trigger Import" button in the UI
   - Or use curl:
     ```bash
     curl -X POST http://localhost:3001/api/import/trigger
     ```

2. **View Import History**:
   - The UI will automatically show import history
   - Or use curl:
     ```bash
     curl http://localhost:3001/api/import/history
     ```

3. **Check Statistics**:
   ```bash
   curl http://localhost:3001/api/import/stats
   ```

## Troubleshooting

### MongoDB Connection Issues

**Error**: `MongoServerError: Authentication failed`

**Solution**: 
- Check your MongoDB connection string
- Ensure MongoDB is running
- For MongoDB Atlas, check your IP whitelist

### Redis Connection Issues

**Error**: `Error: connect ECONNREFUSED`

**Solution**:
- Ensure Redis is running: `redis-cli ping` (should return `PONG`)
- Check Redis host and port in `.env`
- For Redis Cloud, verify credentials

### Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:
- Change the PORT in `server/.env`
- Or kill the process using the port:
  ```bash
  # Find process
  lsof -i :3001
  # Kill process
  kill -9 <PID>
  ```

### Worker Not Processing Jobs

**Solution**:
- Ensure worker is running in a separate terminal
- Check Redis connection
- Verify MongoDB connection
- Check worker logs for errors

### No Jobs Imported

**Solution**:
- Check if APIs are accessible (some may require VPN or have rate limits)
- Check server logs for API fetch errors
- Verify XML parsing is working correctly

## Production Deployment

### Using Docker

1. Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
  
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

volumes:
  mongodb_data:
```

2. Build and run:
```bash
docker-compose up -d
```

### Using Cloud Services

**Backend (Render/Vercel)**:
1. Connect your GitHub repository
2. Set environment variables
3. Deploy

**Frontend (Vercel)**:
1. Connect your GitHub repository
2. Set `NEXT_PUBLIC_API_URL` to your backend URL
3. Deploy

## Next Steps

- Review the [Architecture Documentation](./docs/architecture.md)
- Check the [Main README](./README.md) for API documentation
- Customize job feed URLs in `server/src/services/jobApiService.js`
- Adjust worker concurrency in `.env`

## Support

For issues or questions:
1. Check the logs in each terminal
2. Review the architecture documentation
3. Check MongoDB and Redis connections
4. Verify environment variables are set correctly

