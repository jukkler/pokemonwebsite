import type {
  SavedComparisonSetV2,
  SavedComparisonSetsV2,
  SavedTeamSnapshotV1,
  TeamComparisonSelection,
} from '@/components/pokeradar/team-comparison-types';
import { isComparisonSelectionStatus } from '@/components/pokeradar/team-comparison-types';
import type {
  ComparisonMetric,
  ComparisonSelectionStatus,
  ComparisonSource,
} from '@/lib/pokemon-comparison';

export const SAVED_COMPARISON_SETS_STORAGE_KEY =
  'pokemon-comparison.saved-sets.v2';
export const LEGACY_TEAM_SNAPSHOTS_STORAGE_KEY =
  'pokemon-comparison.team-snapshots.v1';
export const MAX_SAVED_COMPARISON_SETS = 8;

const MAX_POKEMON_PER_SET = 6;
const MAX_LABEL_LENGTH = 80;
const MAX_ID_LENGTH = 100;
const VALID_METRICS = new Set<ComparisonMetric>([
  'hp',
  'attack',
  'defense',
  'spAttack',
  'spDefense',
  'speed',
  'total',
]);
const VALID_SOURCES = new Set<ComparisonSource>(['team', 'route']);

interface NormalizationFallbacks {
  id?: string;
  label?: string;
  createdAt?: string;
}

export interface ParsedSavedComparisonSets {
  sets: SavedComparisonSetV2[];
  migratedLegacy: boolean;
}

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
  return normalized || null;
}

function normalizeCreatedAt(value: unknown, fallback?: string): string | null {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return value;
  }
  if (fallback && !Number.isNaN(Date.parse(fallback))) return fallback;
  return null;
}

function normalizeSelection(
  pokemonIdsValue: unknown,
  statusesValue: unknown,
): { pokemonIds: number[]; statuses: ComparisonSelectionStatus[] } {
  if (!Array.isArray(pokemonIdsValue)) {
    return { pokemonIds: [], statuses: [] };
  }

  const rawStatuses = Array.isArray(statusesValue) ? statusesValue : [];
  const pokemonIds: number[] = [];
  const statuses: ComparisonSelectionStatus[] = [];

  for (const [index, rawId] of pokemonIdsValue.entries()) {
    if (
      !Number.isSafeInteger(rawId) ||
      Number(rawId) <= 0 ||
      pokemonIds.includes(Number(rawId))
    ) {
      continue;
    }

    pokemonIds.push(Number(rawId));
    statuses.push(
      isComparisonSelectionStatus(rawStatuses[index])
        ? rawStatuses[index]
        : 'none',
    );
    if (pokemonIds.length === MAX_POKEMON_PER_SET) break;
  }

  return { pokemonIds, statuses };
}

export function normalizeSavedComparisonSet(
  value: unknown,
  fallbacks: NormalizationFallbacks = {},
): SavedComparisonSetV2 | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<SavedComparisonSetV2 | SavedTeamSnapshotV1>;
  if (candidate.version !== 1 && candidate.version !== 2) return null;

  const { pokemonIds, statuses } = normalizeSelection(
    candidate.pokemonIds,
    candidate.statuses,
  );
  if (pokemonIds.length === 0) return null;

  const id = normalizeText(candidate.id, MAX_ID_LENGTH) ??
    normalizeText(fallbacks.id, MAX_ID_LENGTH);
  const createdAt = normalizeCreatedAt(candidate.createdAt, fallbacks.createdAt);
  if (!id || !createdAt) return null;

  const label = normalizeText(candidate.label, MAX_LABEL_LENGTH) ??
    normalizeText(fallbacks.label, MAX_LABEL_LENGTH) ??
    'Gespeicherter Vergleich';
  const source = VALID_SOURCES.has(candidate.source as ComparisonSource)
    ? (candidate.source as ComparisonSource)
    : null;
  const sourceLabel = normalizeText(candidate.sourceLabel, MAX_LABEL_LENGTH);
  const referenceId =
    Number.isSafeInteger(candidate.referenceId) &&
    pokemonIds.includes(Number(candidate.referenceId))
      ? Number(candidate.referenceId)
      : pokemonIds[0] ?? null;

  return {
    version: 2,
    id,
    label,
    createdAt,
    pokemonIds,
    statuses,
    referenceId,
    metric: VALID_METRICS.has(candidate.metric as ComparisonMetric)
      ? (candidate.metric as ComparisonMetric)
      : 'speed',
    source,
    sourceLabel,
  };
}

function parseJson(rawValue: string | null): unknown {
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue) as unknown;
  } catch {
    return null;
  }
}

function normalizeSetList(
  values: unknown[],
  createdAtFallback: string,
  legacy: boolean,
): SavedComparisonSetV2[] {
  const sets: SavedComparisonSetV2[] = [];
  const usedIds = new Set<string>();

  for (const [index, value] of values.entries()) {
    const set = normalizeSavedComparisonSet(value, {
      id: legacy ? `migrated-team-${index + 1}` : undefined,
      label: legacy ? `Teamstand ${index + 1}` : undefined,
      createdAt: createdAtFallback,
    });
    if (!set || usedIds.has(set.id)) continue;
    usedIds.add(set.id);
    sets.push(set);
    if (sets.length === MAX_SAVED_COMPARISON_SETS) break;
  }

  return sets;
}

export function parseSavedComparisonSets(
  currentRawValue: string | null,
  legacyRawValue: string | null = null,
  createdAtFallback = new Date(0).toISOString(),
): ParsedSavedComparisonSets {
  const currentValue = parseJson(currentRawValue);
  if (
    currentValue &&
    typeof currentValue === 'object' &&
    (currentValue as Partial<SavedComparisonSetsV2>).version === 2 &&
    Array.isArray((currentValue as Partial<SavedComparisonSetsV2>).sets)
  ) {
    return {
      sets: normalizeSetList(
        (currentValue as SavedComparisonSetsV2).sets,
        createdAtFallback,
        false,
      ),
      migratedLegacy: false,
    };
  }

  const legacyValue = parseJson(legacyRawValue);
  if (!Array.isArray(legacyValue)) {
    return { sets: [], migratedLegacy: false };
  }

  const sets = normalizeSetList(legacyValue, createdAtFallback, true);
  return { sets, migratedLegacy: sets.length > 0 };
}

export function serializeSavedComparisonSets(
  sets: readonly SavedComparisonSetV2[],
): string {
  const payload: SavedComparisonSetsV2 = {
    version: 2,
    sets: sets.slice(0, MAX_SAVED_COMPARISON_SETS),
  };
  return JSON.stringify(payload);
}

export function createSavedComparisonSet(
  selection: TeamComparisonSelection,
  label: string,
  id: string,
  createdAt: string,
): SavedComparisonSetV2 | null {
  return normalizeSavedComparisonSet({
    version: 2,
    ...selection,
    id,
    label,
    createdAt,
  });
}
