/**
 * Validierung für importierte GameSave-Daten.
 * Wirft GameSaveValidationError bei ungültigem Schema.
 */

export class GameSaveValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameSaveValidationError';
  }
}

interface GameSaveEncounter {
  routeId: number;
  pokemonId: number;
  nickname?: string | null;
  teamSlot?: number | null;
  isKnockedOut?: boolean;
  koCausedBy?: string | null;
  koReason?: string | null;
  koDate?: string | null;
  isNotCaught?: boolean;
  notCaughtBy?: string | null;
  notCaughtReason?: string | null;
  notCaughtDate?: string | null;
}

interface GameSavePlayer {
  id: number;
  name: string;
  color: string;
  avatar?: string | null;
  encounters: GameSaveEncounter[];
}

interface GameSaveRoute {
  id: number;
  name: string;
  order: number;
}

interface GameSaveRunPlayerStats {
  playerName: string;
  knockedOutCount?: number;
  notCaughtCount?: number;
  isLoser?: boolean;
}

interface GameSaveRunEncounter {
  playerName: string;
  pokemonPokedexId: number;
  pokemonName: string;
  pokemonNameGerman?: string | null;
  routeName: string;
  nickname?: string | null;
  teamSlot?: number | null;
  isKnockedOut?: boolean;
  koCausedBy?: string | null;
  koReason?: string | null;
  koDate?: string | null;
  isNotCaught?: boolean;
  notCaughtBy?: string | null;
  notCaughtReason?: string | null;
  notCaughtDate?: string | null;
  caughtAt?: string | null;
}

interface GameSaveRun {
  runNumber: number;
  gameVersionKey?: string | null;
  status: 'active' | 'failed' | 'completed';
  loserPlayerName?: string | null;
  startedAt: string;
  endedAt?: string | null;
  badgesEarned?: number;
  pausedAt?: string | null;
  totalPausedMs?: number;
  playerStats?: GameSaveRunPlayerStats[];
  encounters?: GameSaveRunEncounter[];
}

export interface ValidatedGameSaveData {
  players: GameSavePlayer[];
  routes: GameSaveRoute[];
  runs?: GameSaveRun[];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new GameSaveValidationError(message);
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string';
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function isBooleanOrUndefined(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === 'boolean';
}

function isValidDateOrNullable(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'string') return false;
  return !Number.isNaN(new Date(value).getTime());
}

function validateEncounter(value: unknown, path: string): asserts value is GameSaveEncounter {
  assert(isObject(value), `${path} muss ein Objekt sein`);
  assert(isInteger(value.routeId) && value.routeId > 0, `${path}.routeId muss eine positive Zahl sein`);
  assert(isInteger(value.pokemonId) && value.pokemonId > 0, `${path}.pokemonId muss eine positive Zahl sein`);
  assert(isNullableString(value.nickname), `${path}.nickname muss string/null sein`);
  assert(value.teamSlot === undefined || value.teamSlot === null || (isInteger(value.teamSlot) && value.teamSlot >= 1 && value.teamSlot <= 6), `${path}.teamSlot muss null oder 1-6 sein`);
  assert(isBooleanOrUndefined(value.isKnockedOut), `${path}.isKnockedOut muss boolean sein`);
  assert(isNullableString(value.koCausedBy), `${path}.koCausedBy muss string/null sein`);
  assert(isNullableString(value.koReason), `${path}.koReason muss string/null sein`);
  assert(isValidDateOrNullable(value.koDate), `${path}.koDate muss ein gültiges Datum oder null sein`);
  assert(isBooleanOrUndefined(value.isNotCaught), `${path}.isNotCaught muss boolean sein`);
  assert(isNullableString(value.notCaughtBy), `${path}.notCaughtBy muss string/null sein`);
  assert(isNullableString(value.notCaughtReason), `${path}.notCaughtReason muss string/null sein`);
  assert(isValidDateOrNullable(value.notCaughtDate), `${path}.notCaughtDate muss ein gültiges Datum oder null sein`);
}

function validatePlayer(value: unknown, path: string): asserts value is GameSavePlayer {
  assert(isObject(value), `${path} muss ein Objekt sein`);
  assert(isInteger(value.id) && value.id > 0, `${path}.id muss eine positive Zahl sein`);
  assert(isNonEmptyString(value.name), `${path}.name muss ein nicht-leerer String sein`);
  assert(isNonEmptyString(value.color), `${path}.color muss ein nicht-leerer String sein`);
  assert(isNullableString(value.avatar), `${path}.avatar muss string/null sein`);
  assert(Array.isArray(value.encounters), `${path}.encounters muss ein Array sein`);
  value.encounters.forEach((encounter, index) => {
    validateEncounter(encounter, `${path}.encounters[${index}]`);
  });
}

function validateRoute(value: unknown, path: string): asserts value is GameSaveRoute {
  assert(isObject(value), `${path} muss ein Objekt sein`);
  assert(isInteger(value.id) && value.id > 0, `${path}.id muss eine positive Zahl sein`);
  assert(isNonEmptyString(value.name), `${path}.name muss ein nicht-leerer String sein`);
  assert(isInteger(value.order), `${path}.order muss eine Zahl sein`);
}

function validateRunStats(value: unknown, path: string): asserts value is GameSaveRunPlayerStats {
  assert(isObject(value), `${path} muss ein Objekt sein`);
  assert(isNonEmptyString(value.playerName), `${path}.playerName muss ein nicht-leerer String sein`);
  assert(value.knockedOutCount === undefined || (isInteger(value.knockedOutCount) && value.knockedOutCount >= 0), `${path}.knockedOutCount muss >= 0 sein`);
  assert(value.notCaughtCount === undefined || (isInteger(value.notCaughtCount) && value.notCaughtCount >= 0), `${path}.notCaughtCount muss >= 0 sein`);
  assert(value.isLoser === undefined || typeof value.isLoser === 'boolean', `${path}.isLoser muss boolean sein`);
}

function validateRunEncounter(value: unknown, path: string): asserts value is GameSaveRunEncounter {
  assert(isObject(value), `${path} muss ein Objekt sein`);
  assert(isNonEmptyString(value.playerName), `${path}.playerName muss ein nicht-leerer String sein`);
  assert(isInteger(value.pokemonPokedexId) && value.pokemonPokedexId > 0, `${path}.pokemonPokedexId muss eine positive Zahl sein`);
  assert(isNonEmptyString(value.pokemonName), `${path}.pokemonName muss ein nicht-leerer String sein`);
  assert(isNullableString(value.pokemonNameGerman), `${path}.pokemonNameGerman muss string/null sein`);
  assert(isNonEmptyString(value.routeName), `${path}.routeName muss ein nicht-leerer String sein`);
  assert(isNullableString(value.nickname), `${path}.nickname muss string/null sein`);
  assert(value.teamSlot === undefined || value.teamSlot === null || (isInteger(value.teamSlot) && value.teamSlot >= 1 && value.teamSlot <= 6), `${path}.teamSlot muss null oder 1-6 sein`);
  assert(value.isKnockedOut === undefined || typeof value.isKnockedOut === 'boolean', `${path}.isKnockedOut muss boolean sein`);
  assert(isNullableString(value.koCausedBy), `${path}.koCausedBy muss string/null sein`);
  assert(isNullableString(value.koReason), `${path}.koReason muss string/null sein`);
  assert(isValidDateOrNullable(value.koDate), `${path}.koDate muss ein gültiges Datum oder null sein`);
  assert(value.isNotCaught === undefined || typeof value.isNotCaught === 'boolean', `${path}.isNotCaught muss boolean sein`);
  assert(isNullableString(value.notCaughtBy), `${path}.notCaughtBy muss string/null sein`);
  assert(isNullableString(value.notCaughtReason), `${path}.notCaughtReason muss string/null sein`);
  assert(isValidDateOrNullable(value.notCaughtDate), `${path}.notCaughtDate muss ein gültiges Datum oder null sein`);
  assert(isValidDateOrNullable(value.caughtAt), `${path}.caughtAt muss ein gültiges Datum oder null sein`);
}

function validateRun(value: unknown, path: string): asserts value is GameSaveRun {
  assert(isObject(value), `${path} muss ein Objekt sein`);
  assert(isInteger(value.runNumber) && value.runNumber > 0, `${path}.runNumber muss eine positive Zahl sein`);
  assert(value.gameVersionKey === undefined || value.gameVersionKey === null || isNonEmptyString(value.gameVersionKey), `${path}.gameVersionKey muss string/null sein`);
  assert(value.status === 'active' || value.status === 'failed' || value.status === 'completed', `${path}.status muss active, failed oder completed sein`);
  assert(isNullableString(value.loserPlayerName), `${path}.loserPlayerName muss string/null sein`);
  assert(isValidDateOrNullable(value.startedAt) && typeof value.startedAt === 'string', `${path}.startedAt muss ein gültiges Datum sein`);
  assert(isValidDateOrNullable(value.endedAt), `${path}.endedAt muss ein gültiges Datum oder null sein`);
  assert(value.badgesEarned === undefined || (isInteger(value.badgesEarned) && value.badgesEarned >= 0), `${path}.badgesEarned muss >= 0 sein`);
  assert(value.totalPausedMs === undefined || (isInteger(value.totalPausedMs) && value.totalPausedMs >= 0), `${path}.totalPausedMs muss >= 0 sein`);
  assert(isValidDateOrNullable(value.pausedAt), `${path}.pausedAt muss ein gültiges Datum oder null sein`);

  if (value.playerStats !== undefined) {
    assert(Array.isArray(value.playerStats), `${path}.playerStats muss ein Array sein`);
    value.playerStats.forEach((stat, index) => validateRunStats(stat, `${path}.playerStats[${index}]`));
  }

  if (value.encounters !== undefined) {
    assert(Array.isArray(value.encounters), `${path}.encounters muss ein Array sein`);
    value.encounters.forEach((encounter, index) => validateRunEncounter(encounter, `${path}.encounters[${index}]`));
  }
}

export function validateGameSaveData(data: unknown): ValidatedGameSaveData {
  assert(isObject(data), 'Spielstand muss ein Objekt sein');
  assert(Array.isArray(data.players), 'Spielstand-Format ungültig: players muss ein Array sein');
  assert(Array.isArray(data.routes), 'Spielstand-Format ungültig: routes muss ein Array sein');

  const playersUnknown = data.players as unknown[];
  const routesUnknown = data.routes as unknown[];

  playersUnknown.forEach((player, index) => validatePlayer(player, `players[${index}]`));
  routesUnknown.forEach((route, index) => validateRoute(route, `routes[${index}]`));

  const players = data.players as GameSavePlayer[];
  const routes = data.routes as GameSaveRoute[];

  const playerIds = new Set<number>();
  players.forEach((player, index) => {
    assert(!playerIds.has(player.id), `players[${index}].id ist doppelt`);
    playerIds.add(player.id);
  });

  const routeIds = new Set<number>();
  routes.forEach((route, index) => {
    assert(!routeIds.has(route.id), `routes[${index}].id ist doppelt`);
    routeIds.add(route.id);
  });

  const encounterUniq = new Set<string>();
  players.forEach((player, playerIndex) => {
    player.encounters.forEach((encounter, encounterIndex) => {
      assert(routeIds.has(encounter.routeId), `players[${playerIndex}].encounters[${encounterIndex}].routeId referenziert keine Route`);
      const key = `${player.id}:${encounter.routeId}`;
      assert(!encounterUniq.has(key), `Doppelter Encounter für playerId=${player.id} und routeId=${encounter.routeId}`);
      encounterUniq.add(key);
    });
  });

  if (data.runs !== undefined) {
    assert(Array.isArray(data.runs), 'Spielstand-Format ungültig: runs muss ein Array sein');
    (data.runs as unknown[]).forEach((run, index) => validateRun(run, `runs[${index}]`));
  }

  return {
    players,
    routes,
    runs: data.runs as GameSaveRun[] | undefined,
  };
}
