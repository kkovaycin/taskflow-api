import express from 'express';
import logger from './middleware/logger.js';
import taskRoutes from './routes/taskRoutes.js';
import cors from 'cors';

const app = express();

const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    }),
);

// Log requests before parsing so malformed JSON requests are recorded too.
app.use(logger);
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'TaskFlow API is running.',
  });
});

app.use('/tasks', taskRoutes);

// Keep the fallback after all routes so it only handles unmatched requests.
app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint not found.',
  });
});

// Register error handling last to catch errors from earlier middleware and routes.
app.use((err, req, res, next) => {
  // Delegate to Express if the response has already started.
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Invalid JSON body.',
    });
  }

  const status = err.status || 500;

  // Log internal error details while keeping them out of client responses.
  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    message: status >= 500 ? 'Internal server error.' : err.message,
  });
});

export default app;
