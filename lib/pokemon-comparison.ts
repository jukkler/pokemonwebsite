import type { Pokemon } from '@/lib/types';
import {
  allPokemonTypes,
  getDefenseMultiplier,
  getGermanTypeName,
  parseTypes,
} from '@/lib/typeEffectiveness';

export type BaseStatMetric =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'spAttack'
  | 'spDefense'
  | 'speed';

export type ComparisonMetric = BaseStatMetric | 'total';

export interface StatDefinition {
  key: ComparisonMetric;
  label: string;
  shortLabel: string;
}

export const STAT_DEFINITIONS: readonly StatDefinition[] = [
  { key: 'hp', label: 'KP', shortLabel: 'KP' },
  { key: 'attack', label: 'Angriff', shortLabel: 'Ang.' },
  { key: 'defense', label: 'Verteidigung', shortLabel: 'Vert.' },
  { key: 'spAttack', label: 'Sp.-Angriff', shortLabel: 'Sp.-Ang.' },
  { key: 'spDefense', label: 'Sp.-Verteidigung', shortLabel: 'Sp.-Vert.' },
  { key: 'speed', label: 'Initiative', shortLabel: 'Init.' },
  { key: 'total', label: 'Gesamt-BP', shortLabel: 'Gesamt' },
] as const;

export const BASE_STAT_DEFINITIONS = STAT_DEFINITIONS.filter(
  (definition): definition is StatDefinition & { key: BaseStatMetric } =>
    definition.key !== 'total',
);

export const DEFAULT_COMPARISON_METRIC: ComparisonMetric = 'speed';
export const MAX_COMPARED_POKEMON = 6;

const comparisonMetricSet = new Set<ComparisonMetric>(
  STAT_DEFINITIONS.map(({ key }) => key),
);

export function getPokemonDisplayName(pokemon: Pokemon): string {
  return pokemon.nameGerman || pokemon.name;
}

export function getTotalBaseStats(pokemon: Pokemon): number {
  return BASE_STAT_DEFINITIONS.reduce(
    (total, { key }) => total + pokemon[key],
    0,
  );
}

export function getMetricValue(
  pokemon: Pokemon,
  metric: ComparisonMetric,
): number {
  return metric === 'total' ? getTotalBaseStats(pokemon) : pokemon[metric];
}

export function getMetricDelta(
  pokemon: Pokemon,
  reference: Pokemon,
  metric: ComparisonMetric,
): number {
  return getMetricValue(pokemon, metric) - getMetricValue(reference, metric);
}

export interface MetricLeaders {
  metric: ComparisonMetric;
  highestValue: number;
  leaderIds: number[];
  leaders: Pokemon[];
  isTie: boolean;
}

export function getMetricLeaders(
  pokemon: readonly Pokemon[],
  metric: ComparisonMetric,
): MetricLeaders {
  if (pokemon.length === 0) {
    return {
      metric,
      highestValue: 0,
      leaderIds: [],
      leaders: [],
      isTie: false,
    };
  }

  const highestValue = Math.max(
    ...pokemon.map((entry) => getMetricValue(entry, metric)),
  );
  const leaders = pokemon.filter(
    (entry) => getMetricValue(entry, metric) === highestValue,
  );

  return {
    metric,
    highestValue,
    leaderIds: leaders.map(({ pokedexId }) => pokedexId),
    leaders,
    isTie: leaders.length > 1,
  };
}

export type StatProfileTagKey =
  | 'physical-focus'
  | 'special-focus'
  | 'balanced-offense'
  | 'high-defensive-stats'
  | 'solid-defensive-stats'
  | 'low-defensive-stats'
  | 'high-speed'
  | 'low-speed';

export interface StatProfileTag {
  key: StatProfileTagKey;
  label: string;
  description: string;
}

export interface ProfileStat {
  metric: BaseStatMetric;
  label: string;
  value: number;
}

export interface PokemonStatProfile {
  tags: StatProfileTag[];
  strongestStats: ProfileStat[];
  summary: string;
}

export function getPokemonStatProfile(pokemon: Pokemon): PokemonStatProfile {
  const tags: StatProfileTag[] = [];
  const offenseDifference = pokemon.attack - pokemon.spAttack;

  if (offenseDifference >= 15) {
    tags.push({
      key: 'physical-focus',
      label: 'Physischer Schwerpunkt',
      description: `Angriff liegt ${offenseDifference} Punkte über Sp.-Angriff.`,
    });
  } else if (offenseDifference <= -15) {
    tags.push({
      key: 'special-focus',
      label: 'Spezieller Schwerpunkt',
      description: `Sp.-Angriff liegt ${Math.abs(offenseDifference)} Punkte über Angriff.`,
    });
  } else {
    tags.push({
      key: 'balanced-offense',
      label: 'Ausgewogene Offensivwerte',
      description: 'Angriff und Sp.-Angriff liegen höchstens 14 Punkte auseinander.',
    });
  }

  const defensiveAverage =
    (pokemon.hp + pokemon.defense + pokemon.spDefense) / 3;

  if (defensiveAverage >= 100) {
    tags.push({
      key: 'high-defensive-stats',
      label: 'Hohe defensive Basiswerte',
      description: `KP, Verteidigung und Sp.-Verteidigung liegen im Schnitt bei ${Math.round(defensiveAverage)}.`,
    });
  } else if (defensiveAverage >= 80) {
    tags.push({
      key: 'solid-defensive-stats',
      label: 'Solide defensive Basiswerte',
      description: `KP, Verteidigung und Sp.-Verteidigung liegen im Schnitt bei ${Math.round(defensiveAverage)}.`,
    });
  } else if (defensiveAverage < 60) {
    tags.push({
      key: 'low-defensive-stats',
      label: 'Niedrige defensive Basiswerte',
      description: `KP, Verteidigung und Sp.-Verteidigung liegen im Schnitt bei ${Math.round(defensiveAverage)}.`,
    });
  }

  if (pokemon.speed >= 100) {
    tags.push({
      key: 'high-speed',
      label: 'Hohe Initiative',
      description: `Der Initiative-Basiswert beträgt ${pokemon.speed}.`,
    });
  } else if (pokemon.speed <= 50) {
    tags.push({
      key: 'low-speed',
      label: 'Niedrige Initiative',
      description: `Der Initiative-Basiswert beträgt ${pokemon.speed}.`,
    });
  }

  const strongestStats = [...BASE_STAT_DEFINITIONS]
    .map(({ key, label }) => ({ metric: key, label, value: pokemon[key] }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 2);

  const strongestDescription = strongestStats
    .map(({ label, value }) => `${label} (${value})`)
    .join(' und ');

  return {
    tags,
    strongestStats,
    summary: `Die höchsten einzelnen Basiswerte sind ${strongestDescription}. Die Einordnung beschreibt nur die angezeigten Basiswerte.`,
  };
}

export interface TypeMatchup {
  type: string;
  label: string;
  multiplier: 0 | 0.25 | 0.5 | 2 | 4;
}

export interface DefensiveTypeProfile {
  pokemonTypes: string[];
  immunities: TypeMatchup[];
  strongResistances: TypeMatchup[];
  resistances: TypeMatchup[];
  weaknesses: TypeMatchup[];
  strongWeaknesses: TypeMatchup[];
}

export function getDefensiveTypeProfile(
  pokemon: Pokemon,
): DefensiveTypeProfile {
  const pokemonTypes = parseTypes(pokemon.types).filter((type) =>
    allPokemonTypes.includes(type),
  );
  const profile: DefensiveTypeProfile = {
    pokemonTypes,
    immunities: [],
    strongResistances: [],
    resistances: [],
    weaknesses: [],
    strongWeaknesses: [],
  };

  for (const type of allPokemonTypes) {
    const multiplier = getDefenseMultiplier(pokemonTypes, type);
    const matchup = {
      type,
      label: getGermanTypeName(type),
      multiplier,
    } as TypeMatchup;

    if (multiplier === 0) profile.immunities.push(matchup);
    if (multiplier === 0.25) profile.strongResistances.push(matchup);
    if (multiplier === 0.5) profile.resistances.push(matchup);
    if (multiplier === 2) profile.weaknesses.push(matchup);
    if (multiplier === 4) profile.strongWeaknesses.push(matchup);
  }

  return profile;
}

export interface ComparisonInsight {
  id: string;
  title: string;
  description: string;
  metric?: ComparisonMetric;
  pokemonIds: number[];
}

function formatNames(pokemon: readonly Pokemon[]): string {
  return pokemon.map(getPokemonDisplayName).join(' und ');
}

function getMetricLabel(metric: ComparisonMetric): string {
  return (
    STAT_DEFINITIONS.find((definition) => definition.key === metric)?.label ?? metric
  );
}

export function buildComparisonInsights(
  pokemon: readonly Pokemon[],
  reference?: Pokemon | null,
): ComparisonInsight[] {
  if (pokemon.length === 0) return [];

  if (pokemon.length === 1) {
    const entry = pokemon[0];
    return [
      {
        id: 'single-total',
        title: 'Basiswertsumme',
        description: `${getPokemonDisplayName(entry)} kommt auf ${getTotalBaseStats(entry)} Gesamt-BP. Füge ein weiteres Pokémon für direkte Unterschiede hinzu.`,
        metric: 'total',
        pokemonIds: [entry.pokedexId],
      },
    ];
  }

  const insights: ComparisonInsight[] = [];
  const totalLeaders = getMetricLeaders(pokemon, 'total');
  const totalNames = formatNames(totalLeaders.leaders);
  insights.push({
    id: 'total-leader',
    title: totalLeaders.isTie ? 'Gleiche höchste Gesamt-BP' : 'Höchste Gesamt-BP',
    description: totalLeaders.isTie
      ? `${totalNames} teilen sich mit jeweils ${totalLeaders.highestValue} die höchste Basiswertsumme der Auswahl.`
      : `${totalNames} hat mit ${totalLeaders.highestValue} die höchste Basiswertsumme der Auswahl.`,
    metric: 'total',
    pokemonIds: totalLeaders.leaderIds,
  });

  const spreads = BASE_STAT_DEFINITIONS.map(({ key }) => {
    const values = pokemon.map((entry) => getMetricValue(entry, key));
    return {
      metric: key,
      spread: Math.max(...values) - Math.min(...values),
      minimum: Math.min(...values),
      maximum: Math.max(...values),
    };
  }).sort((left, right) => right.spread - left.spread);
  const widestSpread = spreads[0];
  const highPokemon = pokemon.filter(
    (entry) => getMetricValue(entry, widestSpread.metric) === widestSpread.maximum,
  );
  const lowPokemon = pokemon.filter(
    (entry) => getMetricValue(entry, widestSpread.metric) === widestSpread.minimum,
  );

  insights.push({
    id: 'widest-spread',
    title: 'Größter Basiswert-Abstand',
    description:
      widestSpread.spread === 0
        ? `Bei ${getMetricLabel(widestSpread.metric)} haben alle ausgewählten Pokémon denselben Wert (${widestSpread.maximum}).`
        : `Bei ${getMetricLabel(widestSpread.metric)} ist der Abstand mit ${widestSpread.spread} Punkten am größten: ${formatNames(highPokemon)} (${widestSpread.maximum}) gegenüber ${formatNames(lowPokemon)} (${widestSpread.minimum}).`,
    metric: widestSpread.metric,
    pokemonIds: [...highPokemon, ...lowPokemon].map(({ pokedexId }) => pokedexId),
  });

  const activeReference = reference
    ? pokemon.find(({ pokedexId }) => pokedexId === reference.pokedexId)
    : undefined;

  if (activeReference && pokemon.length > 2) {
    const closest = pokemon
      .filter(({ pokedexId }) => pokedexId !== activeReference.pokedexId)
      .map((entry) => ({
        pokemon: entry,
        distance: BASE_STAT_DEFINITIONS.reduce(
          (sum, { key }) => sum + Math.abs(getMetricDelta(entry, activeReference, key)),
          0,
        ),
      }))
      .sort(
        (left, right) =>
          left.distance - right.distance ||
          left.pokemon.pokedexId - right.pokemon.pokedexId,
      );
    const minimumDistance = closest[0]?.distance;
    const closestPokemon = closest
      .filter(({ distance }) => distance === minimumDistance)
      .map(({ pokemon: entry }) => entry);

    if (closestPokemon.length > 0) {
      insights.push({
        id: 'closest-to-reference',
        title: 'Ähnlichstes Basiswert-Profil zur Referenz',
        description: `${formatNames(closestPokemon)} hat über die sechs Einzelwerte die kleinste absolute Gesamtabweichung zu ${getPokemonDisplayName(activeReference)} (${minimumDistance} Punkte).`,
        pokemonIds: [
          activeReference.pokedexId,
          ...closestPokemon.map(({ pokedexId }) => pokedexId),
        ],
      });
    }
  }

  return insights.slice(0, 3);
}

export interface ComparisonQueryState {
  pokemonIds: number[];
  referenceId: number | null;
  metric: ComparisonMetric;
  statuses: ComparisonSelectionStatus[];
  source: ComparisonSource | null;
  sourceLabel: string | null;
}

export type ComparisonSelectionStatus =
  | 'none'
  | 'team'
  | 'ko'
  | 'not-caught'
  | 'caught';

export type ComparisonSource = 'team' | 'route';

const comparisonStatusSet = new Set<ComparisonSelectionStatus>([
  'none',
  'team',
  'ko',
  'not-caught',
  'caught',
]);

const comparisonSourceSet = new Set<ComparisonSource>(['team', 'route']);

interface SearchParamReader {
  get(name: string): string | null;
}

function parsePositiveInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function sanitizePokemonIds(ids: readonly number[]): number[] {
  const uniqueIds: number[] = [];

  for (const id of ids) {
    if (!Number.isSafeInteger(id) || id <= 0 || uniqueIds.includes(id)) continue;
    uniqueIds.push(id);
    if (uniqueIds.length === MAX_COMPARED_POKEMON) break;
  }

  return uniqueIds;
}

function sanitizeStatuses(
  statuses: readonly ComparisonSelectionStatus[],
  length: number,
): ComparisonSelectionStatus[] {
  return Array.from({ length }, (_, index) => {
    const status = statuses[index];
    return status && comparisonStatusSet.has(status) ? status : 'none';
  });
}

function sanitizeSourceLabel(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\s+/g, ' ').slice(0, 80);
  return normalized || null;
}

export function parseComparisonParams(
  params: SearchParamReader,
): ComparisonQueryState {
  const pokemonIds = sanitizePokemonIds(
    (params.get('pokemon') ?? '')
      .split(',')
      .map((value) => parsePositiveInteger(value.trim()))
      .filter((value): value is number => value !== null),
  );
  const requestedReferenceId = parsePositiveInteger(params.get('ref'));
  const requestedMetric = params.get('metric');
  const metric = comparisonMetricSet.has(requestedMetric as ComparisonMetric)
    ? (requestedMetric as ComparisonMetric)
    : DEFAULT_COMPARISON_METRIC;
  const statuses = sanitizeStatuses(
    (params.get('status') ?? '')
      .split(',')
      .map((value) => value.trim() as ComparisonSelectionStatus),
    pokemonIds.length,
  );
  const requestedSource = params.get('source');
  const source = comparisonSourceSet.has(requestedSource as ComparisonSource)
    ? (requestedSource as ComparisonSource)
    : null;

  return {
    pokemonIds,
    referenceId:
      requestedReferenceId && pokemonIds.includes(requestedReferenceId)
        ? requestedReferenceId
        : pokemonIds[0] ?? null,
    metric,
    statuses,
    source: pokemonIds.length > 0 ? source : null,
    sourceLabel: pokemonIds.length > 0
      ? sanitizeSourceLabel(params.get('sourceLabel'))
      : null,
  };
}

export function normalizeComparisonState(
  state: ComparisonQueryState,
  availableIds: ReadonlySet<number> | readonly number[],
): ComparisonQueryState {
  const availableIdSet =
    availableIds instanceof Set ? availableIds : new Set(availableIds);
  const sanitizedIds = sanitizePokemonIds(state.pokemonIds);
  const sanitizedStatuses = sanitizeStatuses(state.statuses, sanitizedIds.length);
  const availableEntries = sanitizedIds.flatMap((id, index) =>
    availableIdSet.has(id) ? [{ id, status: sanitizedStatuses[index] }] : [],
  );
  const pokemonIds = availableEntries.map(({ id }) => id);

  return {
    pokemonIds,
    referenceId:
      state.referenceId && pokemonIds.includes(state.referenceId)
        ? state.referenceId
        : pokemonIds[0] ?? null,
    metric: comparisonMetricSet.has(state.metric)
      ? state.metric
      : DEFAULT_COMPARISON_METRIC,
    statuses: availableEntries.map(({ status }) => status),
    source: pokemonIds.length > 0 && state.source && comparisonSourceSet.has(state.source)
      ? state.source
      : null,
    sourceLabel: pokemonIds.length > 0
      ? sanitizeSourceLabel(state.sourceLabel)
      : null,
  };
}

export function serializeComparisonParams(
  state: ComparisonQueryState,
  currentParams: URLSearchParams = new URLSearchParams(),
): URLSearchParams {
  const comparisonParamNames = new Set([
    'pokemon',
    'ref',
    'metric',
    'status',
    'source',
    'sourceLabel',
  ]);
  const extraParams = Array.from(currentParams.entries()).filter(
    ([name]) => !comparisonParamNames.has(name),
  );
  const nextParams = new URLSearchParams();
  const pokemonIds = sanitizePokemonIds(state.pokemonIds);
  const referenceId =
    state.referenceId && pokemonIds.includes(state.referenceId)
      ? state.referenceId
      : pokemonIds[0] ?? null;
  const metric = comparisonMetricSet.has(state.metric)
    ? state.metric
    : DEFAULT_COMPARISON_METRIC;
  const statuses = sanitizeStatuses(state.statuses, pokemonIds.length);
  const hasStatusMetadata = statuses.some((status) => status !== 'none');
  const source = state.source && comparisonSourceSet.has(state.source)
    ? state.source
    : null;
  const sourceLabel = sanitizeSourceLabel(state.sourceLabel);

  if (pokemonIds.length > 0) {
    nextParams.set('pokemon', pokemonIds.join(','));
    if (referenceId) nextParams.set('ref', String(referenceId));
    nextParams.set('metric', metric);
    if (hasStatusMetadata) {
      nextParams.set('status', statuses.join(','));
    } else {
      nextParams.delete('status');
    }
    if (source) {
      nextParams.set('source', source);
    } else {
      nextParams.delete('source');
    }
    if (sourceLabel) {
      nextParams.set('sourceLabel', sourceLabel);
    } else {
      nextParams.delete('sourceLabel');
    }
  } else {
    if (metric !== DEFAULT_COMPARISON_METRIC) {
      nextParams.set('metric', metric);
    }
  }

  for (const [name, value] of extraParams) {
    nextParams.append(name, value);
  }

  return nextParams;
}
