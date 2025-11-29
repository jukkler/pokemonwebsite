/**
 * Team-Display Komponente
 * Zeigt das aktuelle Team eines Spielers an (6 Slots)
 * Neues System: Basiert auf Encounters mit teamSlot
 */

'use client';

import React from 'react';
import PokemonCard from './PokemonCard';
import TypeBadge from './ui/TypeBadge';
import {
  allPokemonTypes,
  getDefenseMultiplier,
  getGermanTypeName,
  parseTypes,
} from '@/lib/typeEffectiveness';

interface TeamEncounter {
  id: number;
  teamSlot: number | null;
  nickname: string | null;
  pokemon: {
    pokedexId: number;
    name: string;
    nameGerman: string | null;
    types: string;
    spriteUrl: string | null;
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  route: {
    id: number;
    name: string;
  };
}

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
  teamMembers: TeamEncounter[]; // Jetzt Encounters mit teamSlot
  routes: Route[];
  isAdmin?: boolean;
  onRemoveFromTeam?: (routeId: number) => void;
}

const analyzeTeamMatchups = (members: TeamEncounter[]): {
  noResistances: string[];
  noEffectiveAttacks: string[];
} => {
  if (members.length === 0) {
    return { noResistances: [], noEffectiveAttacks: [] };
  }

  const noResistances: string[] = [];
  const noEffectiveAttacks: string[] = [];

  allPokemonTypes.forEach((attackType) => {
    const multipliers = members.map((member) => {
      const defenderTypes = parseTypes(member.pokemon.types);
      return getDefenseMultiplier(defenderTypes, attackType);
    });

    const hasResistance = multipliers.some((multiplier) => multiplier < 1);
    const hasNeutral = multipliers.some((multiplier) => multiplier === 1);
    const allWeak = multipliers.length > 0 && multipliers.every((multiplier) => multiplier > 1);

    if (!hasResistance && !hasNeutral && allWeak) {
      noResistances.push(attackType);
    }

    const hasEffectiveAttack = members.some((member) => {
      const attackerTypes = parseTypes(member.pokemon.types);
      return attackerTypes.some(
        (memberAttackType) =>
          getDefenseMultiplier([attackType], memberAttackType) > 1
      );
    });

    if (!hasEffectiveAttack) {
      noEffectiveAttacks.push(attackType);
    }
  });

  return { noResistances, noEffectiveAttacks };
};

interface TooltipProps {
  items: { routeName: string; pokemonNames: string[] }[];
  children: React.ReactNode;
}

function Tooltip({ items, children }: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (items.length === 0) {
    return <>{children}</>;
  }

  return (
    <div className="relative group">
      <div onClick={() => setIsOpen(!isOpen)}>
        {children}
      </div>
      {/* Hover-Tooltip (nur wenn nicht per Klick geöffnet) */}
      {!isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 max-w-xs max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index}>
                  <div className="font-semibold">{item.routeName}:</div>
                  <div className="ml-2 text-gray-300">
                    {item.pokemonNames.join(', ')}
                  </div>
                </div>
              ))}
            </div>
            {/* Tooltip-Pfeil */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
      {/* Klick-Tooltip (dauerhaft geöffnet mit X-Button) */}
      {isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 max-w-xs max-h-64 overflow-y-auto relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="absolute top-2 right-2 text-white hover:text-gray-300 transition"
              aria-label="Tooltip schließen"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="space-y-2 pr-6">
              {items.map((item, index) => (
                <div key={index}>
                  <div className="font-semibold">{item.routeName}:</div>
                  <div className="ml-2 text-gray-300">
                    {item.pokemonNames.join(', ')}
                  </div>
                </div>
              ))}
            </div>
            {/* Tooltip-Pfeil */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamDisplay({
  playerName,
  playerColor,
  teamMembers,
  routes,
  isAdmin = false,
  onRemoveFromTeam,
}: TeamDisplayProps) {
  // Erstelle Array mit 6 Slots basierend auf teamSlot
  const slots: (TeamEncounter | null)[] = Array.from({ length: 6 }, (_, i) => {
    const slotNumber = i + 1;
    return teamMembers.find((tm) => tm.teamSlot === slotNumber) ?? null;
  });

  // Berechne Durchschnitt der Basispunkte für das Team
  const calculateTeamAverage = () => {
    const filledSlots = slots.filter(slot => slot !== null) as TeamEncounter[];
    if (filledSlots.length === 0) return null;
    
    let totalHP = 0;
    let totalAttack = 0;
    let totalDefense = 0;
    let totalSpAttack = 0;
    let totalSpDefense = 0;
    let totalSpeed = 0;
    let totalBase = 0;

    filledSlots.forEach((member) => {
      const p = member.pokemon;
      totalHP += p.hp;
      totalAttack += p.attack;
      totalDefense += p.defense;
      totalSpAttack += p.spAttack;
      totalSpDefense += p.spDefense;
      totalSpeed += p.speed;
      totalBase += p.hp + p.attack + p.defense + p.spAttack + p.spDefense + p.speed;
    });

    const count = filledSlots.length;
    return {
      hp: Math.round(totalHP / count),
      attack: Math.round(totalAttack / count),
      defense: Math.round(totalDefense / count),
      spAttack: Math.round(totalSpAttack / count),
      spDefense: Math.round(totalSpDefense / count),
      speed: Math.round(totalSpeed / count),
      total: Math.round(totalBase / count),
      count: count,
    };
  };

  const teamAverage = calculateTeamAverage();
  const filledMembers = slots.filter((slot): slot is TeamEncounter => slot !== null);
  const { noResistances, noEffectiveAttacks } = analyzeTeamMatchups(filledMembers);

  // Berechne K.O. Counter: Wie viele K.O.-Routen hat dieser Spieler verursacht?
  const calculateKoCount = () => {
    let koCount = 0;
    routes.forEach((route) => {
      // Prüfe, ob die Route K.O. ist und ob dieser Spieler der Verursacher ist
      const firstEncounter = route.encounters[0];
      if (firstEncounter && firstEncounter.isKnockedOut && firstEncounter.koCausedBy === playerName) {
        koCount++;
      }
    });
    return koCount;
  };

  const koCount = calculateKoCount();

  // Berechne "Nicht gefangen" Counter: Wie viele "Nicht gefangen"-Routen hat dieser Spieler verursacht?
  const calculateNotCaughtCount = () => {
    let notCaughtCount = 0;
    routes.forEach((route) => {
      const firstEncounter = route.encounters[0];
      if (firstEncounter && firstEncounter.isNotCaught && firstEncounter.notCaughtBy === playerName) {
        notCaughtCount++;
      }
    });
    return notCaughtCount;
  };

  const notCaughtCount = calculateNotCaughtCount();

  // Sammle betroffene Pokémon für K.O.s, gruppiert nach Route
  const getKnockedOutPokemon = (): { routeName: string; pokemonNames: string[] }[] => {
    const routeMap = new Map<string, string[]>();
    routes.forEach((route) => {
      route.encounters.forEach((encounter) => {
        if (encounter.isKnockedOut && encounter.koCausedBy === playerName) {
          const pokemonName = encounter.pokemon.nameGerman || encounter.pokemon.name;
          if (!routeMap.has(route.name)) {
            routeMap.set(route.name, []);
          }
          routeMap.get(route.name)!.push(pokemonName);
        }
      });
    });
    return Array.from(routeMap.entries()).map(([routeName, pokemonNames]) => ({
      routeName,
      pokemonNames,
    }));
  };

  // Sammle betroffene Pokémon für "Nicht gefangen", gruppiert nach Route
  const getNotCaughtPokemon = (): { routeName: string; pokemonNames: string[] }[] => {
    const routeMap = new Map<string, string[]>();
    routes.forEach((route) => {
      route.encounters.forEach((encounter) => {
        if (encounter.isNotCaught && encounter.notCaughtBy === playerName) {
          const pokemonName = encounter.pokemon.nameGerman || encounter.pokemon.name;
          if (!routeMap.has(route.name)) {
            routeMap.set(route.name, []);
          }
          routeMap.get(route.name)!.push(pokemonName);
        }
      });
    });
    return Array.from(routeMap.entries()).map(([routeName, pokemonNames]) => ({
      routeName,
      pokemonNames,
    }));
  };

  const knockedOutPokemon = getKnockedOutPokemon();
  const notCaughtPokemon = getNotCaughtPokemon();

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-5 border border-gray-200">
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-2">
        {slots.map((member, index) => (
          <div key={index} className="flex flex-col">
            <div className="relative group flex-1 min-h-[220px]">
              <div className="absolute top-1 left-1 bg-gray-900 text-white text-xs px-2 py-1 rounded-md z-10 font-medium">
                Slot {index + 1}
              </div>
              
              {/* Admin: Remove Button */}
              {isAdmin && member && onRemoveFromTeam && (
                <button
                  onClick={() => onRemoveFromTeam(member.route.id)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white text-xs w-6 h-6 rounded-md z-10 flex items-center justify-center transition opacity-0 group-hover:opacity-100 shadow-sm"
                  title="Aus Team entfernen"
                >
                  ✕
                </button>
              )}
              
              {member ? (
                <div className="h-full min-h-[220px]">
                  <PokemonCard
                    pokemon={member.pokemon}
                    nickname={member.nickname}
                    size="small"
                  />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 h-full min-h-[220px] flex items-center justify-center border-2 border-dashed border-gray-300">
                  <span className="text-gray-400 text-sm font-medium">Leer</span>
                </div>
              )}
            </div>
            {/* Routen-Name außerhalb der Karte, damit alle auf gleicher Höhe sind */}
            <div className="mt-2 min-h-[32px] flex items-start justify-center">
              <p className="text-xs text-center text-gray-600 font-medium leading-tight">
                {member ? member.route.name : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

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

function MatchupSection({
  title,
  types,
  emptyMessage,
}: {
  title: string;
  types: string[];
  emptyMessage: string;
}) {
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

