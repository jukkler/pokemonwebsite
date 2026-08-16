export type RunStatus = 'active' | 'failed' | 'completed';
export type RunOutcome = Exclude<RunStatus, 'active'>;

const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  active: 'Aktiv',
  failed: 'Verloren',
  completed: 'Gewonnen',
};

export function getRunStatusLabel(status: string): string {
  return RUN_STATUS_LABELS[status as RunStatus] ?? status;
}

export function calculateWinRate(
  completedRuns: number,
  failedRuns: number
): number | null {
  const finishedRuns = completedRuns + failedRuns;
  if (finishedRuns === 0) return null;

  return Math.round((completedRuns / finishedRuns) * 100);
}

export function isFinishedRunStatus(status: string): status is RunOutcome {
  return status === 'failed' || status === 'completed';
}
