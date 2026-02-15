'use client';

/**
 * DefensiveCoverageMatrix - Typ-Effektivitäts-Matrix für Team-Pokémon
 * Zeigt defensive Matchups aller Team-Member gegen alle 18 Pokémon-Typen
 */

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { parseTypes, getDefenseMultiplier, allPokemonTypes } from '@/lib/typeEffectiveness';
import { getTypeColor } from '@/lib/design-tokens';
import type { TeamEncounter } from '@/lib/types';

interface DefensiveCoverageMatrixProps {
  teamMembers: TeamEncounter[];
  playerColor?: string;
  collapsible?: boolean;
  maxSlots?: number;
}

// Formatiert Multiplikator für Anzeige
function formatMultiplier(multiplier: number): string {
  if (multiplier === 0) return '0';
  if (multiplier === 0.25) return '¼x';
  if (multiplier === 0.5) return '½x';
  if (multiplier === 1) return '—';
  if (multiplier === 2) return '2x';
  if (multiplier === 4) return '4x';
  return `${multiplier}x`;
}

// Gibt CSS-Klassen für Zelle basierend auf Multiplikator zurück
function getCellStyle(multiplier: number): string {
  const baseClasses = 'text-center text-[10px] lg:text-xs font-medium border transition-all duration-200';

  if (multiplier === 0) {
    // Immun
    return `${baseClasses} bg-slate-700/30 text-slate-300 border-slate-600/50`;
  }
  if (multiplier < 1) {
    // Resistent (0.25x, 0.5x)
    return `${baseClasses} bg-green-500/20 text-green-400 border-green-500/30`;
  }
  if (multiplier === 1) {
    // Neutral
    return `${baseClasses} bg-[var(--background-tertiary)] text-[var(--text-tertiary)]`;
  }
  if (multiplier === 2) {
    // Schwach
    return `${baseClasses} bg-red-500/20 text-red-400 border-red-500/30`;
  }
  if (multiplier === 4) {
    // Sehr schwach
    return `${baseClasses} bg-red-600/30 text-red-300 border-red-600/50 border-2 font-bold`;
  }

  // Fallback
  return `${baseClasses} bg-[var(--background-tertiary)] text-[var(--text-tertiary)]`;
}

// Gibt Opacity-Klassen für Filter zurück
function getCellOpacity(multiplier: number, showWeak: boolean, showResist: boolean): string {
  if (!showWeak && !showResist) {
    return 'opacity-100'; // Beide Filter aus
  }

  const isWeak = multiplier > 1;
  const isResist = multiplier < 1;
  const isNeutral = multiplier === 1;

  // Nur Weak-Filter aktiv
  if (showWeak && !showResist) {
    return isWeak ? 'opacity-100' : 'opacity-40';
  }

  // Nur Resist-Filter aktiv
  if (!showWeak && showResist) {
    return isResist ? 'opacity-100' : 'opacity-40';
  }

  // Beide Filter aktiv
  if (showWeak && showResist) {
    return isNeutral ? 'opacity-30' : 'opacity-100';
  }

  return 'opacity-100';
}

export default function DefensiveCoverageMatrix({
  teamMembers,
  playerColor,
  collapsible = true,
  maxSlots = 0,
}: DefensiveCoverageMatrixProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const [showWeak, setShowWeak] = useState(false);
  const [showResist, setShowResist] = useState(false);

  // Berechne Matrix-Daten (memoized für Performance)
  const matrixData = useMemo(() => {
    const data: Array<{
      member: TeamEncounter | null;
      matchups: Record<string, number>;
    }> = teamMembers.map((member) => {
      const defenderTypes = parseTypes(member.pokemon.types);
      const matchups = allPokemonTypes.reduce((acc, attackType) => {
        acc[attackType] = getDefenseMultiplier(defenderTypes, attackType);
        return acc;
      }, {} as Record<string, number>);
      return {
        member,
        matchups,
      };
    });

    // Füge leere Slots hinzu wenn maxSlots gesetzt ist
    if (maxSlots > 0) {
      const emptySlots = maxSlots - data.length;
      for (let i = 0; i < emptySlots; i++) {
        data.push({
          member: null,
          matchups: {},
        });
      }
    }

    return data;
  }, [teamMembers, maxSlots]);

  // Nur ausblenden wenn keine Pokemon UND maxSlots nicht gesetzt (collapsible mode)
  if (teamMembers.length === 0 && maxSlots === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Collapsible Header */}
      {collapsible ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] rounded-lg border border-[var(--border-default)] transition-all duration-200 mb-4"
        >
          <div className="text-left">
            <h3 className="text-lg font-bold text-[var(--foreground)]">Defensive Coverage</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Typ-Effektivität gegen aktuelle Team-Zusammensetzung
            </p>
          </div>
          <svg
            className={`w-5 h-5 text-[var(--foreground)] transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">Defensive Coverage</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Typ-Effektivität gegen ausgewählte Pokémon
          </p>
        </div>
      )}

      {(isExpanded || !collapsible) && (
        <>
          {/* Filter Toggle-Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowWeak(!showWeak)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                showWeak
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border-default)] hover:border-red-500'
              }`}
            >
              Weak
            </button>
            <button
              onClick={() => setShowResist(!showResist)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                showResist
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border-default)] hover:border-green-500'
              }`}
            >
              Resist
            </button>
          </div>

          {/* Matrix Table - Desktop: volle Breite, Mobile: Scroll */}
          <div className="overflow-x-auto rounded-lg border border-[var(--border-default)] bg-[var(--background-secondary)]">
            <table className="w-full border-collapse lg:min-w-0 min-w-[900px]">
              <thead>
                <tr className="bg-[var(--card-bg-elevated)] sticky top-0 z-10">
                  {/* Pokemon-Spalten-Header */}
                  <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] border-b border-r border-[var(--border-default)] bg-[var(--card-bg-elevated)] sticky left-0 z-20 w-24 lg:w-32">
                    POKÉMON
                  </th>

                  {/* Typ-Spalten-Header */}
                  {allPokemonTypes.map((type) => (
                    <th
                      key={type}
                      className="px-0.5 lg:px-1 py-1.5 text-center border-b border-[var(--border-default)]"
                    >
                      <div
                        className="flex items-center justify-center w-7 h-7 lg:w-8 lg:h-8 rounded-md mx-auto"
                        style={{ backgroundColor: getTypeColor(type) }}
                        title={type.charAt(0).toUpperCase() + type.slice(1)}
                      >
                        <Image
                          src={`/icons/types/${type}.svg`}
                          alt={type}
                          width={16}
                          height={16}
                          className="opacity-90"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.map(({ member, matchups }, index) => (
                  <tr
                    key={member?.id || `empty-${index}`}
                    className="hover:bg-[var(--background-tertiary)] transition-colors h-12"
                  >
                    {/* Pokemon-Name (Sticky erste Spalte) */}
                    <td className="px-2 py-2 text-xs font-medium text-[var(--foreground)] border-b border-r border-[var(--border-default)] bg-[var(--card-bg)] sticky left-0 z-10 h-12">
                      {member ? (
                        <div className="flex items-center gap-1">
                          {member.pokemon.spriteUrl && (
                            <img
                              src={member.pokemon.spriteUrl}
                              alt={member.pokemon.name}
                              className="w-5 h-5 lg:w-6 lg:h-6 pixelated flex-shrink-0"
                            />
                          )}
                          <span className="truncate text-[10px] lg:text-xs">
                            {member.nickname || member.pokemon.nameGerman || member.pokemon.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)] text-[10px] lg:text-xs italic">
                          Leer
                        </span>
                      )}
                    </td>

                    {/* Typ-Matchup Zellen */}
                    {allPokemonTypes.map((attackType) => {
                      const multiplier = member ? matchups[attackType] : 1;
                      return (
                        <td
                          key={attackType}
                          className={`${member ? getCellStyle(multiplier) : 'bg-[var(--background-tertiary)] text-[var(--text-tertiary)] text-center text-[10px] lg:text-xs font-medium border'} ${member ? getCellOpacity(
                            multiplier,
                            showWeak,
                            showResist
                          ) : 'opacity-30'} border-b border-[var(--border-default)] px-0.5 lg:px-1 py-1.5 lg:py-2`}
                        >
                          {member ? formatMultiplier(multiplier) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legende */}
          <div className="mt-3 flex flex-wrap gap-2 lg:gap-3 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-slate-700/30 border border-slate-600/50"></div>
              <span>0x = Immun</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
              <span>½x = Resistent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div>
              <span>2x = Schwach</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-600/30 border-2 border-red-600/50"></div>
              <span>4x = Sehr schwach</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
