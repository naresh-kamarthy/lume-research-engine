import { useState, useEffect, useOptimistic, startTransition, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  BrainCircuit,
  Zap,
} from 'lucide-react';
import { useWorkspaceStore } from './store';
import { useDebounce } from './hooks/useDebounce';
import { useSelfHealer } from './hooks/useSelfHealer';
import { extractKeywords, performResearch } from './services';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';
import { BentoGrid } from './components/BentoGrid';
import { FinOpsFooter } from './components/FinOpsFooter';
import { ResilienceToast } from './components/ResilienceToast';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Workspace />
    </QueryClientProvider>
  );
}

function Workspace() {
  const {
    isHealing,
    isDeepDive,
    currentTheme,
    setDeepDive,
    handleNewSession,
  } = useWorkspaceStore(
    useShallow((s) => ({
      isHealing: s.isHealing,
      isDeepDive: s.isDeepDive,
      currentTheme: s.currentTheme,
      setDeepDive: s.setDeepDive,
      handleNewSession: s.handleNewSession,
    }))
  );
  useSelfHealer();

  const [diagnostics, setDiagnostics] = useState({ tavily: false, gemini: false });

  useEffect(() => {
    const geminiKey = process.env.VITE_GEMINI_API_KEY;
    const checkTavily = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setDiagnostics({ gemini: !!geminiKey, tavily: data.tavilyConfigured });
      } catch {
        setDiagnostics((prev) => ({ ...prev, gemini: !!geminiKey }));
      }
    };
    checkTavily();
  }, []);

  const [code, setCode] = useState(
    '// Start typing to trigger context-aware research...\n// Try keywords like "Quantum", "AI Agents", or "Edge Computing"'
  );
  const debouncedCode = useDebounce(code, 1500);
  const [keywords, setKeywords] = useState<string[]>([]);

  const [optimisticKeywords, addOptimisticKeyword] = useOptimistic(
    keywords,
    (state: string[], newKeyword: string) => [...state, newKeyword]
  );

  const { data: researchResults, isPending } = useQuery({
    queryKey: isHealing ? ['mock-research', keywords] : ['research', keywords, isDeepDive],
    queryFn: () => performResearch(keywords),
    enabled: keywords.length > 0,
    staleTime: 10000,
  });

  useEffect(() => {
    if (debouncedCode && debouncedCode.trim().length > 20) {
      handleContextUpdate(debouncedCode);
    }
  }, [debouncedCode]);

  const handleContextUpdate = useCallback(async (text: string) => {
    startTransition(() => {
      addOptimisticKeyword(`Searching for context in "${text.slice(0, 20)}..."`);
    });
    const kws = await extractKeywords(text);
    setKeywords(kws);
  }, [addOptimisticKeyword]);

  const retryWithDeepSearch = useCallback(async () => {
    startTransition(() => {
        setDeepDive(true);
    });
    if (!debouncedCode) {
      return;
    }
    await handleContextUpdate(debouncedCode);
  }, [debouncedCode, handleContextUpdate, setDeepDive]);

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col transition-colors duration-700',
        currentTheme === 'amber' ? 'bg-amber-950/20 amber-healing-bg' : 'bg-zinc-950'
      )}
    >
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center px-6 justify-between glass-panel rounded-none border-x-0">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500',
              isHealing ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
            )}
          >
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">AGENTIC HYBRID WORKSPACE</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
              v2026.4.0-STABLE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setDeepDive(!isDeepDive)}
            className={cn(
              'px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 border transition-all duration-300',
              isDeepDive
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Zap size={12} className={isDeepDive ? 'fill-indigo-400' : ''} />
            DEEP DIVE {isDeepDive ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => {
              startTransition(() => {
                handleNewSession();
                setCode('');
                setKeywords([]);
              });
            }}
            className={cn(
              'px-3 py-1 rounded-full text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-all shimmer-button',
              isPending && 'opacity-70 pointer-events-none'
            )}
          >
            {isPending ? 'RESETTING...' : 'NEW SESSION'}
          </button>

          <motion.div
            animate={{ opacity: 1 }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border transition-all duration-500',
              isHealing
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            )}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isHealing ? 'bg-amber-400 status-pulse' : 'bg-emerald-400'
              )}
            />
            {isHealing ? 'SELF-HEALING ACTIVE' : 'SYSTEM LIVE'}
          </motion.div>
        </div>
      </header>

      {/* Bento Grid — standalone memoized component */}
      <BentoGrid
        code={code}
        setCode={setCode}
        optimisticKeywords={optimisticKeywords}
        isPending={isPending}
        researchResults={researchResults}
        retryWithDeepSearch={retryWithDeepSearch}
      />

      {/* FinOps Footer — memoized, only re-renders on token/cost changes */}
      <FinOpsFooter diagnostics={diagnostics} />

      {/* Resilience Toast — standalone, subscribes only to healing/provider */}
      <ResilienceToast />
    </div>
  );
}
