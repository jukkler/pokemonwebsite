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
        <span className="font-medium">{evolution.nameGerman || evolution.name}</span>
        <span className="text-gray-400 text-xs ml-1">#{evolution.pokedexId}</span>
      </div>
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

  // Close Button Component
  const CloseButton = () => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
      title="Schließen"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  if (isLoading) {
    return (
      <div
        ref={menuRef}
        className={`bg-white border border-gray-200 rounded-lg shadow-xl min-w-[200px] ${className}`}
      >
        <div className="relative">
          <CloseButton />
          <div className="p-4 text-center text-gray-500 text-sm">
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
      className={`bg-white border border-gray-200 rounded-lg shadow-xl min-w-[200px] overflow-hidden ${className}`}
    >
      <div className="relative">
        <CloseButton />
      </div>
      
      {/* Entwickeln */}
      {hasEvolutions && (
        <div className="border-b border-gray-100">
          <div className="px-3 py-2 bg-green-50 text-green-800 text-xs font-semibold flex items-center gap-1">
            <span>⬆️</span> Entwickeln zu
          </div>
          {evolutionData.evolutions.map((evo) => (
            <EvolutionButton
              key={evo.pokedexId}
              evolution={evo}
              onClick={() => onEvolve(evo.pokedexId)}
              disabled={isEvolving}
              hoverColor="hover:bg-green-50"
              spriteMode={spriteMode}
            />
          ))}
        </div>
      )}

      {/* Zurückentwickeln */}
      {hasPreEvolutions && (
        <div>
          <div className="px-3 py-2 bg-orange-50 text-orange-800 text-xs font-semibold flex items-center gap-1">
            <span>⬇️</span> Zurückentwickeln zu
          </div>
          {evolutionData.preEvolutions.map((evo) => (
            <EvolutionButton
              key={evo.pokedexId}
              evolution={evo}
              onClick={() => onEvolve(evo.pokedexId)}
              disabled={isEvolving}
              hoverColor="hover:bg-orange-50"
              spriteMode={spriteMode}
            />
          ))}
        </div>
      )}

      {/* Keine Evolutionen */}
      {hasNoOptions && (
        <div className="p-4 text-center text-gray-500 text-sm">
          Keine Evolutionen verfügbar
        </div>
      )}
    </div>
  );
}
