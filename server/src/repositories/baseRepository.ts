import initSqlJs from 'sql.js';

export class BaseRepository {
  constructor(protected db: initSqlJs.Database) {}

  protected run(sql: string, params: any[] = []): initSqlJs.RunResult {
    // Filter out undefined values
    const cleanParams = params.map(p => p === undefined ? null : p);
    return this.db.run(sql, cleanParams);
  }

  protected get(sql: string, params: any[] = []): any {
    const cleanParams = params.map(p => p === undefined ? null : p);
    const stmt = this.db.prepare(sql);
    stmt.bind(cleanParams);
    const result = stmt.getAsObject();
    stmt.free();
    return result;
  }

  protected all(sql: string, params: any[] = []): any[] {
    const cleanParams = params.map(p => p === undefined ? null : p);
    const stmt = this.db.prepare(sql);
    stmt.bind(cleanParams);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  protected camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
