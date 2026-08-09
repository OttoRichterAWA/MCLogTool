import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../db/db';
import type { LogEntry, GroupedLog } from '../types/tauri';

interface LogStore {
  currentPageData: LogEntry[];
  total: number;
  loading: boolean;
  filter: string;
  currentPage: number;
  pageSize: number;
  groups: GroupedLog[];
  expandedGroups: Record<string, boolean>;
  groupMaxDisplay: number;
  importProgress: number;           

  setLoading: (loading: boolean) => void;
  setFilter: (filter: string) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleGroup: (level: string) => void;
  setGroupMaxDisplay: (value: number) => void;
  setImportProgress: (value: number) => void;

  importLogs: (logs: LogEntry[]) => Promise<void>;
  clearLogs: () => Promise<void>;
  refreshCurrentPage: () => Promise<void>;
  refreshGroups: () => Promise<void>;
}

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentPageData: [],
      total: 0,
      loading: false,
      filter: '',
      currentPage: 1,
      pageSize: 25,
      groups: [],
      expandedGroups: {},
      groupMaxDisplay: 200,
      importProgress: 0,

      // 基础 setter
      setLoading: (loading) => set({ loading }),
      setFilter: (filter) => {
        set({ filter, currentPage: 1 });
        get().refreshCurrentPage();
      },
      setCurrentPage: (page) => {
        set({ currentPage: page });
        get().refreshCurrentPage();
      },
      setPageSize: (size) => {
        set({ pageSize: size, currentPage: 1 });
        get().refreshCurrentPage();
      },

      // 分组展开控制
      toggleGroup: (level: string) => {
        const { expandedGroups } = get();
        set({
          expandedGroups: {
            ...expandedGroups,
            [level]: !expandedGroups[level],
          },
        });
      },

      setGroupMaxDisplay: (value) => set({ groupMaxDisplay: value }),
      setImportProgress: (value) => set({ importProgress: value }),

      // 刷新当前页
      refreshCurrentPage: async () => {
        const { filter, currentPage, pageSize } = get();
        set({ loading: true });
        try {
          const { data, total } = await db.getFilteredPaginated(filter, currentPage, pageSize);
          set({ currentPageData: data, total });
        } catch (error) {
          console.error('数据库查询失败:', error);
          set({ currentPageData: [], total: 0 });
        } finally {
          set({ loading: false });
        }
      },

      // 刷新分组
      refreshGroups: async () => {
        try {
          const allLogs = await db.logs.toArray();
          const groupsMap: Record<string, string[]> = {};
          for (const log of allLogs) {
            const level = log.level || 'UNKNOWN';
            if (!groupsMap[level]) groupsMap[level] = [];
            groupsMap[level].push(log.content || '');
          }
          const groups = Object.entries(groupsMap)
            .filter(([level, items]) => level && items.length > 0)
            .map(([level, items]) => ({
              level,
              count: items.length,
              items,
            }));
          set({ groups });
        } catch (error) {
          console.error('分组计算失败:', error);
          set({ groups: [] });
        }
      },

      // ===== 导入日志 =====
      importLogs: async (logs: LogEntry[]) => {
        if (!logs || logs.length === 0) {
          await db.clear();
          set({
            currentPageData: [],
            total: 0,
            groups: [],
            currentPage: 1,
            loading: false,
            importProgress: 0,
          });
          return;
        }

        set({ loading: true, importProgress: 0 });

        try {
          await db.clear();
          const total = logs.length;
          const BATCH_SIZE = 1000;

          for (let i = 0; i < total; i += BATCH_SIZE) {
            const batch = logs.slice(i, i + BATCH_SIZE);
            await db.bulkAdd(batch);
            // 计算进度
            const progress = Math.round(((i + batch.length) / total) * 100);
            set({ importProgress: progress });
            await new Promise(resolve => setTimeout(resolve, 0));
          }

          // 刷新分组和当前页
          await get().refreshGroups();
          set({ currentPage: 1 });
          await get().refreshCurrentPage();
        } catch (error) {
          console.error('导入失败:', error);
          await db.clear();
          set({
            currentPageData: [],
            total: 0,
            groups: [],
            currentPage: 1,
          });
          throw error;
        } finally {
          set({ loading: false, importProgress: 0 });
        }
      },

      // 清空所有数据
      clearLogs: async () => {
        await db.clear();
        set({
          currentPageData: [],
          total: 0,
          groups: [],
          currentPage: 1,
          importProgress: 0,
        });
      },
    }),
    {
      name: 'mc-log-tool-storage',
      partialize: (state) => ({
        pageSize: state.pageSize,
        expandedGroups: state.expandedGroups,
        groupMaxDisplay: state.groupMaxDisplay,
      }),
    }
  )
);