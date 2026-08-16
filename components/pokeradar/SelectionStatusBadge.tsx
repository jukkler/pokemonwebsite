import {
  getSelectionStatusLabel,
  type ComparisonSelectionStatus,
} from '@/components/pokeradar/team-comparison-types';

const STATUS_CLASS_NAMES: Record<ComparisonSelectionStatus, string> = {
  none: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  team: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  caught: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  ko: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
  'not-caught': 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
};

export default function SelectionStatusBadge({
  status,
  className = '',
}: {
  status: ComparisonSelectionStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS_NAMES[status]} ${className}`}
    >
      {getSelectionStatusLabel(status)}
    </span>
  );
}
