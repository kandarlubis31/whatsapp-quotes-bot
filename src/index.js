import express from 'express';
import config from './config/config.js';
import logger from './utils/logger.js';
import { startScheduler } from './services/schedulerService.js';

const app = express();
const port = config.port;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
  startScheduler();
});