import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkspaceStore } from '../store';

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    const { resetSession } = useWorkspaceStore.getState();
    resetSession();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const state = useWorkspaceStore.getState();
      expect(state.isHealing).toBe(false);
      expect(state.systemHealth).toBe('healthy');
      expect(state.currentTheme).toBe('emerald');
      expect(state.dataSource).toBe('live');
      expect(state.sessionCost).toBe(0);
      expect(state.tokenWallet.inputTokens).toBe(0);
    });
  });

  describe('Resilience Protocol (Branch Testing)', () => {
    it('Emerald Path: should be healthy when setHealing(false)', () => {
      const { setHealing } = useWorkspaceStore.getState();
      setHealing(false);

      const state = useWorkspaceStore.getState();
      expect(state.isHealing).toBe(false);
      expect(state.systemHealth).toBe('healthy');
      expect(state.currentTheme).toBe('emerald');
      expect(state.dataSource).toBe('live');
    });

    it('Amber Path (429): should trigger healing on 429 error', () => {
      const { setApiError } = useWorkspaceStore.getState();
      setApiError(429);

      const state = useWorkspaceStore.getState();
      expect(state.isHealing).toBe(true);
      expect(state.systemHealth).toBe('healing');
      expect(state.currentTheme).toBe('amber');
      expect(state.dataSource).toBe('mock');
      expect(state.lastError).toContain('429');
    });

    it('Amber Path (500): should trigger healing on 500 error', () => {
      const { setApiError } = useWorkspaceStore.getState();
      setApiError(500);

      const state = useWorkspaceStore.getState();
      expect(state.isHealing).toBe(true);
      expect(state.systemHealth).toBe('healing');
      expect(state.currentTheme).toBe('amber');
      expect(state.dataSource).toBe('mock');
    });

    it('Amber Path (432): should trigger healing on 432 error (Quota)', () => {
      const { setApiError } = useWorkspaceStore.getState();
      setApiError(432);

      const state = useWorkspaceStore.getState();
      expect(state.isHealing).toBe(true);
      expect(state.systemHealth).toBe('healing');
    });

    it('Red Path: should set error status for other errors (e.g., 401)', () => {
      const { setApiError } = useWorkspaceStore.getState();
      setApiError(401);

      const state = useWorkspaceStore.getState();
      expect(state.isHealing).toBe(false);
      expect(state.systemHealth).toBe('error');
      expect(state.currentTheme).toBe('emerald');
      expect(state.dataSource).toBe('live');
    });

    it('Recovery Path: should transition back to healthy from healing', () => {
      const store = useWorkspaceStore.getState();
      store.setHealing(true); // Manually enter healing
      expect(useWorkspaceStore.getState().isHealing).toBe(true);

      store.setRecovery('online'); // Trigger recovery

      const state = useWorkspaceStore.getState();
      expect(state.isHealing).toBe(false);
      expect(state.systemHealth).toBe('healthy');
      expect(state.lastError).toBe(null);
    });

    it('Recovery Path: should do nothing if status is not online', () => {
      const store = useWorkspaceStore.getState();
      store.setHealing(true);
      store.setRecovery('offline' as any);
      expect(useWorkspaceStore.getState().isHealing).toBe(true);
    });
  });

  describe('FinOps & State (Statement & Function Coverage)', () => {
    it('Calculator Logic: should handle precision in addSessionCost', () => {
      const { addSessionCost } = useWorkspaceStore.getState();
      addSessionCost(0.000125);
      addSessionCost(0.00075);

      const state = useWorkspaceStore.getState();
      // 0.000125 + 0.00075 = 0.000875
      expect(state.sessionCost).toBe(0.000875);
    });

    it('Calculator Logic: should calculate total cost across providers', () => {
      const store = useWorkspaceStore.getState();
      store.addTokens(1000000, 1000000); // Input: $0.125, Output: $0.75
      store.addTavilyCredits('basic'); // $0.008
      store.addTavilyCredits('advanced'); // $0.016
      store.addSessionCost(0.1);

      // Total = 0.125 + 0.75 + 0.008 + 0.016 + 0.1 = 0.999
      expect(store.calculateTotalCost()).toBe(0.999);
    });

    it('Resilience Metrics: should calculate saved costs from mock requests', () => {
      const store = useWorkspaceStore.getState();
      store.incrementMockRequests(); // 1 mock request

      // per mock saved: (1000/1M * 0.125) + (500/1M * 0.75) + 0.008
      // = 0.000125 + 0.000375 + 0.008 = 0.0085
      expect(store.calculateResilienceSaved()).toBe(0.0085);
    });

    it('Atomic Reset: should purge localStorage and reset state', () => {
      const store = useWorkspaceStore.getState();
      localStorage.setItem('lume_test', 'dirty');
      store.setHealing(true);
      store.addTokens(100, 100);

      store.resetSession();

      const state = useWorkspaceStore.getState();
      expect(state.isHealing).toBe(false);
      expect(state.tokenWallet.inputTokens).toBe(0);
      expect(localStorage.getItem('lume_test')).toBe(null);
    });

    it('Pinning Logic: should toggle items being pinned', () => {
      const store = useWorkspaceStore.getState();
      const mockItem = { id: 'test-1', title: 'Test' } as any;

      // Pin
      store.pinResearch(mockItem);
      expect(useWorkspaceStore.getState().pinnedResearch).toHaveLength(1);
      expect(JSON.parse(localStorage.getItem('lume_pinned_research') || '[]')).toHaveLength(1);

      // Duplicate Pin (should ignore)
      store.pinResearch(mockItem);
      expect(useWorkspaceStore.getState().pinnedResearch).toHaveLength(1);

      // Unpin
      store.unpinResearch('test-1');
      expect(useWorkspaceStore.getState().pinnedResearch).toHaveLength(0);
      expect(JSON.parse(localStorage.getItem('lume_pinned_research') || '[]')).toHaveLength(0);
    });
  });

  describe('Utility Actions', () => {
    it('should handleNewSession via reset', () => {
      const store = useWorkspaceStore.getState();
      const spy = vi.spyOn(store, 'resetSession');
      store.handleNewSession();
      expect(spy).toHaveBeenCalled();
    });

    it('should set throughput', () => {
      const { setThroughput } = useWorkspaceStore.getState();
      setThroughput(500);
      expect(useWorkspaceStore.getState().throughput).toBe(500);
    });

    it('should set results', () => {
      const { setResults } = useWorkspaceStore.getState();
      setResults([{ id: '1' } as any]);
      expect(useWorkspaceStore.getState().results).toHaveLength(1);
    });

    it('should set active provider', () => {
      const { setActiveProvider } = useWorkspaceStore.getState();
      setActiveProvider('gemini-grounding');
      expect(useWorkspaceStore.getState().activeProvider).toBe('gemini-grounding');
    });

    it('should set deep dive', () => {
      const { setDeepDive } = useWorkspaceStore.getState();
      setDeepDive(true);
      expect(useWorkspaceStore.getState().isDeepDive).toBe(true);
    });

    it('should set system health directly', () => {
      const { setSystemHealth } = useWorkspaceStore.getState();
      setSystemHealth('error');
      expect(useWorkspaceStore.getState().systemHealth).toBe('error');
    });
  });
});
