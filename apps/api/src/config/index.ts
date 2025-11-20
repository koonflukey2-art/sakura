import { logger } from '../utils/logger';

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    allowedOrigins: string[];
  };
  ai: {
    openaiApiKey?: string;
    geminiApiKey?: string;
  };
}

// Generate a random JWT secret for development
const generateDevSecret = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// Validate and get JWT secret
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET is required in production. Please set JWT_SECRET environment variable.'
      );
    }

    // In development, generate a random secret and warn
    const devSecret = generateDevSecret();
    logger.warn('⚠️  JWT_SECRET not found in .env file!');
    logger.warn('⚠️  Using auto-generated secret for development.');
    logger.warn('⚠️  For production, set JWT_SECRET in your .env file!');
    logger.warn(`⚠️  Generated secret: ${devSecret.substring(0, 16)}...`);

    return devSecret;
  }

  // Warn if using the example secret
  if (secret === 'your-super-secret-jwt-key-change-this-in-production') {
    logger.warn('⚠️  You are using the default JWT_SECRET from .env.example!');
    logger.warn('⚠️  Please change JWT_SECRET to a secure random value!');
  }

  return secret;
};

// Load and validate configuration
const loadConfig = (): Config => {
  // Ensure database URL is set
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Please set it in your .env file.');
  }

  const config: Config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL,
    jwt: {
      secret: getJwtSecret(),
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    },
    ai: {
      openaiApiKey: process.env.OPENAI_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
    },
  };

  return config;
};

export const config = loadConfig();
