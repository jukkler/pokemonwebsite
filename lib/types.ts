/**
 * Gemeinsame Type-Definitionen für die gesamte Anwendung
 */

/**
 * Basis-Typen für API-Responses
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success?: boolean;
}

/**
 * Erweiterte Types für Pokemon-Daten
 */
export type PokemonType = string;

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

/**
 * Prisma-generierte Types (werden von Prisma Client generiert)
 * Diese sind hier nur als Referenz aufgeführt
 */

// Diese Types werden automatisch von Prisma generiert
// import type { Player, Route, Pokemon, Encounter, TeamMember } from '@prisma/client';

