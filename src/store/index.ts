import { create } from 'zustand';
import { createWorkspaceSlice, type WorkspaceSlice } from './workspaceSlice';
import { createTokenSlice, type TokenSlice } from './tokenSlice';
import { createResearchSlice, type ResearchSlice } from './researchSlice';

// Central combined store type
export type AllSlices = WorkspaceSlice & TokenSlice & ResearchSlice & {
    resetSession: () => void;
    handleNewSession: () => void;
};

export const useWorkspaceStore = create<AllSlices>()((...a) => ({
    ...createWorkspaceSlice(...a),
    ...createTokenSlice(...a),
    ...createResearchSlice(...a),

    // Combined reset: atomically clears all slice state
    resetSession: () => {
        localStorage.clear();
        const [set] = a;
        set({
            isHealing: false,
            isDeepDive: false,
            currentTheme: 'emerald',
            dataSource: 'live',
            systemHealth: 'healthy',
            activeProvider: 'tavily',
            throughput: 0,
            lastError: null,
            tokenWallet: {
                inputTokens: 0,
                outputTokens: 0,
                tavilyBasicCredits: 0,
                tavilyAdvancedCredits: 0,
                mockRequestsServed: 0,
            },
            sessionCost: 0,
            results: [],
            pinnedResearch: [],
        });
    },

    handleNewSession: () => {
        const [, get] = a;
        (get() as AllSlices).resetSession();
    },
}));

// Re-export types for convenience
export type { TokenWallet } from './types';
export type { WorkspaceSlice } from './workspaceSlice';
export type { TokenSlice } from './tokenSlice';
export type { ResearchSlice } from './researchSlice';
