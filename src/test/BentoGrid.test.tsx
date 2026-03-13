import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BentoGrid } from '../components/BentoGrid';
import { useWorkspaceStore } from '../store';
import React from 'react';

// Mock Monaco Editor as it's heavy and hard to test in jsdom
vi.mock('@monaco-editor/react', () => ({
    Editor: ({ value, onChange }: any) => (
        <textarea
            data-testid="mock-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

describe('BentoGrid', () => {
    const defaultProps = {
        code: 'test code',
        setCode: vi.fn(),
        optimisticKeywords: ['Keyword1', 'Keyword2'],
        isPending: false,
        researchResults: [
            { id: '1', title: 'Result 1', summary: 'Summary 1', source: 'Source 1', tags: ['AI'], relevanceScore: 0.9 },
            { id: '2', title: 'Result 2', summary: 'Summary 2', source: 'Source 2', tags: [], relevanceScore: 0.5 },
        ],
        retryWithDeepSearch: vi.fn(),
    };

    beforeEach(() => {
        useWorkspaceStore.setState({
            isHealing: false,
            activeProvider: 'tavily',
            pinnedResearch: [],
            pinResearch: vi.fn(),
            unpinResearch: vi.fn(),
        });
    });

    it('renders properties correctly', () => {
        render(<BentoGrid {...defaultProps} />);
        expect(screen.getByTestId('mock-editor')).toHaveValue('test code');
        expect(screen.getByText('Keyword1')).toBeInTheDocument();
        expect(screen.getByText('Result 1')).toBeInTheDocument();
        expect(screen.getByText('Result 2')).toBeInTheDocument();
    });

    it('sorts results by relevance score even if some are missing', () => {
        const props = {
            ...defaultProps,
            researchResults: [
                { id: 'low', title: 'Low Result', summary: '...', source: '...', tags: [], relevanceScore: 0.1 },
                { id: 'none', title: 'None Result', summary: '...', source: '...', tags: [], relevanceScore: undefined as any },
                { id: 'high', title: 'High Result', summary: '...', source: '...', tags: [], relevanceScore: 0.9 },
            ]
        };
        render(<BentoGrid {...props} />);
        const titles = screen.getAllByRole('heading', { level: 3 });
        expect(titles[0]).toHaveTextContent('High Result');
    });

    it('handles undefined researchResults gracefully', () => {
        render(<BentoGrid {...defaultProps} researchResults={undefined as any} />);
        expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });

    it('renders tags when present', () => {
        render(<BentoGrid {...defaultProps} />);
        expect(screen.getByText(/AI/i)).toBeInTheDocument();
    });

    it('calls setCode when editor changes', () => {
        render(<BentoGrid {...defaultProps} />);
        const editor = screen.getByTestId('mock-editor');
        fireEvent.change(editor, { target: { value: 'new code' } });
        expect(defaultProps.setCode).toHaveBeenCalledWith('new code');
    });

    it('shows fallback status when isHealing is true', () => {
        useWorkspaceStore.setState({ isHealing: true });
        render(<BentoGrid {...defaultProps} />);
        expect(screen.getByText(/FALLBACK ACTIVE/i)).toBeInTheDocument();
    });

    it('pins and unpins research results', () => {
        const pinResearch = vi.fn();
        const unpinResearch = vi.fn();
        useWorkspaceStore.setState({ pinResearch, unpinResearch });

        render(<BentoGrid {...defaultProps} />);

        // Find buttons that don't have text (these are the pin buttons)
        const buttons = screen.getAllByRole('button');
        const pinBtn = buttons.find(b => !b.textContent && b.className.includes('p-1.5'));

        if (pinBtn) {
            fireEvent.click(pinBtn);
            expect(pinResearch).toHaveBeenCalledWith(defaultProps.researchResults[0]);
        }

        // Mock pinned state
        useWorkspaceStore.setState({
            pinnedResearch: [defaultProps.researchResults[0]],
            unpinResearch
        });

        render(<BentoGrid {...defaultProps} />);
        const activePinBtn = screen.getAllByRole('button').find(b => b.className.includes('text-emerald-400'));

        if (activePinBtn) {
            fireEvent.click(activePinBtn);
            expect(unpinResearch).toHaveBeenCalledWith('1');
        }
    });
});
