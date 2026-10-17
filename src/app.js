import express from 'express';
import logger from './middleware/logger.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();

app.use(logger);
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'TaskFlow API is running.',
  });
});

app.use('/tasks', taskRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint not found.',
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Invalid JSON body.',
    });
  }

  const status = err.status || 500;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    message: status >= 500 ? 'Internal server error.' : err.message,
  });
});

export default app;
