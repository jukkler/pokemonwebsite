import type {
  ComparisonMetric,
  ComparisonSource,
  ComparisonSelectionStatus,
} from '@/lib/pokemon-comparison';
import type {
  PokeradarPlayerTeam,
  PokeradarTeamSlot,
} from '@/lib/pokeradar-team-data';

export type { ComparisonSelectionStatus } from '@/lib/pokemon-comparison';

const COMPARISON_SELECTION_STATUS_SET = new Set<ComparisonSelectionStatus>([
  'none',
  'team',
  'caught',
  'ko',
  'not-caught',
]);

export type TeamSourceMember = PokeradarTeamSlot;
export type TeamSourcePlayer = PokeradarPlayerTeam;

export interface TeamComparisonSelection {
  pokemonIds: number[];
  statuses: ComparisonSelectionStatus[];
  referenceId: number | null;
  metric: ComparisonMetric;
  source?: ComparisonSource | null;
  sourceLabel?: string | null;
}

export interface SavedTeamSnapshotV1 extends TeamComparisonSelection {
  version: 1;
  id: string;
  label: string;
  createdAt: string;
}

export interface SavedComparisonSetV2 extends TeamComparisonSelection {
  version: 2;
  id: string;
  label: string;
  createdAt: string;
}

export interface SavedComparisonSetsV2 {
  version: 2;
  sets: SavedComparisonSetV2[];
}

export function isComparisonSelectionStatus(
  value: unknown,
): value is ComparisonSelectionStatus {
  return COMPARISON_SELECTION_STATUS_SET.has(value as ComparisonSelectionStatus);
}

export function getSelectionStatusLabel(
  status: ComparisonSelectionStatus,
): string {
  switch (status) {
    case 'none':
      return 'Ohne Status';
    case 'team':
      return 'Im Team';
    case 'caught':
      return 'Gefangen';
    case 'ko':
      return 'K.O.';
    case 'not-caught':
      return 'Nicht gefangen';
  }
}
