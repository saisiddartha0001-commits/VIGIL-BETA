#!/usr/bin/env tsx
import { seedDatabase } from '../database/seed.js';

seedDatabase().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
