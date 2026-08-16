export interface DashboardPlayerStatSummary {
  knockedOut: number;
  notCaught: number;
}

export interface DashboardHistoricalPlayerStats extends DashboardPlayerStatSummary {
  runs: number;
  failed: number;
}

export interface DashboardRunPlayerStatSnapshot {
  playerName: string;
  knockedOutCount: number;
  notCaughtCount: number;
  isLoser: boolean;
}

export interface DashboardRunStatSource {
  status: string;
  playerStats: DashboardRunPlayerStatSnapshot[];
}

export function getRunsForDashboardGame<T extends { gameVersionKey: string | null }>(
  runs: readonly T[],
  gameVersionKey: string | null,
): T[] {
  return runs.filter(run => run.gameVersionKey === gameVersionKey);
}

export interface DashboardLiveEncounterStat {
  routeId: number;
  koCausedBy: string | null;
  notCaughtBy: string | null;
}

const emptyStats = (): DashboardPlayerStatSummary => ({
  knockedOut: 0,
  notCaught: 0,
});

export function getCurrentRunPlayerStats(
  playerNames: readonly string[],
  run: DashboardRunStatSource | null,
  liveEncounters: readonly DashboardLiveEncounterStat[],
): Map<string, DashboardPlayerStatSummary> {
  const result = new Map(playerNames.map(name => [name, emptyStats()]));
  if (!run) return result;

  if (run.status === 'active') {
    for (const playerName of playerNames) {
      result.set(playerName, {
        knockedOut: new Set(
          liveEncounters
            .filter(encounter => encounter.koCausedBy === playerName)
            .map(encounter => encounter.routeId),
        ).size,
        notCaught: new Set(
          liveEncounters
            .filter(encounter => encounter.notCaughtBy === playerName)
            .map(encounter => encounter.routeId),
        ).size,
      });
    }
    return result;
  }

  for (const snapshot of run.playerStats) {
    if (!result.has(snapshot.playerName)) continue;
    result.set(snapshot.playerName, {
      knockedOut: snapshot.knockedOutCount,
      notCaught: snapshot.notCaughtCount,
    });
  }

  return result;
}

export function getHistoricalPlayerStats(
  playerNames: readonly string[],
  runs: readonly DashboardRunStatSource[],
): Map<string, DashboardHistoricalPlayerStats> {
  const result = new Map(
    playerNames.map(name => [name, { ...emptyStats(), runs: 0, failed: 0 }]),
  );

  for (const run of runs) {
    if (run.status === 'active') continue;

    for (const snapshot of run.playerStats) {
      const aggregate = result.get(snapshot.playerName);
      if (!aggregate) continue;

      aggregate.runs += 1;
      aggregate.knockedOut += snapshot.knockedOutCount;
      aggregate.notCaught += snapshot.notCaughtCount;
      aggregate.failed += snapshot.isLoser ? 1 : 0;
    }
  }

  return result;
}
