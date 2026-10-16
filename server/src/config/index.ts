import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

function resolveCorsOrigin(): string | string[] {
  const fromEnv = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === 'production') {
    return fromEnv.length === 1 ? fromEnv[0] : fromEnv.length > 1 ? fromEnv : DEFAULT_CORS_ORIGINS[0];
  }

  return [...new Set([...DEFAULT_CORS_ORIGINS, ...fromEnv])];
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: resolveCorsOrigin(),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  databasePath: process.env.DATABASE_PATH || './data/vigil.db',
  simulationDefaultSpeed: parseInt(process.env.SIMULATION_DEFAULT_SPEED || '1', 10),
  simulationMaxSpeed: parseInt(process.env.SIMULATION_MAX_SPEED || '100', 10),
};
