import type { ComparisonMetric } from '@/lib/pokemon-comparison';

export const POKERADAR_TEAM_LIMIT = 6;

export type PokeradarSelectionStatus =
  | 'team'
  | 'ko'
  | 'not-caught'
  | 'caught';

export type PokeradarSelectionSource = 'team' | 'route';

export interface PokeradarTeamSlot {
  encounterId: number;
  teamSlot: number;
  pokedexId: number;
  pokemonName: string;
  pokemonNameGerman: string | null;
  spriteUrl: string | null;
  nickname: string | null;
  routeName: string | null;
  status: PokeradarSelectionStatus;
}

export interface PokeradarPlayerTeam {
  id: number;
  name: string;
  color: string;
  teamSlots: PokeradarTeamSlot[];
  comparisonHref: string | null;
}

export interface PokeradarTeamsResponse {
  players: PokeradarPlayerTeam[];
}

export interface PokeradarLinkEncounter {
  pokedexId: number;
  teamSlot?: number | null;
  status?: PokeradarSelectionStatus;
  isKnockedOut?: boolean | null;
  isNotCaught?: boolean | null;
}

export interface BuildPokeradarHrefOptions {
  pathname?: string;
  source?: PokeradarSelectionSource;
  sourceLabel?: string | null;
  referencePokedexId?: number | null;
  metric?: ComparisonMetric;
}

const validStatuses = new Set<PokeradarSelectionStatus>([
  'team',
  'ko',
  'not-caught',
  'caught',
]);

function isValidPokedexId(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function isValidTeamSlot(value: number | null | undefined): value is number {
  return Number.isInteger(value) && value !== null && value !== undefined && value >= 1 && value <= 6;
}

function resolveStatus(
  encounter: PokeradarLinkEncounter,
): PokeradarSelectionStatus {
  if (encounter.status && validStatuses.has(encounter.status)) {
    return encounter.status;
  }

  // Bei widersprüchlichen Altdaten gewinnt „nicht gefangen“, da dieses
  // Pokémon nie Teil des aktiven Teams gewesen sein kann.
  if (encounter.isNotCaught) return 'not-caught';
  if (encounter.isKnockedOut) return 'ko';
  if (isValidTeamSlot(encounter.teamSlot)) return 'team';
  return 'caught';
}

/**
 * Baut einen teilbaren Pokeradar-Link. Statuswerte bleiben positionsgleich zu
 * `pokemon`, damit die Darstellung auch ohne erneuten Datenbankabruf stabil ist.
 */
export function buildPokeradarHref(
  encounters: readonly PokeradarLinkEncounter[],
  options: BuildPokeradarHrefOptions = {},
): string | null {
  const orderedEncounters = encounters
    .map((encounter, inputIndex) => ({ encounter, inputIndex }))
    .sort((left, right) => {
      const leftSlot = isValidTeamSlot(left.encounter.teamSlot)
        ? left.encounter.teamSlot
        : Number.POSITIVE_INFINITY;
      const rightSlot = isValidTeamSlot(right.encounter.teamSlot)
        ? right.encounter.teamSlot
        : Number.POSITIVE_INFINITY;

      return leftSlot - rightSlot || left.inputIndex - right.inputIndex;
    });

  const selected: Array<{
    pokedexId: number;
    status: PokeradarSelectionStatus;
  }> = [];
  const selectedIds = new Set<number>();

  for (const { encounter } of orderedEncounters) {
    if (
      !isValidPokedexId(encounter.pokedexId) ||
      selectedIds.has(encounter.pokedexId)
    ) {
      continue;
    }

    selected.push({
      pokedexId: encounter.pokedexId,
      status: resolveStatus(encounter),
    });
    selectedIds.add(encounter.pokedexId);

    if (selected.length === POKERADAR_TEAM_LIMIT) break;
  }

  if (selected.length === 0) return null;

  const requestedReferenceId = options.referencePokedexId;
  const referenceId =
    requestedReferenceId && selectedIds.has(requestedReferenceId)
      ? requestedReferenceId
      : selected[0].pokedexId;
  const params = new URLSearchParams({
    pokemon: selected.map(({ pokedexId }) => pokedexId).join(','),
    status: selected.map(({ status }) => status).join(','),
    ref: String(referenceId),
    metric: options.metric ?? 'speed',
  });
  const sourceLabel = options.sourceLabel?.trim().slice(0, 80);

  if (options.source) params.set('source', options.source);
  if (sourceLabel) params.set('sourceLabel', sourceLabel);

  return `${options.pathname ?? '/pokeradar'}?${params.toString()}`;
}
