import initSqlJs from 'sql.js';
import type { Simulation, SimulationState } from '../schemas/types.js';
import { BaseRepository } from './baseRepository.js';
import { saveDatabase } from '../database/schema.js';

export class SimulationRepository extends BaseRepository {
  constructor(db: initSqlJs.Database) {
    super(db);
  }

  findAll(limit: number = 50, offset: number = 0): Simulation[] {
    return this.all(
      'SELECT * FROM simulations ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    ) as Simulation[];
  }

  findById(id: string): Simulation | undefined {
    return this.get('SELECT * FROM simulations WHERE id = ?', [id]) as Simulation | undefined;
  }

  findBySatelliteId(satelliteId: string): Simulation[] {
    return this.all(
      'SELECT * FROM simulations WHERE satellite_id = ? ORDER BY created_at DESC',
      [satelliteId]
    ) as Simulation[];
  }

  create(simulation: Omit<Simulation, 'createdAt' | 'updatedAt'>): Simulation {
    const now = new Date().toISOString();
    this.run(
      `INSERT INTO simulations (
        id, name, satellite_id, status, current_timestamp_utc,
        simulation_start_utc, simulation_end_utc, time_step_seconds,
        propagation_method, random_seed, speed_multiplier, parameters
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        simulation.id,
        simulation.name,
        simulation.satelliteId,
        simulation.status,
        simulation.currentTimestampUtc,
        simulation.simulationStartUtc,
        simulation.simulationEndUtc,
        simulation.timeStepSeconds,
        simulation.propagationMethod,
        simulation.randomSeed,
        simulation.speedMultiplier,
        JSON.stringify(simulation.parameters),
      ]
    );

    return this.findById(simulation.id)!;
  }

  update(id: string, updates: Partial<Simulation>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      if (key === 'parameters') {
        fields.push('parameters = ?');
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${this.camelToSnake(key)} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const result = this.run(`UPDATE simulations SET ${fields.join(', ')} WHERE id = ?`, values);
    return result > 0;
  }

  delete(id: string): boolean {
    // Delete associated states first
    this.run('DELETE FROM simulation_states WHERE simulation_id = ?', [id]);

    const result = this.run('DELETE FROM simulations WHERE id = ?', [id]);
    return result > 0;
  }

  saveStates(states: Omit<SimulationState, 'createdAt'>[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO simulation_states (
        id, simulation_id, timestamp_utc, position_x, position_y, position_z,
        velocity_x, velocity_y, velocity_z, altitude_km, speed_km_s, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const state of states) {
      stmt.bind([
        state.id,
        state.simulationId,
        state.timestampUtc,
        state.positionX,
        state.positionY,
        state.positionZ,
        state.velocityX,
        state.velocityY,
        state.velocityZ,
        state.altitudeKm,
        state.speedKmS,
        JSON.stringify(state.metadata),
      ]);
      stmt.step();
      stmt.reset();
    }

    stmt.free();
  }

  getStates(simulationId: string, limit: number = 1000): SimulationState[] {
    return this.all(
      'SELECT * FROM simulation_states WHERE simulation_id = ? ORDER BY timestamp_utc ASC LIMIT ?',
      [simulationId, limit]
    ) as SimulationState[];
  }
}
