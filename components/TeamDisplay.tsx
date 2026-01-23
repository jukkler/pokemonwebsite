/**
 * Team-Display Komponente
 * Zeigt das aktuelle Team eines Spielers an (6 Slots)
 */

'use client';

import React, { useState } from 'react';
import PokemonCard from './PokemonCard';
import EvolutionMenu from './EvolutionMenu';
import TypeBadge from './ui/TypeBadge';
import { useEvolutionMenu } from '@/lib/hooks/useEvolutionMenu';
import { useOutsideClick } from '@/lib/hooks/useOutsideClick';
import { calculateAverageStats, analyzeTeamMatchups, countPlayerStats, createTeamSlots } from '@/lib/team-utils';
import type { TeamEncounter, RouteWithEncounters, TooltipItem } from '@/lib/types';

// =============================================================================
// Sub-Komponenten
// =============================================================================

interface TooltipProps {
  items: TooltipItem[];
  children: React.ReactNode;
}

function Tooltip({ items, children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 max-w-xs max-h-64 overflow-y-auto">
      {isOpen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="absolute top-2 right-2 text-white hover:text-gray-300 transition"
          aria-label="Tooltip schließen"
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
            <div className="ml-2 text-gray-300">{item.pokemonNames.join(', ')}</div>
          </div>
        ))}
      </div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
        <div className="border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );

  return (
    <div className="relative group">
      <div onClick={() => setIsOpen(!isOpen)}>{children}</div>
      {!isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          {tooltipContent}
        </div>
      )}
      {isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 relative">
          {tooltipContent}
        </div>
      )}
    </div>
  );
}

interface MatchupSectionProps {
  title: string;
  types: string[];
  emptyMessage: string;
}

function MatchupSection({ title, types, emptyMessage }: MatchupSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {types.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <TypeBadge key={`${title}-${type}`} type={type} size="sm" />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
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
}

export default function TeamDisplay({
  playerName,
  playerColor,
  teamMembers,
  routes,
  isAdmin = false,
  onRemoveFromTeam,
  onEvolution,
}: TeamDisplayProps) {
  // Evolution-Hook
  const evolution = useEvolutionMenu(onEvolution);
  useOutsideClick(evolution.menuRef, evolution.closeMenu, evolution.openEncounterId !== null);

  // Berechnungen
  const slots = createTeamSlots(teamMembers);
  const filledMembers = slots.filter((slot): slot is TeamEncounter => slot !== null);
  const teamAverage = calculateAverageStats(filledMembers);
  const { noResistances, noEffectiveAttacks } = analyzeTeamMatchups(filledMembers);
  const { koCount, notCaughtCount, knockedOutPokemon, notCaughtPokemon } = countPlayerStats(playerName, routes);

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-5 border border-gray-200 overflow-visible">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: playerColor }}
          />
          <h2 className="text-2xl font-semibold text-gray-900">{playerName}</h2>
          
          {teamAverage && (
            <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium border border-blue-200">
              ⌀ Gesamt-BP: {teamAverage.total}
            </span>
          )}
          
          {koCount > 0 && (
            <Tooltip items={knockedOutPokemon}>
              <span className="text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-full font-medium border border-red-200 cursor-help">
                💀 K.O.s: {koCount}
              </span>
            </Tooltip>
          )}
          
          {notCaughtCount > 0 && (
            <Tooltip items={notCaughtPokemon}>
              <span className="text-sm bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full font-medium border border-yellow-200 cursor-help">
                ⚠️ Nicht gefangen: {notCaughtCount}
              </span>
            </Tooltip>
          )}
        </div>
        
        {teamAverage && (
          <div className="text-sm font-medium text-gray-600">
            {teamAverage.count} von 6 Pokémon
          </div>
        )}
      </div>

      {/* Team-Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-2 overflow-visible">
        {slots.map((member, index) => (
          <div key={index} className="flex flex-col overflow-visible">
            <div className="relative group flex-1 min-h-[220px] overflow-visible">
              {/* Slot-Nummer */}
              <div className="absolute top-1 left-1 bg-gray-900 text-white text-xs px-2 py-1 rounded-md z-10 font-medium">
                Slot {index + 1}
              </div>

              {/* Remove-Button */}
              {isAdmin && member && onRemoveFromTeam && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromTeam(member.route.id);
                  }}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white text-xs w-6 h-6 rounded-md z-10 flex items-center justify-center transition opacity-0 group-hover:opacity-100 shadow-sm"
                  title="Aus Team entfernen"
                >
                  ✕
                </button>
              )}

              {member ? (
                <>
                  <div
                    className={`h-full min-h-[220px] ${isAdmin ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (isAdmin) {
                        evolution.openMenu(member.id, member.pokemon.pokedexId);
                      }
                    }}
                  >
                    <PokemonCard
                      pokemon={member.pokemon}
                      nickname={member.nickname}
                      size="small"
                    />
                  </div>

                  {/* Evolution-Menü */}
                  {isAdmin && evolution.openEncounterId === member.id && (
                    <EvolutionMenu
                      evolutionData={evolution.evolutionData}
                      isLoading={evolution.isLoading}
                      isEvolving={evolution.isEvolving}
                      onEvolve={(targetId) => evolution.evolve(member.id, targetId)}
                      menuRef={evolution.menuRef}
                      className="absolute z-50 top-10 left-1/2 -translate-x-1/2 max-w-[280px]"
                    />
                  )}
                </>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 h-full min-h-[220px] flex items-center justify-center border-2 border-dashed border-gray-300">
                  <span className="text-gray-400 text-sm font-medium">Leer</span>
                </div>
              )}
            </div>
            
            {/* Routen-Name */}
            <div className="mt-2 min-h-[32px] flex items-start justify-center">
              <p className="text-xs text-center text-gray-600 font-medium leading-tight">
                {member ? member.route.name : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Matchup-Analyse */}
      {teamAverage && noEffectiveAttacks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <MatchupSection
            title="Keine effektiven Attacken"
            types={noEffectiveAttacks}
            emptyMessage="Für alle Typen existiert eine effektive Attacke."
          />
        </div>
      )}
    </div>
  );
}
