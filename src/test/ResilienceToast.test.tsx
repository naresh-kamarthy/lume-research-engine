import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ResilienceToast } from '../components/ResilienceToast';
import { useWorkspaceStore } from '../store';
import React from 'react';

describe('ResilienceToast', () => {
    beforeEach(() => {
        useWorkspaceStore.setState({
            isHealing: false,
            activeProvider: 'tavily',
            lastError: null,
        });
    });

    it('should not be visible by default', () => {
        render(<ResilienceToast />);
        expect(screen.queryByText(/RESILIENCE PROTOCOL/i)).not.toBeInTheDocument();
    });

    it('should be visible when healing is active', () => {
        useWorkspaceStore.setState({ isHealing: true });
        render(<ResilienceToast />);
        expect(screen.getByText(/RESILIENCE PROTOCOL: FALLBACK TO MOCK_LIBRARY/i)).toBeInTheDocument();
    });

    it('should show quota exceeded message when lastError contains usage limit', () => {
        useWorkspaceStore.setState({
            activeProvider: 'gemini-grounding',
            lastError: 'Provider usage limit reached'
        });
        render(<ResilienceToast />);
        expect(screen.getByText(/QUOTA EXCEEDED: SWITCHING TO GEMINI SEARCH GROUNDING/i)).toBeInTheDocument();
    });

    it('should show generic service error message for other errors', () => {
        useWorkspaceStore.setState({
            activeProvider: 'gemini-grounding',
            lastError: 'Network failure'
        });
        render(<ResilienceToast />);
        expect(screen.getByText(/SERVICE ERROR: Network failure/i)).toBeInTheDocument();
    });
});
