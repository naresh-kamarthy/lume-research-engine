import { renderHook } from '@testing-library/react';
import { useSelfHealer } from '../hooks/useSelfHealer';
import { useWorkspaceStore } from '../store';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('useSelfHealer', () => {
    beforeEach(() => {
        useWorkspaceStore.getState().resetSession();
        vi.clearAllMocks();
    });

    it('should initialize with isHealing false', () => {
        const { result } = renderHook(() => useSelfHealer());
        expect(result.current.isHealing).toBe(false);
    });

    it('should trigger healing when a global error with status 429 occurs', () => {
        renderHook(() => useSelfHealer());

        // Simulate global error
        const errorEvent = new ErrorEvent('error', {
            error: { status: 429, message: 'Rate limit exceeded' }
        });
        window.dispatchEvent(errorEvent);

        expect(useWorkspaceStore.getState().isHealing).toBe(true);
    });

    it('should trigger healing when a global error message contains "usage limit"', () => {
        renderHook(() => useSelfHealer());

        // Simulate global error via message sub-string check
        const errorEvent = new ErrorEvent('error', {
            error: { message: 'Your usage limit has been reached' }
        });
        window.dispatchEvent(errorEvent);

        expect(useWorkspaceStore.getState().isHealing).toBe(true);
    });

    it('should trigger healing on 500 status', () => {
        renderHook(() => useSelfHealer());

        const errorEvent = new ErrorEvent('error', {
            error: { status: 500 }
        });
        window.dispatchEvent(errorEvent);

        expect(useWorkspaceStore.getState().isHealing).toBe(true);
    });

    it('should trigger healing on status 432', () => {
        renderHook(() => useSelfHealer());

        const errorEvent = new ErrorEvent('error', {
            error: { status: 432 }
        });
        window.dispatchEvent(errorEvent);

        expect(useWorkspaceStore.getState().isHealing).toBe(true);
    });

    it('should trigger healing on 401 status', () => {
        renderHook(() => useSelfHealer());
        window.dispatchEvent(new ErrorEvent('error', { error: { status: 401 } }));
        expect(useWorkspaceStore.getState().isHealing).toBe(true);
    });

    it('should trigger healing on 403 status', () => {
        renderHook(() => useSelfHealer());
        window.dispatchEvent(new ErrorEvent('error', { error: { status: 403 } }));
        expect(useWorkspaceStore.getState().isHealing).toBe(true);
    });

    it('should trigger healing on "usage limit" message in error string', () => {
        renderHook(() => useSelfHealer());
        window.dispatchEvent(new ErrorEvent('error', { error: 'usage limit reached' }));
        expect(useWorkspaceStore.getState().isHealing).toBe(true);
    });

    it('should handle error events where error object is missing but message property exists', () => {
        renderHook(() => useSelfHealer());
        const event = new ErrorEvent('error', { message: '500 Internal Server Error' });
        window.dispatchEvent(event);
        expect(useWorkspaceStore.getState().isHealing).toBe(true);
    });

    it('should trigger healing when the error object itself has message property', () => {
        renderHook(() => useSelfHealer());

        // Testing the fallback logic in useSelfHealer: const message = error?.message || String(error);
        const errorEvent = new ErrorEvent('error', {
            error: "429 Too Many Requests"
        });
        window.dispatchEvent(errorEvent);

        expect(useWorkspaceStore.getState().isHealing).toBe(true);
    });

    it('should NOT trigger healing on a 400 Bad Request', () => {
        renderHook(() => useSelfHealer());
        window.dispatchEvent(new ErrorEvent('error', { error: { status: 400 } }));
        expect(useWorkspaceStore.getState().isHealing).toBe(false);
    });

    it('should remove event listener on unmount', () => {
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const { unmount } = renderHook(() => useSelfHealer());

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function));
    });
});
