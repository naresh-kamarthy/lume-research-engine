import { StateCreator } from 'zustand';
import type { ActiveProvider, DataSource, SystemHealth, Theme } from './types';

export interface WorkspaceSlice {
    isHealing: boolean;
    isDeepDive: boolean;
    currentTheme: Theme;
    dataSource: DataSource;
    systemHealth: SystemHealth;
    activeProvider: ActiveProvider;
    throughput: number;
    lastError: string | null;

    setHealing: (healing: boolean) => void;
    setActiveProvider: (provider: ActiveProvider) => void;
    setLastError: (error: string | null) => void;
    setApiError: (status: number) => void;
    setDeepDive: (active: boolean) => void;
    setSystemHealth: (health: SystemHealth) => void;
    setThroughput: (ms: number) => void;
    setRecovery: (apiStatus: 'online' | 'offline') => void;
}

export const createWorkspaceSlice: StateCreator<WorkspaceSlice, [], [], WorkspaceSlice> = (set) => ({
    isHealing: false,
    isDeepDive: false,
    currentTheme: 'emerald',
    dataSource: 'live',
    systemHealth: 'healthy',
    activeProvider: 'tavily',
    throughput: 0,
    lastError: null,

    setHealing: (healing) =>
        set({
            isHealing: healing,
            systemHealth: healing ? 'healing' : 'healthy',
            currentTheme: healing ? 'amber' : 'emerald',
            dataSource: healing ? 'mock' : 'live',
        }),

    setActiveProvider: (provider) => set({ activeProvider: provider }),

    setLastError: (error) => set({ lastError: error }),

    setApiError: (status) => {
        const isHealing = status === 429 || status === 500 || status === 432;
        set({
            lastError: `API Error: ${status}`,
            isHealing,
            systemHealth: isHealing ? 'healing' : 'error',
            currentTheme: isHealing ? 'amber' : 'emerald',
            dataSource: isHealing ? 'mock' : 'live',
        });
    },

    setDeepDive: (active) => set({ isDeepDive: active }),

    setSystemHealth: (health) => set({ systemHealth: health }),

    setThroughput: (ms) => set({ throughput: ms }),

    setRecovery: (apiStatus) => {
        if (apiStatus === 'online') {
            set({
                isHealing: false,
                systemHealth: 'healthy',
                currentTheme: 'emerald',
                dataSource: 'live',
                lastError: null,
            });
        }
    },
});
