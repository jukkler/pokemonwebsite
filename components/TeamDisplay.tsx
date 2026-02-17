/**
 * Team-Display Komponente
 * Zeigt das aktuelle Team eines Spielers an (6 Slots)
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PokemonCard from './PokemonCard';
import EvolutionMenu from './EvolutionMenu';
import PokemonSwapDialog from './PokemonSwapDialog';
import dynamic from 'next/dynamic';
const DefensiveCoverageMatrix = dynamic(() => import('./DefensiveCoverageMatrix'), {
  loading: () => <div className="animate-pulse bg-[var(--background-tertiary)] rounded-lg h-32" />,
  ssr: false,
});
import { useEvolutionMenu } from '@/lib/hooks/useEvolutionMenu';
import { calculateAverageStats, countPlayerStats, createTeamSlots } from '@/lib/team-utils';
import { fetchJson } from '@/lib/fetchJson';
import { getErrorMessage } from '@/lib/component-utils';
import type { TeamEncounter, TooltipItem, PokemonListItem } from '@/lib/types';

// =============================================================================
// Sub-Komponenten
// =============================================================================

interface TooltipProps {
  items: TooltipItem[];
  children: React.ReactNode;
}

function Tooltip({ items, children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2,
    });
  }, []);

  useEffect(() => {
    if (isOpen || isHovered) {
      updatePosition();
    }
  }, [isOpen, isHovered, updatePosition]);

  // Schließe bei Klick außerhalb
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  if (items.length === 0) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <div className="bg-[var(--card-bg-elevated)] text-[var(--foreground)] text-sm rounded-lg shadow-xl border border-[var(--border-default)] p-3 max-w-xs max-h-64 overflow-y-auto">
      {isOpen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="absolute top-2 right-2 text-[var(--foreground)] hover:text-[var(--text-secondary)] transition"
          aria-label="Tooltip schliessen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className={`space-y-2 ${isOpen ? 'pr-6' : ''}`}>
        {items.map((item, index) => (
          <div key={index}>
            <div className="font-semibold">{item.routeName}:</div>
            <div className="ml-2 text-[var(--text-secondary)]">{item.pokemonNames.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const canUsePortal = typeof document !== 'undefined';
  const showTooltip = (isOpen || isHovered) && canUsePortal && position;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsOpen(!isOpen)}
      className="cursor-help"
    >
      {children}
      {showTooltip && createPortal(
        <div
          className="absolute z-[9998]"
          style={{
            top: position.top,
            left: position.left,
            transform: 'translate(-50%, -100%) translateY(-8px)',
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        >
          {tooltipContent}
        </div>,
        document.body,
      )}
    </div>
  );
}

// =============================================================================
// Haupt-Komponente
// =============================================================================

interface Route {
  id: number;
  name: string;
  encounters: {
    isKnockedOut: boolean;
    koCausedBy: string | null;
    isNotCaught: boolean;
    notCaughtBy: string | null;
    pokemon: {
      pokedexId: number;
      name: string;
      nameGerman: string | null;
    };
  }[];
}

interface TeamDisplayProps {
  playerName: string;
  playerColor: string;
  teamMembers: TeamEncounter[];
  routes: Route[];
  isAdmin?: boolean;
  onRemoveFromTeam?: (routeId: number) => void;
  onEvolution?: () => void;
  pokemon?: PokemonListItem[];
}

export default function TeamDisplay({
  playerName,
  playerColor,
  teamMembers,
  routes,
  isAdmin = false,
  onRemoveFromTeam,
  onEvolution,
  pokemon = [],
}: TeamDisplayProps) {
  // Evolution-Hook
  const evolution = useEvolutionMenu(onEvolution);

  // Swap State
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swappingMember, setSwappingMember] = useState<TeamEncounter | null>(null);
  const [swapping, setSwapping] = useState(false);

  // Berechnungen
  const slots = createTeamSlots(teamMembers);
  const filledMembers = slots.filter((slot): slot is TeamEncounter => slot !== null);
  const teamAverage = calculateAverageStats(filledMembers);
  const { koCount, notCaughtCount, knockedOutPokemon, notCaughtPokemon } = countPlayerStats(playerName, routes);

  // Swap Handler
  const handleSwapPokemon = async (newPokemonId: number) => {
    if (!swappingMember) return;
    setSwapping(true);
    try {
      await fetchJson(`/api/admin/encounters/${swappingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pokemonId: newPokemonId }),
      });
      setSwapDialogOpen(false);
      setSwappingMember(null);
      onEvolution?.(); // Reload data
    } catch (error) {
      alert(`Fehler beim Tauschen: ${getErrorMessage(error)}`);
    } finally {
      setSwapping(false);
    }
  };

  return (
    <>
      <div className="overflow-visible">
        {/* Stats Header - kompakter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {teamAverage && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full font-medium border border-blue-500/30">
                Gesamt-BP: {teamAverage.total}
              </span>
            )}

            {koCount > 0 && (
              <Tooltip items={knockedOutPokemon}>
                <span className="text-xs bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full font-medium border border-red-500/30 cursor-help">
                  💀 {koCount}
                </span>
              </Tooltip>
            )}

            {notCaughtCount > 0 && (
              <Tooltip items={notCaughtPokemon}>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full font-medium border border-yellow-500/30 cursor-help">
                  ❌ {notCaughtCount}
                </span>
              </Tooltip>
            )}
          </div>

          {teamAverage && (
            <div className="text-xs font-medium text-[var(--text-secondary)]">
              {teamAverage.count}/6 Pokemon
            </div>
          )}
        </div>

        {/* Team-Grid - Horizontal Layout auf Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 overflow-visible">
          {slots.map((member, index) => (
            <div key={index} className="flex flex-col overflow-visible">
              <div className="relative group flex-1 overflow-visible">
                {/* Slot-Nummer */}
                <div className="absolute top-1 left-1 bg-gray-900/90 text-white text-[10px] px-1.5 py-0.5 rounded z-10 font-medium">
                  Slot {index + 1}
                </div>

                {/* Admin Action Buttons */}
                {isAdmin && member && (
                  <div className="absolute top-1 right-1 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    {/* Swap Button */}
                    {pokemon.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSwappingMember(member);
                          setSwapDialogOpen(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs w-5 h-5 rounded flex items-center justify-center shadow-sm"
                        title="Pokemon tauschen"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </button>
                    )}
                    {/* Remove Button */}
                    {onRemoveFromTeam && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromTeam(member.route.id);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs w-5 h-5 rounded flex items-center justify-center shadow-sm"
                        title="Aus Team entfernen"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {member ? (
                  <>
                    <div
                      className={`h-full ${isAdmin ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (isAdmin) {
                          evolution.openMenu(member.id, member.pokemon.pokedexId);
                        }
                      }}
                    >
                      <PokemonCard
                        pokemon={member.pokemon}
                        nickname={member.nickname}
                        size="tiny"
                        priority={index < 6} // Performance: Above-the-fold Bilder priorisieren
                        stats={{
                          hp: member.pokemon.hp,
                          attack: member.pokemon.attack,
                          defense: member.pokemon.defense,
                          spAttack: member.pokemon.spAttack,
                          spDefense: member.pokemon.spDefense,
                          speed: member.pokemon.speed,
                        }}
                        showBPSum={true}
                        showStatsOnHover={true}
                      />
                    </div>

                    {/* Evolution-Menue */}
                    {isAdmin && evolution.openEncounterId === member.id && (
                      <EvolutionMenu
                        evolutionData={evolution.evolutionData}
                        isLoading={evolution.isLoading}
                        isEvolving={evolution.isEvolving}
                        onEvolve={(targetId) => evolution.evolve(member.id, targetId)}
                        onClose={evolution.closeMenu}
                        menuRef={evolution.menuRef}
                        className="absolute z-50 top-10 left-1/2 -translate-x-1/2 max-w-[280px]"
                      />
                    )}
                  </>
                ) : (
                  <div className="bg-[var(--background-tertiary)] rounded-xl p-3 min-h-[180px] flex items-center justify-center border-2 border-dashed border-[var(--border-default)] transition-all duration-300 hover:border-[var(--player-color)] hover:bg-[var(--background-secondary)]">
                    <span className="text-[var(--text-tertiary)] text-xs font-medium">Leer</span>
                  </div>
                )}
              </div>
              
              {/* Routen-Name - nur anzeigen wenn vorhanden */}
              {member && member.route.name && (
                <div className="mt-1.5 flex items-start justify-center">
                  <p className="text-[10px] text-center text-[var(--text-secondary)] font-medium leading-tight line-clamp-2">
                    {member.route.name}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Defensive Coverage Matrix */}
        {filledMembers.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[var(--border-default)]">
            <DefensiveCoverageMatrix
              teamMembers={filledMembers}
              playerColor={playerColor}
            />
          </div>
        )}
      </div>

      {/* Pokemon Swap Dialog */}
      <PokemonSwapDialog
        key={`team-swap-${swapDialogOpen ? swappingMember?.id ?? 'none' : 'closed'}`}
        isOpen={swapDialogOpen}
        onClose={() => {
          setSwapDialogOpen(false);
          setSwappingMember(null);
        }}
        onConfirm={handleSwapPokemon}
        currentPokemon={swappingMember?.pokemon}
        pokemon={pokemon}
        isLoading={swapping}
      />
    </>
  );
}
