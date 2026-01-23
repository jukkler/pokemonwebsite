/**
 * Custom Hook: Verwaltet Evolution-Menü State und Logik
 */

import { useState, useRef, useCallback } from 'react';
import { fetchJson } from '@/lib/fetchJson';
import { getErrorMessage } from '@/lib/component-utils';
import type { EvolutionChainResult } from '@/lib/types';

interface UseEvolutionMenuReturn {
  menuRef: React.RefObject<HTMLDivElement | null>;
  openEncounterId: number | null;
  evolutionData: EvolutionChainResult | null;
  isLoading: boolean;
  isEvolving: boolean;
  openMenu: (encounterId: number, pokedexId: number) => Promise<void>;
  closeMenu: () => void;
  evolve: (encounterId: number, targetPokedexId: number) => Promise<boolean>;
}

export function useEvolutionMenu(onSuccess?: () => void): UseEvolutionMenuReturn {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [openEncounterId, setOpenEncounterId] = useState<number | null>(null);
  const [evolutionData, setEvolutionData] = useState<EvolutionChainResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);

  const closeMenu = useCallback(() => {
    setOpenEncounterId(null);
    setEvolutionData(null);
  }, []);

  const openMenu = useCallback(async (encounterId: number, pokedexId: number) => {
    // Toggle wenn gleicher Encounter
    if (openEncounterId === encounterId) {
      closeMenu();
      return;
    }

    setOpenEncounterId(encounterId);
    setIsLoading(true);
    setEvolutionData(null);

    try {
      const data = await fetchJson<EvolutionChainResult>(
        `/api/pokemon/${pokedexId}/evolutions`
      );
      setEvolutionData(data);
    } catch (error) {
      console.error('Error loading evolutions:', error);
      setEvolutionData({ preEvolutions: [], evolutions: [] });
    } finally {
      setIsLoading(false);
    }
  }, [openEncounterId, closeMenu]);

  const evolve = useCallback(async (encounterId: number, targetPokedexId: number): Promise<boolean> => {
    setIsEvolving(true);
    try {
      await fetchJson(`/api/admin/encounters/${encounterId}/evolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPokedexId }),
      });
      closeMenu();
      onSuccess?.();
      return true;
    } catch (error) {
      alert(`Fehler beim Entwickeln: ${getErrorMessage(error)}`);
      return false;
    } finally {
      setIsEvolving(false);
    }
  }, [closeMenu, onSuccess]);

  return {
    menuRef,
    openEncounterId,
    evolutionData,
    isLoading,
    isEvolving,
    openMenu,
    closeMenu,
    evolve,
  };
}
