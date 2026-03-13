import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';
import { useWorkspaceStore } from '../store';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const ResilienceToast = memo(function ResilienceToast() {
    const { isHealing, activeProvider, lastError } = useWorkspaceStore(
        useShallow((s) => ({
            isHealing: s.isHealing,
            activeProvider: s.activeProvider,
            lastError: s.lastError,
        }))
    );

    const isVisible = isHealing || activeProvider === 'gemini-grounding';

    const message = isHealing
        ? 'RESILIENCE PROTOCOL: FALLBACK TO MOCK_LIBRARY'
        : lastError?.toLowerCase().includes('usage limit') ||
            lastError?.toLowerCase().includes('quota') ||
            lastError?.includes('432')
            ? 'QUOTA EXCEEDED: SWITCHING TO GEMINI SEARCH GROUNDING'
            : `SERVICE ERROR: ${lastError || 'SWITCHING TO GEMINI SEARCH'}`;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
                >
                    <div
                        className={cn(
                            'px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold',
                            isHealing
                                ? 'bg-amber-500 text-black shadow-amber-500/20'
                                : 'bg-indigo-500 text-white shadow-indigo-500/20'
                        )}
                    >
                        <AlertCircle size={20} />
                        <span>{message}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
