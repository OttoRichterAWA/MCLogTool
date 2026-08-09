import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ModStore {
  mods: string[];              // 模组库
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setMods: (mods: string[]) => void;     // 完全覆盖（用于清空后重置）
  addMods: (newMods: string[]) => void;  // 追加并去重
  clearMods: () => void;
}

export const useModStore = create<ModStore>()(
  persist(
    (set) => ({
      mods: [],
      loading: false,
      setLoading: (loading) => set({ loading }),
      setMods: (mods) => set({ mods }),
      addMods: (newMods) =>
        set((state) => {
          const combined = [...state.mods, ...newMods];
          const unique = Array.from(new Set(combined));
          return { mods: unique };
        }),
      clearMods: () => set({ mods: [] }),
    }),
    {
      name: "mc-mod-storage",
    }
  )
);