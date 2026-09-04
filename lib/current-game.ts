import { getKnownGameVersion } from './game-versions';
import prisma from './prisma';

export interface CurrentGameVersion {
  key: string;
  name: string;
  generation: number;
  versionSlug: string;
  versionGroupSlug: string;
}

/**
 * Gleiche Auswahlregel wie das Dashboard: aktiver Run, sonst der neueste
 * nicht archivierte Run. Alte Datenbanken profitieren vom statischen Mapping,
 * auch bevor die neuen PokeAPI-Spalten nachgeseedet wurden.
 */
export async function getCurrentGameVersion(): Promise<CurrentGameVersion | null> {
  const select = {
    gameVersionKey: true,
    gameVersion: {
      select: {
        key: true,
        name: true,
        generation: true,
        pokeapiVersionSlug: true,
        pokeapiVersionGroupSlug: true,
      },
    },
  } as const;
  const [activeRun, latestRun] = await Promise.all([
    prisma.run.findFirst({
      where: { archived: false, status: 'active' },
      select,
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    }),
    prisma.run.findFirst({
      where: { archived: false },
      select,
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    }),
  ]);

  const run = activeRun ?? latestRun;
  if (!run?.gameVersionKey) return null;

  const known = getKnownGameVersion(run.gameVersionKey);
  const stored = run.gameVersion;
  const versionSlug = stored?.pokeapiVersionSlug ?? known?.versionSlug;
  const versionGroupSlug = stored?.pokeapiVersionGroupSlug ?? known?.versionGroupSlug;
  if (!versionSlug || !versionGroupSlug) return null;

  return {
    key: run.gameVersionKey,
    name: stored?.name ?? known?.name ?? run.gameVersionKey,
    generation: stored?.generation ?? known?.generation ?? 0,
    versionSlug,
    versionGroupSlug,
  };
}
