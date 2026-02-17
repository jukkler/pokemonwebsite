/**
 * Evolution-Menü Komponente
 * Wiederverwendbare Komponente für Pokémon-Evolutionen
 */

'use client';

import Image from 'next/image';
import type { EvolutionChainResult, EvolutionOption } from '@/lib/types';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { getSpriteUrl } from '@/lib/sprite-utils';

interface EvolutionMenuProps {
  evolutionData: EvolutionChainResult | null;
  isLoading: boolean;
  isEvolving: boolean;
  onEvolve: (targetPokedexId: number) => void;
  onClose: () => void;
  menuRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

interface EvolutionButtonProps {
  evolution: EvolutionOption;
  onClick: () => void;
  disabled: boolean;
  hoverColor: string;
  spriteMode: 'static' | 'animated';
}

interface CloseButtonProps {
  onClose: () => void;
}

function EvolutionButton({ evolution, onClick, disabled, hoverColor, spriteMode }: EvolutionButtonProps) {
  const displaySpriteUrl = getSpriteUrl(evolution, spriteMode);
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`w-full px-3 py-2 text-left text-sm ${hoverColor} transition flex items-center gap-2 disabled:opacity-50`}
    >
      {displaySpriteUrl && (
        <Image
          src={displaySpriteUrl}
          alt={evolution.nameGerman || evolution.name}
          width={32}
          height={32}
          className="object-contain"
          unoptimized={spriteMode === 'animated'}
        />
      )}
      <div>
        <span className="font-medium text-[var(--foreground)]">{evolution.nameGerman || evolution.name}</span>
        <span className="text-[var(--text-tertiary)] text-xs ml-1">#{evolution.pokedexId}</span>
      </div>
    </button>
  );
}

function CloseButton({ onClose }: CloseButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="absolute top-1 right-1 p-1 text-[var(--text-tertiary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] rounded transition"
      title="Schließen"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

export default function EvolutionMenu({
  evolutionData,
  isLoading,
  isEvolving,
  onEvolve,
  onClose,
  menuRef,
  className = '',
}: EvolutionMenuProps) {
  const { spriteMode } = useSpriteMode();

  if (isLoading) {
    return (
      <div
        ref={menuRef}
        className={`bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg shadow-xl min-w-[200px] ${className}`}
      >
        <div className="relative">
          <CloseButton onClose={onClose} />
          <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
            Lade Evolutionen...
          </div>
        </div>
      </div>
    );
  }

  if (!evolutionData) {
    return null;
  }

  const hasEvolutions = evolutionData.evolutions.length > 0;
  const hasPreEvolutions = evolutionData.preEvolutions.length > 0;
  const hasNoOptions = !hasEvolutions && !hasPreEvolutions;

  return (
    <div
      ref={menuRef}
      className={`bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg shadow-xl min-w-[200px] overflow-hidden ${className}`}
    >
      <div className="relative">
        <CloseButton onClose={onClose} />
      </div>
      
      {/* Entwickeln */}
      {hasEvolutions && (
        <div className="border-b border-[var(--border-default)]">
          <div className="px-3 py-2 bg-green-500/10 text-green-400 border-b border-green-500/30 text-xs font-semibold flex items-center gap-1">
            <span>⬆️</span> Entwickeln zu
          </div>
          {evolutionData.evolutions.map((evo) => (
            <EvolutionButton
              key={evo.pokedexId}
              evolution={evo}
              onClick={() => onEvolve(evo.pokedexId)}
              disabled={isEvolving}
              hoverColor="hover:bg-green-500/20"
              spriteMode={spriteMode}
            />
          ))}
        </div>
      )}

      {/* Zurückentwickeln */}
      {hasPreEvolutions && (
        <div>
          <div className="px-3 py-2 bg-orange-500/10 text-orange-400 border-b border-orange-500/30 text-xs font-semibold flex items-center gap-1">
            <span>⬇️</span> Zurückentwickeln zu
          </div>
          {evolutionData.preEvolutions.map((evo) => (
            <EvolutionButton
              key={evo.pokedexId}
              evolution={evo}
              onClick={() => onEvolve(evo.pokedexId)}
              disabled={isEvolving}
              hoverColor="hover:bg-orange-500/20"
              spriteMode={spriteMode}
            />
          ))}
        </div>
      )}

      {/* Keine Evolutionen */}
      {hasNoOptions && (
        <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
          Keine Evolutionen verfügbar
        </div>
      )}
    </div>
  );
}
