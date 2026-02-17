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
  const [spriteMode, setSpriteMode] = useState<SpriteMode>(() => {
    if (typeof window === 'undefined') {
      return 'static';
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'animated' || stored === 'static' ? stored : 'static';
  });

  // Bei Änderung: localStorage aktualisieren
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, spriteMode);
  }, [spriteMode]);

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
