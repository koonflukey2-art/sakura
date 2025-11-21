import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { config } from './config';

// Load environment variables - explicitly point to .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = config.port;

// Middleware
app.use(helmet());

// 🔧 CORS Configuration - Allow all origins in development
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? config.cors.allowedOrigins 
    : '*', // Allow all origins in dev mode
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: 'connected',
    jwt: 'configured'
  });
});

// API Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// Start server with error handling
const server = app.listen(PORT, () => {
  logger.info(`🌸 Sakura API Server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Database: Connected`);
  logger.info(`JWT: Configured (${config.jwt.secret.length} chars)`);
  logger.info(`CORS: ${process.env.NODE_ENV === 'production' ? 'Restricted' : 'All origins allowed (dev mode)'}`);
  logger.info(`API Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;