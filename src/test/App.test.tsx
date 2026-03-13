import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { useWorkspaceStore } from '../store';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from './setup';
import { BentoGrid } from '../components/BentoGrid';

// Mock child components correctly
vi.mock('../components/BentoGrid', () => ({
    BentoGrid: vi.fn(() => <div data-testid="bento-grid" />)
}));
vi.mock('../components/FinOpsFooter', () => ({
    FinOpsFooter: () => <div data-testid="finops-footer" />
}));
vi.mock('../components/ResilienceToast', () => ({
    ResilienceToast: () => <div data-testid="resilience-toast" />
}));
vi.mock('../components/Sidebar', () => ({
    Sidebar: () => <div data-testid="sidebar">Sidebar</div>
}));

// Mock react-query to control isPending
vi.mock('@tanstack/react-query', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    };
});

describe('App Orchestration', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, gcTime: 0 } }
        });

        act(() => {
            useWorkspaceStore.getState().resetSession();
            useWorkspaceStore.setState({ isHealing: false, currentTheme: 'emerald' });
        });

        vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');

        server.use(
            http.get('/api/health', () => {
                return HttpResponse.json({ tavilyConfigured: true });
            })
        );

        vi.mocked(BentoGrid).mockImplementation(() => <div data-testid="bento-grid" />);
        vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
    });

    it('renders header and child components with live status', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );

        expect(await screen.findByText(/AGENTIC HYBRID WORKSPACE/i)).toBeInTheDocument();
        expect(await screen.findByTestId('bento-grid')).toBeInTheDocument();
        expect(screen.getByTestId('finops-footer')).toBeInTheDocument();
        expect(await screen.findByText(/SYSTEM LIVE/i)).toBeInTheDocument();
    });

    it('handles diagnostics failure correctly', async () => {
        server.use(
            http.get('/api/health', () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );

        expect(await screen.findByText(/AGENTIC HYBRID WORKSPACE/i)).toBeInTheDocument();
    });

    it('toggles deep dive mode when button is clicked', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );

        const deepDiveBtn = await screen.findByText(/DEEP DIVE/i);
        fireEvent.click(deepDiveBtn);

        expect(useWorkspaceStore.getState().isDeepDive).toBe(true);
    });

    it('triggers session reset when NEW SESSION is clicked', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );

        act(() => {
            useWorkspaceStore.setState({ isDeepDive: true });
        });

        const resetBtn = await screen.findByRole('button', { name: /SESSION|RESETTING/i });

        act(() => {
            fireEvent.click(resetBtn);
        });

        expect(useWorkspaceStore.getState().isDeepDive).toBe(false);
    });

    it('displays self-healing status when triggered', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );

        expect(await screen.findByText(/SYSTEM LIVE/i)).toBeInTheDocument();

        act(() => {
            useWorkspaceStore.getState().setHealing(true);
        });

        expect(await screen.findByText(/SELF-HEALING ACTIVE/i, {}, { timeout: 2000 })).toBeInTheDocument();
    });

    it('triggers deep search retry from BentoGrid with code', async () => {
        vi.mocked(BentoGrid).mockImplementation(({ retryWithDeepSearch, setCode }: any) => (
            <div>
                <button onClick={() => {
                    setCode('This is a test code that exists');
                    retryWithDeepSearch();
                }}>MOCK RETRY WITH CODE</button>
            </div>
        ));

        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );

        const btn = await screen.findByText('MOCK RETRY WITH CODE');
        fireEvent.click(btn);

        expect(useWorkspaceStore.getState().isDeepDive).toBe(true);
    });

    it('triggers context update when debounced code is long', async () => {
        vi.mocked(BentoGrid).mockImplementation(({ setCode }: any) => (
            <input data-testid="real-editor" onChange={(e) => setCode(e.target.value)} />
        ));

        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );

        const editor = screen.getByTestId('real-editor');
        fireEvent.change(editor, { target: { value: '123456789012345678901' } }); // 21 chars

        await act(async () => {
            await new Promise(r => setTimeout(r, 1600));
        });
    });

    it('shows RESETTING status when isPending is true', async () => {
        const { useMutation } = await import('@tanstack/react-query');
        vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn(), isPending: true } as any);

        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );

        expect(screen.getByText('RESETTING...')).toBeInTheDocument();
        vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
    });

    it('hits retryWithDeepSearch without debouncedCode', async () => {
        vi.mocked(BentoGrid).mockImplementation(({ retryWithDeepSearch }: any) => (
            <button onClick={retryWithDeepSearch}>FORCE RETRY</button>
        ));

        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );

        fireEvent.click(screen.getByText('FORCE RETRY'));
        expect(useWorkspaceStore.getState().isDeepDive).toBe(true);
    });
});
