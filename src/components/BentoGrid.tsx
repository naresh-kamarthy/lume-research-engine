import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor } from '@monaco-editor/react';
import {
    Activity,
    ShieldAlert,
    Zap,
    Search,
    Globe,
    Terminal,
    AlertCircle,
    Bookmark,
    BookmarkCheck,
    CheckCircle2,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';
import { useWorkspaceStore } from '../store';
import type { ResearchItem } from '../mockResearchLibrary';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface BentoGridProps {
    code: string;
    setCode: (v: string) => void;
    optimisticKeywords: string[];
    isPending: boolean;
    researchResults: ResearchItem[] | undefined;
    retryWithDeepSearch: () => void;
}

export const BentoGrid = memo(function BentoGrid({
    code,
    setCode,
    optimisticKeywords,
    isPending,
    researchResults,
    retryWithDeepSearch,
}: BentoGridProps) {
    const { isHealing, activeProvider, pinnedResearch, pinResearch, unpinResearch } =
        useWorkspaceStore(
            useShallow((s) => ({
                isHealing: s.isHealing,
                activeProvider: s.activeProvider,
                pinnedResearch: s.pinnedResearch,
                pinResearch: s.pinResearch,
                unpinResearch: s.unpinResearch,
            }))
        );

    // Performance: sort by relevance score only when researchResults reference changes
    const sortedResults = useMemo(() => {
        if (!researchResults) return [];
        return [...researchResults].sort(
            (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
        );
    }, [researchResults]);

    return (
        <main className="flex-1 p-6 grid grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full">
            {/* Editor Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-12 lg:col-span-7 glass-panel overflow-hidden flex flex-col"
            >
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Terminal size={16} />
                        <span className="text-xs font-mono">context_buffer.ts</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    </div>
                </div>
                <div className="flex-1 min-h-[500px]">
                    <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: 'JetBrains Mono',
                            padding: { top: 20 },
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                </div>
            </motion.section>

            {/* Research Sidebar */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                {/* Keywords Display */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <Search size={14} />
                            Detected Keywords
                        </h2>
                        {isPending && <Activity size={14} className="text-emerald-400 animate-spin" />}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {optimisticKeywords.length > 0 ? (
                            optimisticKeywords.map((kw, i) => (
                                <motion.span
                                    key={`${kw}-${i}`}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-mono text-emerald-400"
                                >
                                    {kw}
                                </motion.span>
                            ))
                        ) : (
                            <span className="text-zinc-600 text-sm italic">Waiting for context...</span>
                        )}
                    </div>
                </motion.div>

                {/* Research Results */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel flex-1 flex flex-col overflow-hidden"
                >
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <Globe size={14} />
                            Research Library
                        </h2>
                        <div className="flex items-center gap-3">
                            {sortedResults[0]?.isLowRelevance && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold animate-pulse">
                                        <AlertCircle size={12} />
                                        LOW RELEVANCE
                                    </div>
                                    <button
                                        onClick={retryWithDeepSearch}
                                        className="text-[9px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30 transition-colors"
                                    >
                                        RETRY WITH DEEP SEARCH
                                    </button>
                                </div>
                            )}
                            {activeProvider === 'gemini-grounding' && (
                                <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
                                    <Zap size={12} className="animate-pulse" />
                                    GEMINI SEARCH ACTIVE
                                </div>
                            )}
                            {isHealing && (
                                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                                    <ShieldAlert size={12} />
                                    FALLBACK ACTIVE
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {sortedResults.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={cn(
                                        'p-4 border rounded-xl transition-all duration-500 group relative',
                                        item.relevanceScore !== undefined && item.relevanceScore < 0.4
                                            ? 'grayscale opacity-60 bg-zinc-900/30 border-zinc-800'
                                            : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600',
                                        item.relevanceScore !== undefined && item.relevanceScore > 0.8
                                            ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                            : ''
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                                                    {item.title}
                                                </h3>
                                                {item.isGrounded && (
                                                    <div className="tooltip-trigger relative">
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded border border-emerald-500/30 uppercase tracking-tighter cursor-help">
                                                            <CheckCircle2 size={8} />
                                                            Verified Fact
                                                        </div>
                                                        <div className="tooltip-content">
                                                            Grounded via Gemini 3 Flash Reranker (Rel {'>'} 80%)
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {item.relevanceScore !== undefined && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="w-16 h-1 bg-zinc-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                'h-full transition-all duration-1000',
                                                                item.relevanceScore > 0.7
                                                                    ? 'bg-emerald-500'
                                                                    : item.relevanceScore > 0.4
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-rose-500'
                                                            )}
                                                            style={{ width: `${item.relevanceScore * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] text-zinc-500 uppercase font-mono">
                                                        Rel: {(item.relevanceScore * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-[10px] bg-zinc-700 px-2 py-0.5 rounded text-zinc-400 font-mono">
                                                {item.source}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    pinnedResearch.find((p) => p.id === item.id)
                                                        ? unpinResearch(item.id)
                                                        : pinResearch(item)
                                                }
                                                className={cn(
                                                    'p-1.5 rounded-lg transition-colors',
                                                    pinnedResearch.find((p) => p.id === item.id)
                                                        ? 'text-emerald-400 bg-emerald-500/10'
                                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'
                                                )}
                                            >
                                                {pinnedResearch.find((p) => p.id === item.id) ? (
                                                    <BookmarkCheck size={14} />
                                                ) : (
                                                    <Bookmark size={14} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-400 leading-relaxed mb-3">{item.summary}</p>
                                    <div className="flex gap-2">
                                        {item.tags.map((tag) => (
                                            <span key={tag} className="text-[10px] text-zinc-500">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {sortedResults.length === 0 && !isPending && (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-3 py-20">
                                <Search size={40} strokeWidth={1} />
                                <p className="text-sm">Type in the editor to populate research</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </main>
    );
});
