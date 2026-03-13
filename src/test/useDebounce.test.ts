import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('should update the value after the delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        // Update value
        rerender({ value: 'updated', delay: 500 });

        // Value remains initial before timer finishes
        expect(result.current).toBe('initial');

        // Fast-forward time
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe('updated');
    });

    it('should reset timer if value changes before delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        rerender({ value: 'update1', delay: 500 });

        act(() => {
            vi.advanceTimersByTime(250);
        });

        rerender({ value: 'update2', delay: 500 });

        act(() => {
            vi.advanceTimersByTime(250); // 500ms since update1, but only 250ms since update2
        });

        expect(result.current).toBe('initial'); // Should still be initial or at least not update2

        act(() => {
            vi.advanceTimersByTime(250); // Total 500ms since update2
        });

        expect(result.current).toBe('update2');
    });
});
