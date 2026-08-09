import Dexie, { Table } from 'dexie';
import type { LogEntry } from '../types/tauri';

class LogDatabase extends Dexie {
  logs!: Table<LogEntry, number>;

  constructor() {
    super('MCLogDB');
    this.version(1).stores({
      logs: '++id, time, level, content',
    });
    this.logs = this.table('logs');
  }

  async bulkAdd(logs: LogEntry[]) {
    if (logs.length === 0) return;
    await this.logs.bulkAdd(logs);
  }

  async clear() {
    await this.logs.clear();
  }

  async count() {
    return await this.logs.count();
  }

  async getFilteredPaginated(filter: string, page: number, pageSize: number) {
    let query = this.logs.orderBy('id');
    if (filter.trim()) {
      // 按 content 前缀过滤
      query = this.logs.where('content').startsWithIgnoreCase(filter) as any;
    }
    const total = await query.count();
    const data = await query
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    return { data, total };
  }
}

export const db = new LogDatabase();