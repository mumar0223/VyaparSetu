"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
    activeLanguage: string;
    sidebarOpen: boolean;
    setLanguage: (lang: string) => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            activeLanguage: "en",
            sidebarOpen: false,
            setLanguage: (lang) => set({ activeLanguage: lang }),
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
        }),
        {
            name: "vyaparsetu-settings",
            partialize: (state) => ({ activeLanguage: state.activeLanguage }), // only persist language
        }
    )
);
