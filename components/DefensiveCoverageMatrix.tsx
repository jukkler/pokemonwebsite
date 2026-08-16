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
  const baseClasses = 'text-center text-[10px] lg:text-xs font-black border transition-opacity duration-200';

  if (multiplier === 0) {
    // Immun
    return `${baseClasses} bg-[var(--brand-blue)] text-white border-[var(--brand-blue)]`;
  }
  if (multiplier < 1) {
    // Resistent (0.25x, 0.5x)
    return `${baseClasses} bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/40`;
  }
  if (multiplier === 1) {
    // Neutral
    return `${baseClasses} bg-[var(--background-tertiary)] text-[var(--text-tertiary)]`;
  }
  if (multiplier === 2) {
    // Schwach
    return `${baseClasses} bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/40`;
  }
  if (multiplier === 4) {
    // Sehr schwach
    return `${baseClasses} bg-[var(--brand-red)] text-white border-[var(--brand-red)] border-2`;
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
  const accentStyle = playerColor
    ? ({ borderColor: `${playerColor}55` } as React.CSSProperties)
    : undefined;

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
    <div className="w-full" style={accentStyle}>
      {/* Collapsible Header */}
      {collapsible ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="app-band mb-4 flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[var(--background-secondary)]"
          aria-expanded={isExpanded}
        >
          <div className="text-left">
            <h3 className="app-section-title text-lg">Defensive Abdeckung</h3>
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
          <h3 className="app-section-title mb-1">Defensive Abdeckung</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Typ-Effektivität gegen ausgewählte Pokémon
          </p>
        </div>
      )}

      {(isExpanded || !collapsible) && (
        <>
          {/* Filter Toggle-Buttons */}
          <div className="app-toolbar mb-4 flex gap-2">
            <button
              onClick={() => setShowWeak(!showWeak)}
              className={`app-action text-sm ${
                showWeak
                  ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                  : 'hover:border-[var(--brand-red)]'
              }`}
            >
              Schwächen
            </button>
            <button
              onClick={() => setShowResist(!showResist)}
              className={`app-action text-sm ${
                showResist
                  ? 'border-[var(--brand-green)] bg-[var(--brand-green)] text-white'
                  : 'hover:border-[var(--brand-green)]'
              }`}
            >
              Resistenzen
            </button>
          </div>

          {/* Matrix Table - Desktop: volle Breite, Mobile: Scroll */}
          <div className="overflow-x-auto border-y border-[var(--border-default)]">
            <table className="app-data-table min-w-[900px] w-full border-collapse lg:min-w-0">
              <thead>
                <tr className="sticky top-0 z-10 bg-[var(--brand-navy)] text-white">
                  {/* Pokemon-Spalten-Header */}
                  <th className="sticky left-0 z-20 w-24 border-b border-r border-white/20 bg-[var(--brand-navy)] px-2 py-2 text-left text-xs font-black uppercase tracking-widest text-white lg:w-32">
                    POKÉMON
                  </th>

                  {/* Typ-Spalten-Header */}
                  {allPokemonTypes.map((type) => (
                    <th
                      key={type}
                      className="px-0.5 lg:px-1 py-1.5 text-center border-b border-[var(--border-default)]"
                    >
                      <div
                        className="mx-auto flex h-7 w-7 items-center justify-center lg:h-8 lg:w-8"
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
                    className="h-12 transition-colors hover:bg-[var(--background-secondary)]"
                  >
                    {/* Pokemon-Name (Sticky erste Spalte) */}
                    <td className="px-2 py-2 text-xs font-medium text-[var(--foreground)] border-b border-r border-[var(--border-default)] bg-[var(--card-bg)] sticky left-0 z-10 h-12">
                      {member ? (
                        <div className="flex items-center gap-1">
                          {member.pokemon.spriteUrl && (
                            <Image
                              src={member.pokemon.spriteUrl}
                              alt={member.pokemon.name}
                              width={24}
                              height={24}
                              className="w-5 h-5 lg:w-6 lg:h-6 pixelated flex-shrink-0"
                              unoptimized
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
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 border border-[var(--brand-blue)] bg-[var(--brand-blue)]"></div>
              <span>0x = Immun</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 border border-emerald-500 bg-emerald-500/10"></div>
              <span>½x = Resistent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 border border-red-500 bg-red-500/10"></div>
              <span>2x = Schwach</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 border-2 border-[var(--brand-red)] bg-[var(--brand-red)]"></div>
              <span>4x = Sehr schwach</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
