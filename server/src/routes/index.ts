import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import { getOverview } from '../controllers/overviewController.js';
import {
  listSatellites,
  getSatellite,
  getSatelliteTrajectory,
} from '../controllers/satelliteController.js';
import {
  getDataSources,
  getDataQuality,
  getDataManifest,
} from '../controllers/dataController.js';
import {
  listSimulations,
  getSimulation,
  createSimulation,
  runSimulation,
  resetSimulation,
  getSimulationStates,
} from '../controllers/simulationController.js';
import { getAuditLogs, getEvidenceGaps, updateEvidenceGap } from '../controllers/auditController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Health endpoint (no rate limiting)
router.get('/health', getHealth);

// Overview
router.get('/overview', rateLimiter, getOverview);

// Satellites
router.get('/satellites', rateLimiter, listSatellites);
router.get('/satellites/:id', rateLimiter, getSatellite);
router.get('/satellites/:id/trajectory', rateLimiter, getSatelliteTrajectory);

// Data sources and quality
router.get('/data/sources', rateLimiter, getDataSources);
router.get('/data/quality', rateLimiter, getDataQuality);
router.get('/data/manifest', rateLimiter, getDataManifest);

// Simulations
router.get('/simulations', rateLimiter, listSimulations);
router.post('/simulations', rateLimiter, createSimulation);
router.get('/simulations/:id', rateLimiter, getSimulation);
router.post('/simulations/:id/run', rateLimiter, runSimulation);
router.post('/simulations/:id/reset', rateLimiter, resetSimulation);
router.get('/simulations/:id/states', rateLimiter, getSimulationStates);

// Audit logs and evidence gaps
router.get('/audit-logs', rateLimiter, getAuditLogs);
router.get('/evidence-gaps', rateLimiter, getEvidenceGaps);
router.patch('/evidence-gaps/:id', rateLimiter, updateEvidenceGap);

export default router;
