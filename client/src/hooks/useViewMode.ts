import { useState } from 'react';
import type { ViewMode } from '../components/ViewModeToggle';

export function useViewMode(storageKey: string, initial: ViewMode = 'cards') {
  const [mode, setModeState] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return initial;
    const saved = window.localStorage.getItem(storageKey);
    return saved === 'table' ? 'table' : 'cards';
  });

  const setMode = (next: ViewMode) => {
    setModeState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, next);
    }
  };

  return { mode, setMode };
}


