import { StateCreator } from 'zustand';
import type { ResearchItem } from '../mockResearchLibrary';

const STORAGE_KEY = 'lume_pinned_research';

const loadPinned = (): ResearchItem[] => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
};

export interface ResearchSlice {
    results: ResearchItem[];
    pinnedResearch: ResearchItem[];

    setResults: (results: ResearchItem[]) => void;
    pinResearch: (item: ResearchItem) => void;
    unpinResearch: (id: string) => void;
}

export const createResearchSlice: StateCreator<ResearchSlice, [], [], ResearchSlice> = (set, get) => ({
    results: [],
    pinnedResearch: loadPinned(),

    setResults: (results) => set({ results }),

    pinResearch: (item) => {
        const current = get().pinnedResearch;
        if (current.find((i) => i.id === item.id)) return;
        const updated = [...current, item];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        set({ pinnedResearch: updated });
    },

    unpinResearch: (id) => {
        const updated = get().pinnedResearch.filter((i) => i.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        set({ pinnedResearch: updated });
    },
});
