/**
 * Team-Display Komponente
 * Zeigt das aktuelle Team eines Spielers an (6 Slots)
 * Neues System: Basiert auf Encounters mit teamSlot
 */

'use client';

import PokemonCard from './PokemonCard';
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: playerColor }}
          />
          <h2 className="text-2xl font-bold">{playerName}</h2>
          {teamAverage && (
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
              ⌀ Gesamt-BP: {teamAverage.total}
            </span>
          )}
          {koCount > 0 && (
            <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
              💀 K.O.s: {koCount}
            </span>
          )}
          {notCaughtCount > 0 && (
            <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">
              ⚠️ Nicht gefangen: {notCaughtCount}
            </span>
          )}
        </div>
        {teamAverage && (
          <div className="text-sm text-gray-600">
            {teamAverage.count} von 6 Pokémon
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {slots.map((member, index) => (
          <div key={index} className="relative group">
            <div className="absolute top-0 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded-br-lg z-10">
              Slot {index + 1}
            </div>
            
            {/* Admin: Remove Button */}
            {isAdmin && member && onRemoveFromTeam && (
              <button
                onClick={() => onRemoveFromTeam(member.route.id)}
                className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white text-xs w-6 h-6 rounded-bl-lg rounded-tr-lg z-10 flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                title="Aus Team entfernen"
              >
                ✕
              </button>
            )}
            
            {member ? (
              <div>
                <PokemonCard
                  pokemon={member.pokemon}
                  nickname={member.nickname}
                  size="small"
                />
                <p className="text-xs text-center text-gray-500 mt-1">
                  {member.route.name}
                </p>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 h-full flex items-center justify-center border-2 border-dashed border-gray-300">
                <span className="text-gray-400 text-sm">Leer</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {teamAverage && noEffectiveAttacks.length > 0 && (
        <div className="mt-6 space-y-4">
          <MatchupSection
            title="Keine effektiven Attacken"
            types={noEffectiveAttacks}
            badgeClass="bg-red-100 text-red-800"
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
  badgeClass,
  emptyMessage,
}: {
  title: string;
  types: string[];
  badgeClass: string;
  emptyMessage: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      {types.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <span
              key={`${title}-${type}`}
              className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeClass}`}
            >
              {getGermanTypeName(type)}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      )}
    </div>
  );
}

