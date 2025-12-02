import { useEffect, useState } from 'react';

export type CardDensity = 'comfortable' | 'compact';

interface CardLayoutState {
  density: CardDensity;
  setDensity: (density: CardDensity) => void;
}

const STORAGE_KEY_PREFIX = 'dashboardjr:card-layout:';

const getInitialDensity = (storageKey: string): CardDensity => {
  if (typeof window === 'undefined') {
    return 'comfortable';
  }

  const stored = window.localStorage.getItem(storageKey);
  return stored === 'compact' ? 'compact' : 'comfortable';
};

export function useCardLayout(namespace: string): CardLayoutState {
  const storageKey = `${STORAGE_KEY_PREFIX}${namespace}`;
  const [density, setDensityState] = useState<CardDensity>(() =>
    getInitialDensity(storageKey),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, density);
  }, [density, storageKey]);

  const setDensity = (value: CardDensity) => {
    setDensityState(value);
  };

  return {
    density,
    setDensity,
  };
}


