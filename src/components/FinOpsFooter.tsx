import React, { memo } from 'react';
import { Coins, ShieldAlert, Zap, Cpu } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useWorkspaceStore } from '../store';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DiagnosticsState {
    gemini: boolean;
    tavily: boolean;
}

interface FinOpsFooterProps {
    diagnostics: DiagnosticsState;
}

/**
 * FinOpsFooter — React.memo + useShallow selector prevents re-renders from
 * unrelated store changes. Only re-renders when token wallet, session cost,
 * healing state, or system health values change.
 */
export const FinOpsFooter = memo(function FinOpsFooter({ diagnostics }: FinOpsFooterProps) {
    const {
        tokenWallet,
        throughput,
        isHealing,
        systemHealth,
        calculateTotalCost,
        calculateResilienceSaved,
    } = useWorkspaceStore(
        useShallow((s) => ({
            tokenWallet: s.tokenWallet,
            throughput: s.throughput,
            isHealing: s.isHealing,
            systemHealth: s.systemHealth,
            calculateTotalCost: s.calculateTotalCost,
            calculateResilienceSaved: s.calculateResilienceSaved,
        }))
    );

    const resilienceSaved = calculateResilienceSaved();
    const totalCost = calculateTotalCost();
    const totalTokens = tokenWallet.inputTokens + tokenWallet.outputTokens;

    return (
        <footer className="h-12 border-t border-zinc-800 bg-black/40 backdrop-blur-xl flex items-center px-6 justify-between text-[10px] font-mono tracking-wider text-zinc-500">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 group">
                    <Coins size={12} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                    <span className="transition-all duration-300 group-hover:text-zinc-300">
                        SESSION_COST:{' '}
                        <span className="text-emerald-500/80 group-hover:text-emerald-400 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all">
                            ${totalCost.toFixed(4)}
                        </span>
                    </span>
                </div>

                <div className="flex items-center gap-2 group">
                    <ShieldAlert
                        size={12}
                        className={cn(
                            'transition-colors',
                            isHealing || resilienceSaved > 0
                                ? 'text-amber-500/80 group-hover:text-amber-400'
                                : 'text-zinc-600'
                        )}
                    />
                    <span className="transition-all duration-300 group-hover:text-zinc-300">
                        RESILIENCE_SAVED:{' '}
                        <span
                            className={cn(
                                'transition-all duration-300',
                                isHealing || resilienceSaved > 0
                                    ? 'text-amber-500/80 group-hover:text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                    : 'text-zinc-600'
                            )}
                        >
                            ${resilienceSaved.toFixed(4)}
                        </span>
                    </span>
                </div>

                <div className="flex items-center gap-2 group">
                    <Zap size={12} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                    <span className="transition-all duration-300 group-hover:text-zinc-300">
                        THROUGHPUT:{' '}
                        <span className="text-zinc-300 group-hover:text-white transition-colors">
                            {throughput}ms
                        </span>
                    </span>
                </div>

                <div className="flex items-center gap-2 group">
                    <Cpu size={12} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                    <span className="transition-all duration-300 group-hover:text-zinc-300">
                        TOKENS:{' '}
                        <span className="text-zinc-300 group-hover:text-white transition-colors">
                            {totalTokens}
                        </span>
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800/50 text-[9px] font-mono">
                    <span className="text-zinc-500 uppercase">Connectivity:</span>
                    <div className="flex gap-2">
                        <span className={cn('flex items-center gap-1', diagnostics.gemini ? 'text-emerald-400' : 'text-rose-400')}>
                            GEMINI {diagnostics.gemini ? '●' : '○'}
                        </span>
                        <span className={cn('flex items-center gap-1', diagnostics.tavily ? 'text-emerald-400' : 'text-rose-400')}>
                            TAVILY {diagnostics.tavily ? '●' : '○'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            isHealing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        )}
                    />
                    <span>
                        HEALTH:{' '}
                        <span className={isHealing ? 'text-amber-500' : 'text-emerald-500'}>
                            {systemHealth.toUpperCase()}
                        </span>
                    </span>
                </div>

                <div className="text-zinc-700">|</div>

                <div className="flex items-center gap-2">
                    <span className="text-zinc-600">REGION:</span>
                    <span className="text-zinc-300">US-EAST-2026</span>
                </div>
            </div>
        </footer>
    );
});
