import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { initializeDatabase, saveDatabase, getDatabaseInstance } from './database/schema.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (without sensitive data)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Initialize database and attach to app
let db: any;
initializeDatabase().then((database) => {
  db = database;
  app.set('db', db);
  console.log('Database initialized');
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

// Save database periodically and on shutdown
const saveInterval = setInterval(() => {
  if (db) {
    saveDatabase(db, config.databasePath);
  }
}, 30000); // Save every 30 seconds

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    name: 'VIGIL Backend API',
    version: '1.0.0',
    description: 'Orbital Evidence & Uncertainty Auditor API',
    endpoints: {
      health: '/api/health',
      overview: '/api/overview',
      satellites: {
        list: '/api/satellites',
        detail: '/api/satellites/:id',
        trajectory: '/api/satellites/:id/trajectory',
      },
      data: {
        sources: '/api/data/sources',
        quality: '/api/data/quality',
        manifest: '/api/data/manifest',
      },
      simulations: {
        list: '/api/simulations',
        create: '/api/simulations',
        detail: '/api/simulations/:id',
        run: '/api/simulations/:id/run',
        reset: '/api/simulations/:id/reset',
        states: '/api/simulations/:id/states',
      },
      audit: {
        logs: '/api/audit-logs',
        evidenceGaps: '/api/evidence-gaps',
      },
    },
    documentation: 'See README.md for detailed usage',
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  clearInterval(saveInterval);
  if (db) {
    saveDatabase(db, config.databasePath);
  }
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
