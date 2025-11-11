# Server Setup

## Environment Variables

Create a `.env` file in the server directory:

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

## Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

3. Start the worker (in a separate terminal):
   ```bash
   npm run worker
   ```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run worker` - Start the job processor worker

