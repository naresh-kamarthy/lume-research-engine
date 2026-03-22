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

        // Test fallback to empty string when value is null/undefined (though textarea always gives string)
        // But we mock Editor to handle value || ''
        fireEvent.change(editor, { target: { value: '' } });
        expect(defaultProps.setCode).toHaveBeenCalledWith('');
    });

    it('shows pending status when isPending is true', () => {
        render(<BentoGrid {...defaultProps} isPending={true} />);
        const loader = screen.getByText(/Detected Keywords/i).parentElement?.querySelector('.animate-spin');
        expect(loader).toBeInTheDocument();
    });

    it('shows empty keywords message', () => {
        render(<BentoGrid {...defaultProps} optimisticKeywords={[]} />);
        expect(screen.getByText(/Waiting for context\.\.\./i)).toBeInTheDocument();
    });

    it('shows empty results message', () => {
        render(<BentoGrid {...defaultProps} researchResults={[]} />);
        expect(screen.getByText(/Type in the editor to populate research/i)).toBeInTheDocument();
    });

    it('shows low relevance warning and handles deep search retry', () => {
        const props = {
            ...defaultProps,
            researchResults: [
                { id: '1', title: 'Bad Result', summary: '...', source: '...', tags: [], relevanceScore: 0.1, isLowRelevance: true }
            ]
        };
        render(<BentoGrid {...props} />);
        expect(screen.getByText(/LOW RELEVANCE/i)).toBeInTheDocument();
        
        fireEvent.click(screen.getByText(/RETRY WITH DEEP SEARCH/i));
        expect(props.retryWithDeepSearch).toHaveBeenCalled();
    });

    it('shows gemini search active status', () => {
        useWorkspaceStore.setState({ activeProvider: 'gemini-grounding' });
        render(<BentoGrid {...defaultProps} />);
        expect(screen.getByText(/GEMINI SEARCH ACTIVE/i)).toBeInTheDocument();
    });

    it('shows fallback status when isHealing is true', () => {
        useWorkspaceStore.setState({ isHealing: true });
        render(<BentoGrid {...defaultProps} />);
        expect(screen.getByText(/FALLBACK ACTIVE/i)).toBeInTheDocument();
    });

    it('renders verified fact badge for grounded items', () => {
        const props = {
            ...defaultProps,
            researchResults: [
                { id: 'g1', title: 'Grounded Result', summary: '...', source: '...', tags: [], relevanceScore: 0.9, isGrounded: true }
            ]
        };
        render(<BentoGrid {...props} />);
        expect(screen.getByText(/Verified Fact/i)).toBeInTheDocument();
    });

    it('applies correct styling for relevance score ranges', () => {
        const props = {
            ...defaultProps,
            researchResults: [
                { id: 'high', title: 'H', summary: 'S', source: 'S', tags: [], relevanceScore: 0.9 },
                { id: 'mid', title: 'M', summary: 'S', source: 'S', tags: [], relevanceScore: 0.5 },
                { id: 'low', title: 'L', summary: 'S', source: 'S', tags: [], relevanceScore: 0.2 },
            ]
        };
        const { container } = render(<BentoGrid {...props} />);
        
        // High score should have emerald border
        const highCard = container.querySelector('.border-emerald-500\\/50');
        expect(highCard).toBeInTheDocument();

        // Low score should be grayscale
        const lowCard = container.querySelector('.grayscale');
        expect(lowCard).toBeInTheDocument();
    });

    it('pins and unpins research results', () => {
        const pinStore = useWorkspaceStore.getState();
        const pinResearchSpy = vi.spyOn(pinStore, 'pinResearch');
        const unpinResearchSpy = vi.spyOn(pinStore, 'unpinResearch');

        const { rerender } = render(<BentoGrid {...defaultProps} />);

        const buttons = screen.getAllByRole('button');
        const pinBtn = buttons.find(b => b.querySelector('svg')?.classList.contains('lucide-bookmark'));
        if (pinBtn) fireEvent.click(pinBtn);
        expect(pinResearchSpy).toHaveBeenCalledWith(defaultProps.researchResults[0]);

        // Mock pinned in store
        act(() => {
            useWorkspaceStore.setState({ pinnedResearch: [defaultProps.researchResults[0]] });
        });

        rerender(<BentoGrid {...defaultProps} />);
        const pinnedBtn = screen.getAllByRole('button').find(b => b.querySelector('svg')?.classList.contains('lucide-bookmark-check'));
        if (pinnedBtn) fireEvent.click(pinnedBtn);
        expect(unpinResearchSpy).toHaveBeenCalledWith('1');
    });
});
