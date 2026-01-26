/**
 * Gemeinsame Type-Definitionen für die gesamte Anwendung
 * Zentrale Stelle für alle wiederverwendbaren Types
 */

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success?: boolean;
}

export interface ApiError {
  error: string;
}

export interface ApiSuccess<T = unknown> {
  data?: T;
  success?: boolean;
}

// =============================================================================
// Pokemon Types
// =============================================================================

export type PokemonType = 
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface PokemonBase {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  types: string;
  spriteUrl: string | null;
  spriteGifUrl?: string | null;
}

export interface Pokemon extends PokemonBase, PokemonStats {
  id?: number;
}

export interface PokemonListItem {
  id: number;
  pokedexId: number;
  name: string;
  nameGerman: string | null;
}

// =============================================================================
// Evolution Types
// =============================================================================

export interface EvolutionOption {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  spriteUrl: string | null;
  spriteGifUrl?: string | null;
}

export interface EvolutionChainResult {
  preEvolutions: EvolutionOption[];
  evolutions: EvolutionOption[];
}

// =============================================================================
// Player Types
// =============================================================================

export interface PlayerBase {
  id: number;
  name: string;
  color: string;
  avatar?: string | null;
}

export interface Player extends PlayerBase {
  encounters: PlayerEncounter[];
}

// =============================================================================
// Route Types
// =============================================================================

export interface RouteBase {
  id: number;
  name: string;
  order?: number;
}

export interface Route extends RouteBase {
  encounters: RouteEncounter[];
}

// Für TeamDisplay: Vereinfachte Route-Info
export interface RouteInfo {
  id: number;
  name: string;
}

// Für RouteList: Route mit Encounter-Metadaten
export interface RouteWithEncounters extends RouteBase {
  order: number;
  encounters: EncounterWithMeta[];
}

// =============================================================================
// Encounter Types
// =============================================================================

export interface EncounterBase {
  id: number;
  nickname: string | null;
  teamSlot: number | null;
}

// Für Player-Liste: Encounter mit Pokemon und Route
export interface PlayerEncounter extends EncounterBase {
  pokemon: Pokemon;
  route: RouteInfo;
}

// Für Route-Liste: Encounter mit Pokemon, Player und Status
export interface RouteEncounter extends EncounterBase {
  pokemon: PokemonBase;
  player: PlayerBase;
}

// Vollständiger Encounter mit allen Metadaten
export interface EncounterWithMeta extends EncounterBase {
  isKnockedOut: boolean;
  koCausedBy: string | null;
  koReason: string | null;
  koDate: string | null;
  isNotCaught: boolean;
  notCaughtBy: string | null;
  notCaughtReason: string | null;
  notCaughtDate: string | null;
  player: PlayerBase;
  pokemon: Pokemon;
}

// Für Team-Analyse: Encounter mit K.O./Nicht-Gefangen-Status
export interface TeamEncounter extends EncounterBase {
  pokemon: Pokemon;
  route: RouteInfo;
}

// =============================================================================
// Team Analysis Types
// =============================================================================

export interface TeamStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  total: number;
  count: number;
}

export interface TeamMatchupAnalysis {
  noResistances: string[];
  noEffectiveAttacks: string[];
}

// =============================================================================
// Tooltip / UI Types
// =============================================================================

export interface TooltipItem {
  routeName: string;
  pokemonNames: string[];
}

// =============================================================================
// Form / Dialog Types
// =============================================================================

export interface KoFormData {
  causedBy: string;
  reason: string;
}

export interface NotCaughtFormData {
  causedBy: string;
  reason: string | null;
}