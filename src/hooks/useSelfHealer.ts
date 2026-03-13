import { useEffect } from 'react';
import { useWorkspaceStore } from '../store';

export function useSelfHealer() {
  const isHealing = useWorkspaceStore((s) => s.isHealing);
  const setHealing = useWorkspaceStore((s) => s.setHealing);

  useEffect(() => {
    // Audit check: Intercept global errors to trigger healing
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event;
      const message = error?.message || String(error);
      const status = error?.status || error?.response?.status;

      if (status === 401 || status === 403 || status === 429 || status === 432 || status === 500 ||
        message.includes('429') || message.includes('500') || message.includes('401') ||
        message.includes('403') || message.includes('432') || message.includes('usage limit')) {
        setHealing(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [setHealing]);

  return { isHealing };
}
