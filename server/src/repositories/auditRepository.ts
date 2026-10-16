import initSqlJs from 'sql.js';
import type { AuditLog, EvidenceGap, DataSource } from '../schemas/types.js';
import { BaseRepository } from './baseRepository.js';

export class AuditRepository extends BaseRepository {
  constructor(db: initSqlJs.Database) {
    super(db);
  }

  // Audit Logs
  findAuditLogs(limit: number = 100, offset: number = 0): AuditLog[] {
    return this.all(
      'SELECT * FROM audit_logs ORDER BY timestamp_utc DESC LIMIT ? OFFSET ?',
      [limit, offset]
    ) as AuditLog[];
  }

  createAuditLog(log: Omit<AuditLog, 'createdAt'>): AuditLog {
    this.run(
      'INSERT INTO audit_logs (id, timestamp_utc, operator, action, category, details) VALUES (?, ?, ?, ?, ?, ?)',
      [log.id, log.timestampUtc, log.operator, log.action, log.category, log.details]
    );

    return this.get('SELECT * FROM audit_logs WHERE id = ?', [log.id]) as AuditLog;
  }

  // Evidence Gaps
  findEvidenceGaps(limit: number = 50, offset: number = 0): EvidenceGap[] {
    return this.all(
      'SELECT * FROM evidence_gaps ORDER BY detection_timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset]
    ) as EvidenceGap[];
  }

  findEvidenceGapById(id: string): EvidenceGap | undefined {
    return this.get('SELECT * FROM evidence_gaps WHERE id = ?', [id]) as EvidenceGap | undefined;
  }

  createEvidenceGap(gap: Omit<EvidenceGap, 'createdAt' | 'updatedAt'>): EvidenceGap {
    this.run(
      `INSERT INTO evidence_gaps (
        id, title, severity, category, affected_objects, description,
        why_it_matters, recommended_action, impact_on_verdict,
        detection_timestamp, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        gap.id,
        gap.title,
        gap.severity,
        gap.category,
        gap.affectedObjects,
        gap.description,
        gap.whyItMatters,
        gap.recommendedAction,
        gap.impactOnVerdict,
        gap.detectionTimestamp,
        gap.status,
      ]
    );

    return this.get('SELECT * FROM evidence_gaps WHERE id = ?', [gap.id]) as EvidenceGap;
  }

  updateEvidenceGap(id: string, updates: Partial<EvidenceGap>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      fields.push(`${this.camelToSnake(key)} = ?`);
      values.push(value);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const result = this.run(`UPDATE evidence_gaps SET ${fields.join(', ')} WHERE id = ?`, values);
    return result > 0;
  }

  // Data Sources
  findDataSources(limit: number = 50): DataSource[] {
    return this.all(
      'SELECT * FROM data_sources ORDER BY retrieved_at_utc DESC LIMIT ?',
      [limit]
    ) as DataSource[];
  }

  findDataSourceById(id: string): DataSource | undefined {
    return this.get('SELECT * FROM data_sources WHERE id = ?', [id]) as DataSource | undefined;
  }

  createDataSource(source: Omit<DataSource, 'createdAt' | 'updatedAt'>): DataSource {
    this.run(
      `INSERT INTO data_sources (
        id, source_name, source_type, url, retrieved_at_utc, record_count,
        content_type, http_status, sha256, is_cached, caching_policy,
        next_recommended_refresh_utc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        source.id,
        source.sourceName,
        source.sourceType,
        source.url,
        source.retrievedAtUtc,
        source.recordCount,
        source.contentType,
        source.httpStatus,
        source.sha256,
        source.isCached ? 1 : 0,
        source.cachingPolicy,
        source.nextRecommendedRefreshUtc,
      ]
    );

    return this.get('SELECT * FROM data_sources WHERE id = ?', [source.id]) as DataSource;
  }
}
