'use client';

/**
 * Sprite-Modus Context
 * Ermöglicht das Umschalten zwischen statischen und animierten Sprites
 * Die Einstellung wird im localStorage persistiert
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SpriteMode = 'static' | 'animated';

interface SpriteContextType {
  spriteMode: SpriteMode;
  setSpriteMode: (mode: SpriteMode) => void;
  toggleSpriteMode: () => void;
}

const SpriteContext = createContext<SpriteContextType | undefined>(undefined);

const STORAGE_KEY = 'pokemon-sprite-mode';

interface SpriteProviderProps {
  children: ReactNode;
}

export function SpriteProvider({ children }: SpriteProviderProps) {
  // Initialer State ist 'static', wird nach Mount aus localStorage geladen
  const [spriteMode, setSpriteMode] = useState<SpriteMode>('static');
  const [isHydrated, setIsHydrated] = useState(false);

  // Beim Mount: localStorage lesen
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'animated' || stored === 'static') {
      setSpriteMode(stored);
    }
    setIsHydrated(true);
  }, []);

  // Bei Änderung: localStorage aktualisieren
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, spriteMode);
    }
  }, [spriteMode, isHydrated]);

  const toggleSpriteMode = () => {
    setSpriteMode(prev => prev === 'static' ? 'animated' : 'static');
  };

  return (
    <SpriteContext.Provider value={{ spriteMode, setSpriteMode, toggleSpriteMode }}>
      {children}
    </SpriteContext.Provider>
  );
}

/**
 * Hook zum Zugriff auf den Sprite-Modus
 */
export function useSpriteMode(): SpriteContextType {
  const context = useContext(SpriteContext);
  if (context === undefined) {
    throw new Error('useSpriteMode must be used within a SpriteProvider');
  }
  return context;
}
