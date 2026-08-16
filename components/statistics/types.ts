export interface GameVersion {
  key: string;
  name: string;
  generation: number;
}

export interface RunCounts {
  encounters: number;
  caught: number;
  knockedOut: number;
  notCaught: number;
}

export interface RunSummary {
  id: number;
  runNumber: number;
  status: string;
  loserPlayerName: string | null;
  startedAt: string;
  endedAt: string | null;
  pausedAt: string | null;
  totalPausedMs: number;
  badgesEarned: number;
  archived?: boolean;
  isLive?: boolean;
  durationMs?: number;
  gameVersion: GameVersion | null;
  counts?: Partial<RunCounts>;
  encounterCount?: number;
  caughtCount?: number;
  knockedOutCount?: number;
  notCaughtCount?: number;
}

export interface OverviewTotals {
  gameCount: number;
  runCount: number;
  activeRuns: number;
  failedRuns: number;
  completedRuns: number;
  totalEncounters: number;
  caughtCount: number;
  knockedOutCount: number;
  notCaughtCount: number;
  totalDurationMs: number;
  maxBadges: number;
}

export interface GameOverview extends Omit<OverviewTotals, 'gameCount'> {
  gameVersion: GameVersion | null;
  firstStartedAt: string | null;
  lastStartedAt: string | null;
  runs?: RunSummary[];
}

export interface OverviewResponse {
  scope: { gameKey: string | null; label: string };
  totals: OverviewTotals;
  games: GameOverview[];
}

export interface HistoryGroup {
  gameVersion: GameVersion | null;
  totalRuns: number;
  runs: RunSummary[];
  nextCursor: number | null;
}

export interface HistoryResponse {
  groups: HistoryGroup[];
  totalRuns: number;
}

export interface PlayerAggregate {
  playerName: string;
  totalKnockedOut: number;
  totalNotCaught: number;
  runsLost: number;
  runsParticipated: number;
}

export interface MostCaughtPokemon {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  count: number;
  spriteUrl: string | null;
}

export interface LongestTeamMember {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  playerName: string;
  routeName: string;
  nickname: string | null;
  daysInTeam: number;
  isActive: boolean;
  spriteUrl: string | null;
}

export type RunTrendCoverage = 'complete' | 'partial' | 'missing' | 'live';

export interface RunTrendPoint {
  id: number;
  runNumber: number;
  status: string;
  startedAt: string;
  endedAt: string | null;
  gameVersion: GameVersion | null;
  sampleSize: number | null;
  caughtCount: number | null;
  knockedOutCount: number | null;
  notCaughtCount: number | null;
  catchRate: number | null;
  detailCoverage: {
    status: RunTrendCoverage;
    documented: number | null;
    total: number | null;
  };
}

export interface AnalyticsResponse {
  scope: { gameKey: string | null; label: string };
  playerStats: PlayerAggregate[];
  mostCaught: MostCaughtPokemon[];
  longestTeamMembers: LongestTeamMember[];
  runTrends: RunTrendPoint[];
}

export interface PlayerRunStats {
  playerName: string;
  knockedOutCount: number;
  notCaughtCount: number;
  isLoser: boolean;
}

export interface RunEncounter {
  id: number;
  playerName: string;
  pokemonPokedexId: number;
  pokemonName: string;
  pokemonNameGerman: string | null;
  routeName: string;
  nickname: string | null;
  teamSlot: number | null;
  isKnockedOut: boolean;
  koCausedBy: string | null;
  koReason: string | null;
  koDate: string | null;
  isNotCaught: boolean;
  notCaughtBy: string | null;
  notCaughtReason: string | null;
  notCaughtDate: string | null;
  caughtAt: string | null;
  createdAt?: string | null;
  spriteUrl?: string | null;
}

export interface RunDetailsResponse {
  run: RunSummary;
  isLive: boolean;
  playerStats: PlayerRunStats[];
  encounters: RunEncounter[];
}

export interface RunComparisonCoverage {
  encounters: {
    status: RunTrendCoverage;
    documented: number | null;
    total: number | null;
  };
  playerStats: RunTrendCoverage;
}

export interface RunComparisonSide extends RunDetailsResponse {
  coverage: RunComparisonCoverage;
}

export type RunComparisonMetricKey =
  | 'caught'
  | 'knockedOut'
  | 'notCaught'
  | 'durationMs'
  | 'badgesEarned';

export interface RunComparisonMetric {
  key: RunComparisonMetricKey;
  label: string;
  unit: 'count' | 'milliseconds';
  left: number | null;
  right: number | null;
  /** Veraenderung vom linken zum rechten Run (right - left). */
  delta: number | null;
}

export interface RunComparisonPlayerSide {
  knockedOutCount: number | null;
  notCaughtCount: number | null;
  isLoser: boolean | null;
}

export interface RunComparisonPlayer {
  playerName: string;
  left: RunComparisonPlayerSide;
  right: RunComparisonPlayerSide;
  deltas: {
    knockedOutCount: number | null;
    notCaughtCount: number | null;
  };
}

export interface RunComparisonResponse {
  left: RunComparisonSide;
  right: RunComparisonSide;
  metrics: RunComparisonMetric[];
  players: RunComparisonPlayer[];
  sameGame: boolean;
}

export function gameFilterKey(gameVersion: GameVersion | null): string {
  return gameVersion?.key || 'unknown';
}

export function gameName(gameVersion: GameVersion | null): string {
  return gameVersion?.name || 'Ohne Spielversion';
}

export function getRunCounts(run: RunSummary): RunCounts {
  return {
    encounters: run.counts?.encounters ?? run.encounterCount ?? 0,
    caught: run.counts?.caught ?? run.caughtCount ?? 0,
    knockedOut: run.counts?.knockedOut ?? run.knockedOutCount ?? 0,
    notCaught: run.counts?.notCaught ?? run.notCaughtCount ?? 0,
  };
}
