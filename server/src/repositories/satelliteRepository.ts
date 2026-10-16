import initSqlJs from 'sql.js';
import type { Satellite, QualityCheck } from '../schemas/types.js';
import { BaseRepository } from './baseRepository.js';
import { saveDatabase } from '../database/schema.js';

export class SatelliteRepository extends BaseRepository {
  constructor(db: initSqlJs.Database) {
    super(db);
  }

  findAll(limit: number = 100, offset: number = 0): Satellite[] {
    return this.all(
      'SELECT * FROM satellites ORDER BY name ASC LIMIT ? OFFSET ?',
      [limit, offset]
    ) as Satellite[];
  }

  findById(id: string): Satellite | undefined {
    return this.get('SELECT * FROM satellites WHERE id = ?', [id]) as Satellite | undefined;
  }

  findByNoradId(noradCatId: number): Satellite | undefined {
    return this.get('SELECT * FROM satellites WHERE norad_cat_id = ?', [noradCatId]) as Satellite | undefined;
  }

  search(query: string, limit: number = 50): Satellite[] {
    const pattern = `%${query}%`;
    return this.all(
      'SELECT * FROM satellites WHERE name LIKE ? OR object_id LIKE ? or CAST(norad_cat_id AS TEXT) LIKE ? ORDER BY name ASC LIMIT ?',
      [pattern, pattern, pattern, limit]
    ) as Satellite[];
  }

  count(): number {
    const result = this.get('SELECT COUNT(*) as count FROM satellites');
    return result?.count || 0;
  }

  create(satellite: Omit<Satellite, 'createdAt' | 'updatedAt'>): Satellite {
    const now = new Date().toISOString();
    const result = this.run(
      `INSERT INTO satellites (
        id, name, norad_cat_id, object_id, regime, altitude, velocity,
        inclination, eccentricity, status, operator, object_type, owner_code,
        launch_date, epoch_utc, retrieved_at_utc, record_age_hours,
        freshness_category, semi_major_axis_km, approx_altitude_km,
        approx_velocity_km_s, orbital_period_min, covariance_available,
        quality_score, raw_omm, satcat_metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        satellite.id,
        satellite.name,
        satellite.noradCatId,
        satellite.objectId || null,
        satellite.regime,
        satellite.altitude || null,
        satellite.velocity || null,
        satellite.inclination || null,
        satellite.eccentricity || null,
        satellite.status,
        satellite.operator,
        satellite.objectType || null,
        satellite.ownerCode || null,
        satellite.launchDate || null,
        satellite.epochUtc,
        satellite.retrievedAtUtc,
        satellite.recordAgeHours || null,
        satellite.freshnessCategory,
        satellite.semiMajorAxisKm || null,
        satellite.approxAltitudeKm || null,
        satellite.approxVelocityKmS || null,
        satellite.orbitalPeriodMin || null,
        satellite.covarianceAvailable ? 1 : 0,
        satellite.qualityScore,
        satellite.rawOmm ? JSON.stringify(satellite.rawOmm) : null,
        satellite.satcatMetadata ? JSON.stringify(satellite.satcatMetadata) : null,
      ]
    );

    console.log(`Insert result for ${satellite.name}:`, result);

    const found = this.findById(satellite.id);
    if (!found) {
      console.error(`Failed to find satellite after insert: ${satellite.id}`);
    }
    return found!;
  }

  update(id: string, updates: Partial<Satellite>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      if (key === 'rawOmm' || key === 'satcatMetadata') {
        fields.push(`${this.camelToSnake(key)} = ?`);
        values.push(JSON.stringify(value));
      } else if (key === 'covarianceAvailable') {
        fields.push('covariance_available = ?');
        values.push(value ? 1 : 0);
      } else {
        fields.push(`${this.camelToSnake(key)} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const result = this.run(`UPDATE satellites SET ${fields.join(', ')} WHERE id = ?`, values);
    return result > 0;
  }

  delete(id: string): boolean {
    const result = this.run('DELETE FROM satellites WHERE id = ?', [id]);
    return result > 0;
  }

  getQualityChecks(satelliteId: string): QualityCheck[] {
    return this.all('SELECT * FROM quality_checks WHERE satellite_id = ?', [satelliteId]) as QualityCheck[];
  }
}
