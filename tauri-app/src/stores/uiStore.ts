import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  backgroundImage: string | null;
  setBackgroundImage: (url: string | null) => void;
  clearBackgroundImage: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      backgroundImage: null,
      setBackgroundImage: (url) => set({ backgroundImage: url }),
      clearBackgroundImage: () => set({ backgroundImage: null }),
    }),
    {
      name: "ui-storage",
    }
  )
);