/**
 * Team-Utils: Gemeinsame Berechnungen für Teams und Routen
 */

import { allPokemonTypes, getDefenseMultiplier, parseTypes } from './typeEffectiveness';
import type { TeamStats, TeamMatchupAnalysis, Pokemon, PokemonStats } from './types';

/**
 * Berechnet Durchschnittswerte für eine Gruppe von Pokémon
 */
export function calculateAverageStats(
  members: { pokemon: PokemonStats }[]
): TeamStats | null {
  if (members.length === 0) return null;

  let totalHP = 0;
  let totalAttack = 0;
  let totalDefense = 0;
  let totalSpAttack = 0;
  let totalSpDefense = 0;
  let totalSpeed = 0;
  let totalBase = 0;

  members.forEach(({ pokemon: p }) => {
    totalHP += p.hp;
    totalAttack += p.attack;
    totalDefense += p.defense;
    totalSpAttack += p.spAttack;
    totalSpDefense += p.spDefense;
    totalSpeed += p.speed;
    totalBase += p.hp + p.attack + p.defense + p.spAttack + p.spDefense + p.speed;
  });

  const count = members.length;
  return {
    hp: Math.round(totalHP / count),
    attack: Math.round(totalAttack / count),
    defense: Math.round(totalDefense / count),
    spAttack: Math.round(totalSpAttack / count),
    spDefense: Math.round(totalSpDefense / count),
    speed: Math.round(totalSpeed / count),
    total: Math.round(totalBase / count),
    count,
  };
}

/**
 * Analysiert Team-Matchups (Schwächen und fehlende Attacken)
 */
export function analyzeTeamMatchups(
  members: { pokemon: { types: string } }[]
): TeamMatchupAnalysis {
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

    const hasResistance = multipliers.some((m) => m < 1);
    const hasNeutral = multipliers.some((m) => m === 1);
    const allWeak = multipliers.length > 0 && multipliers.every((m) => m > 1);

    if (!hasResistance && !hasNeutral && allWeak) {
      noResistances.push(attackType);
    }

    const hasEffectiveAttack = members.some((member) => {
      const attackerTypes = parseTypes(member.pokemon.types);
      return attackerTypes.some(
        (memberAttackType) => getDefenseMultiplier([attackType], memberAttackType) > 1
      );
    });

    if (!hasEffectiveAttack) {
      noEffectiveAttacks.push(attackType);
    }
  });

  return { noResistances, noEffectiveAttacks };
}

/**
 * Zählt K.O.s und Nicht-Gefangen für einen Spieler
 */
export function countPlayerStats(
  playerName: string,
  routes: {
    name: string;
    encounters: {
      isKnockedOut: boolean;
      koCausedBy: string | null;
      isNotCaught: boolean;
      notCaughtBy: string | null;
      pokemon: { name: string; nameGerman: string | null };
    }[];
  }[]
): {
  koCount: number;
  notCaughtCount: number;
  knockedOutPokemon: { routeName: string; pokemonNames: string[] }[];
  notCaughtPokemon: { routeName: string; pokemonNames: string[] }[];
} {
  let koCount = 0;
  let notCaughtCount = 0;
  const koRouteMap = new Map<string, string[]>();
  const notCaughtRouteMap = new Map<string, string[]>();

  routes.forEach((route) => {
    route.encounters.forEach((encounter) => {
      const pokemonName = encounter.pokemon.nameGerman || encounter.pokemon.name;

      if (encounter.isKnockedOut && encounter.koCausedBy === playerName) {
        koCount++;
        if (!koRouteMap.has(route.name)) {
          koRouteMap.set(route.name, []);
        }
        koRouteMap.get(route.name)!.push(pokemonName);
      }

      if (encounter.isNotCaught && encounter.notCaughtBy === playerName) {
        notCaughtCount++;
        if (!notCaughtRouteMap.has(route.name)) {
          notCaughtRouteMap.set(route.name, []);
        }
        notCaughtRouteMap.get(route.name)!.push(pokemonName);
      }
    });
  });

  return {
    koCount,
    notCaughtCount,
    knockedOutPokemon: Array.from(koRouteMap.entries()).map(([routeName, pokemonNames]) => ({
      routeName,
      pokemonNames,
    })),
    notCaughtPokemon: Array.from(notCaughtRouteMap.entries()).map(([routeName, pokemonNames]) => ({
      routeName,
      pokemonNames,
    })),
  };
}

/**
 * Erstellt ein Array mit 6 Team-Slots
 */
export function createTeamSlots<T extends { teamSlot: number | null }>(
  members: T[]
): (T | null)[] {
  return Array.from({ length: 6 }, (_, i) => {
    const slotNumber = i + 1;
    return members.find((tm) => tm.teamSlot === slotNumber) ?? null;
  });
}

/**
 * Filtert Pokémon nach Suchbegriff
 */
export function filterPokemonBySearch<T extends { name: string; nameGerman: string | null; pokedexId: number }>(
  pokemon: T[],
  search: string,
  limit: number = 8
): T[] {
  if (!search.trim()) return [];
  
  const searchLower = search.toLowerCase();
  return pokemon
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.nameGerman?.toLowerCase().includes(searchLower) ||
        p.pokedexId.toString().includes(search)
    )
    .slice(0, limit);
}
