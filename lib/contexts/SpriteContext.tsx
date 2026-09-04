'use client';

/**
 * Sprite-Modus Context
 * Ermöglicht das Umschalten zwischen statischen und animierten Sprites
 * Die Einstellung wird im localStorage persistiert
 */

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from 'react';

export type SpriteMode = 'static' | 'animated';

interface SpriteContextType {
  spriteMode: SpriteMode;
  setSpriteMode: (mode: SpriteMode) => void;
  toggleSpriteMode: () => void;
}

const SpriteContext = createContext<SpriteContextType | undefined>(undefined);

const SPRITE_STORAGE_KEY = 'pokemon-sprite-mode';
const DISPLAY_SETTINGS_EVENT = 'pokemon-display-settings-change';

function subscribeToDisplaySettings(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SPRITE_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(DISPLAY_SETTINGS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(DISPLAY_SETTINGS_EVENT, onStoreChange);
  };
}

function getStoredSpriteMode(): SpriteMode {
  try {
    const stored = localStorage.getItem(SPRITE_STORAGE_KEY);
    return stored === 'animated' ? 'animated' : 'static';
  } catch {
    return 'static';
  }
}

function notifyDisplaySettingsChanged() {
  window.dispatchEvent(new Event(DISPLAY_SETTINGS_EVENT));
}

interface SpriteProviderProps {
  children: ReactNode;
}

export function SpriteProvider({ children }: SpriteProviderProps) {
  // useSyncExternalStore liefert beim Server-Render und während der Hydrierung
  // stabile Defaults; die lokale Präferenz übernimmt danach ohne Markup-Mismatch.
  const spriteMode = useSyncExternalStore(
    subscribeToDisplaySettings,
    getStoredSpriteMode,
    (): SpriteMode => 'static',
  );
  const setSpriteMode = useCallback((mode: SpriteMode) => {
    try {
      localStorage.setItem(SPRITE_STORAGE_KEY, mode);
    } catch {
      // Die Darstellung bleibt auch ohne verfügbaren Web Storage bedienbar.
    }
    notifyDisplaySettingsChanged();
  }, []);

  const toggleSpriteMode = useCallback(() => {
    setSpriteMode(spriteMode === 'static' ? 'animated' : 'static');
  }, [setSpriteMode, spriteMode]);

  return (
    <SpriteContext.Provider value={{
      spriteMode,
      setSpriteMode,
      toggleSpriteMode,
    }}>
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
