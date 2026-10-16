import { initializeDatabase, saveDatabase } from './schema.js';
import { auditOmmRecord } from '../../src/utils/ommQualityAuditor.js';
import { ommRecordToOrbitalObject } from '../../src/utils/ommTransform.js';
import celestrakSnapshot from '../../src/data/celestrakSnapshot.json';
import satcatSnapshot from '../../src/data/satcatSnapshot.json';
import { config } from '../config/index.js';

export async function seedDatabase(): Promise<void> {
  console.log('Seeding database...');

  const db = await initializeDatabase();

  // Clear existing data
  db.run('DELETE FROM quality_checks');
  db.run('DELETE FROM satellites');
  db.run('DELETE FROM evidence_gaps');
  db.run('DELETE FROM audit_logs');
  db.run('DELETE FROM data_sources');

  // Load SATCAT data
  const satcatRecords = satcatSnapshot.records as any[];
  const satcatMap = new Map<number, any>();
  satcatRecords.forEach((s) => satcatMap.set(s.NORAD_CAT_ID, s));

  // Load and audit OMM records
  const celestrakRecords = celestrakSnapshot.records as any[];
  const manifest = celestrakSnapshot.manifest as any;

  // Create data source entry
  db.run(
    `INSERT INTO data_sources (
      id, source_name, source_type, url, retrieved_at_utc, record_count,
      content_type, http_status, sha256, is_cached, caching_policy,
      next_recommended_refresh_utc
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'SRC-CELESTRAK-001',
      manifest.sourceName,
      'CELESTRAK_GP_OMM',
      manifest.exactUrl,
      manifest.retrievedAtUtc,
      manifest.recordCount,
      manifest.contentType,
      manifest.httpStatus,
      manifest.sha256,
      manifest.isCached ? 1 : 0,
      manifest.cachingPolicy,
      manifest.nextRecommendedRefreshUtc,
    ]
  );

  // Process each OMM record
  let satelliteCount = 0;
  for (const record of celestrakRecords) {
    try {
      // Extract raw OMM data from the record structure
      const omm = record.raw || record;
      if (!omm || !omm.OBJECT_NAME) {
        console.error('Skipping invalid record:', record);
        continue;
      }

      // Audit the record
      const audited = auditOmmRecord(omm, manifest.retrievedAtUtc);

      // Transform to satellite object
      const orbitalObject = ommRecordToOrbitalObject(
        audited,
        satelliteCount,
        celestrakRecords.length,
        satcatMap
      );

      // Create satellite in database with direct SQL
      const satelliteId = orbitalObject.id;
      const satcatMetadata = satcatMap.get(audited.noradCatId);

      db.run(
        `INSERT INTO satellites (
          id, name, norad_cat_id, object_id, regime, altitude, velocity,
          inclination, eccentricity, status, operator, object_type, owner_code,
          launch_date, epoch_utc, retrieved_at_utc, record_age_hours,
          freshness_category, semi_major_axis_km, approx_altitude_km,
          approx_velocity_km_s, orbital_period_min, covariance_available,
          quality_score, raw_omm, satcat_metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          satelliteId,
          orbitalObject.name,
          audited.noradCatId,
          audited.objectId || null,
          orbitalObject.regime,
          orbitalObject.altitude || null,
          orbitalObject.velocity || null,
          orbitalObject.inclination || null,
          orbitalObject.eccentricity || null,
          orbitalObject.status,
          orbitalObject.operator,
          orbitalObject.objectType || null,
          orbitalObject.ownerCode || null,
          orbitalObject.launchDate || null,
          audited.epochUtc,
          audited.retrievedAtUtc,
          audited.recordAgeHours || null,
          audited.freshnessCategory,
          audited.semiMajorAxisKm || null,
          audited.approxAltitudeKm || null,
          audited.approxVelocityKmS || null,
          audited.orbitalPeriodMin || null,
          audited.covarianceAvailable ? 1 : 0,
          audited.qualityScore,
          audited.raw ? JSON.stringify(audited.raw) : null,
          satcatMetadata ? JSON.stringify(satcatMetadata) : null,
        ]
      );

      // Create quality checks
      for (const check of audited.checks) {
        db.run(
          `INSERT INTO quality_checks (
            id, satellite_id, check_id, label, category, status, details, measured_value, threshold
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `CHK-${satelliteId}-${check.id}`,
            satelliteId,
            check.id,
            check.label,
            check.category,
            check.status,
            check.details,
            check.measuredValue?.toString() || null,
            check.threshold || null,
          ]
        );
      }

      satelliteCount++;
      console.log(`Processed satellite ${satelliteCount}: ${orbitalObject.name}`);
    } catch (error) {
      console.error(`Error processing satellite:`, error);
    }
  }

  // Create initial evidence gaps
  db.run(
    `INSERT INTO evidence_gaps (
      id, title, severity, category, affected_objects, description,
      why_it_matters, recommended_action, impact_on_verdict,
      detection_timestamp, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'GAP-COVARIANCE-001',
      'Missing Full 6x6 State Covariance Matrix in Public GP/OMM Records',
      'WARNING',
      'MISSING_COVARIANCE',
      'FLEET WIDE',
      'Public CelesTrak GP/OMM element sets provide mean Keplerian elements. Official 6x6 positional and velocity covariance tensors or Conjunction Data Messages (CDMs) are not supplied in GP/OMM formats.',
      'Calculating a mathematically rigorous Collision Probability (PoC) requires an empirical 6x6 error covariance matrix.',
      'Ingest official 18th SDS / Space-Track CDMs before evaluating tactical collision probability.',
      'Blocks automated maneuver approval. Mandates "COLLISION RISK NOT EVALUATED" classification.',
      new Date().toISOString(),
      'OPEN',
    ]
  );

  // Create initial audit log
  db.run(
    'INSERT INTO audit_logs (id, timestamp_utc, operator, action, category, details) VALUES (?, ?, ?, ?, ?, ?)',
    [
      'EVT-SEED-001',
      new Date().toISOString(),
      'SYSTEM-SEEDER',
      'DATABASE_INITIALIZED',
      'INGEST',
      `Seeded database with ${satelliteCount} satellites from CelesTrak snapshot. Quality checks performed.`,
    ]
  );

  // Save database
  saveDatabase(db, config.databasePath);

  console.log(`Database seeded successfully with ${satelliteCount} satellites`);
}
