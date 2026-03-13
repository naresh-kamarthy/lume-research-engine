import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinOpsFooter } from '../components/FinOpsFooter';
import { useWorkspaceStore } from '../store';
import React from 'react';

// For the purpose of these tests, we can use the actual store or mock it.
// Given useShallow is used, it's easier to manipulate the store directly if it's singleton.

describe('FinOpsFooter', () => {
    const mockDiagnostics = { gemini: true, tavily: true };

    beforeEach(() => {
        useWorkspaceStore.setState({
            tokenWallet: {
                inputTokens: 1000,
                outputTokens: 500,
                tavilyBasicCredits: 1,
                tavilyAdvancedCredits: 0,
                mockRequestsServed: 0,
            },
            throughput: 150,
            isHealing: false,
            systemHealth: 'healthy',
        });
    });

    it('renders token counts correctly', () => {
        render(<FinOpsFooter diagnostics={mockDiagnostics} />);
        expect(screen.getByText(/TOKENS:/i)).toBeInTheDocument();
        expect(screen.getByText('1500')).toBeInTheDocument(); // 1000 + 500
    });

    it('renders throughput correctly', () => {
        render(<FinOpsFooter diagnostics={mockDiagnostics} />);
        expect(screen.getByText(/THROUGHPUT:/i)).toBeInTheDocument();
        expect(screen.getByText('150ms')).toBeInTheDocument();
    });

    it('displays healing status correctly', () => {
        useWorkspaceStore.setState({ isHealing: true, systemHealth: 'healing' });
        render(<FinOpsFooter diagnostics={mockDiagnostics} />);
        expect(screen.getByText(/HEALTH:/i)).toBeInTheDocument();
        expect(screen.getByText('HEALING')).toBeInTheDocument();
    });

    it('renders connectivity indicators based on diagnostics', () => {
        render(<FinOpsFooter diagnostics={{ gemini: true, tavily: false }} />);
        const gemini = screen.getByText(/GEMINI ●/i);
        const tavily = screen.getByText(/TAVILY ○/i);
        expect(gemini).toHaveClass('text-emerald-400');
        expect(tavily).toHaveClass('text-rose-400');
    });
});
