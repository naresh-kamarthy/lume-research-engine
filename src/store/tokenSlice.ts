import { StateCreator } from 'zustand';
import type { TokenWallet } from './types';

export interface TokenSlice {
    tokenWallet: TokenWallet;
    sessionCost: number;

    addTokens: (input: number, output: number) => void;
    addTavilyCredits: (type: 'basic' | 'advanced') => void;
    addSessionCost: (amount: number) => void;
    incrementMockRequests: () => void;
    calculateTotalCost: () => number;
    calculateResilienceSaved: () => number;
}

// Gemini 3 Flash pricing (March 2026)
const FLASH_INPUT_RATE = 0.125 / 1_000_000;
const FLASH_OUTPUT_RATE = 0.75 / 1_000_000;
const TAVILY_BASIC_RATE = 0.008;
const TAVILY_ADVANCED_RATE = 0.016;
const MOCK_AVG_INPUT_TOKENS = 1_000;
const MOCK_AVG_OUTPUT_TOKENS = 500;

const DEFAULT_WALLET: TokenWallet = {
    inputTokens: 0,
    outputTokens: 0,
    tavilyBasicCredits: 0,
    tavilyAdvancedCredits: 0,
    mockRequestsServed: 0,
};

export const createTokenSlice: StateCreator<TokenSlice, [], [], TokenSlice> = (set, get) => ({
    tokenWallet: DEFAULT_WALLET,
    sessionCost: 0,

    addTokens: (input, output) =>
        set((state) => ({
            tokenWallet: {
                ...state.tokenWallet,
                inputTokens: state.tokenWallet.inputTokens + input,
                outputTokens: state.tokenWallet.outputTokens + output,
            },
        })),

    addTavilyCredits: (type) =>
        set((state) => ({
            tokenWallet: {
                ...state.tokenWallet,
                tavilyBasicCredits:
                    state.tokenWallet.tavilyBasicCredits + (type === 'basic' ? 1 : 0),
                tavilyAdvancedCredits:
                    state.tokenWallet.tavilyAdvancedCredits + (type === 'advanced' ? 1 : 0),
            },
        })),

    addSessionCost: (amount) =>
        set((state) => ({
            sessionCost: Number((state.sessionCost + amount).toFixed(6)),
        })),

    incrementMockRequests: () =>
        set((state) => ({
            tokenWallet: {
                ...state.tokenWallet,
                mockRequestsServed: state.tokenWallet.mockRequestsServed + 1,
            },
        })),

    calculateTotalCost: () => {
        const { tokenWallet, sessionCost } = get();
        const flashInputCost = tokenWallet.inputTokens * FLASH_INPUT_RATE;
        const flashOutputCost = tokenWallet.outputTokens * FLASH_OUTPUT_RATE;
        const tavilyCost =
            tokenWallet.tavilyBasicCredits * TAVILY_BASIC_RATE +
            tokenWallet.tavilyAdvancedCredits * TAVILY_ADVANCED_RATE;
        return Number((flashInputCost + flashOutputCost + tavilyCost + sessionCost).toFixed(6));
    },

    calculateResilienceSaved: () => {
        const { tokenWallet } = get();
        const costPerMockRequest =
            MOCK_AVG_INPUT_TOKENS * FLASH_INPUT_RATE +
            MOCK_AVG_OUTPUT_TOKENS * FLASH_OUTPUT_RATE +
            TAVILY_BASIC_RATE;
        return Number((tokenWallet.mockRequestsServed * costPerMockRequest).toFixed(6));
    },
});
