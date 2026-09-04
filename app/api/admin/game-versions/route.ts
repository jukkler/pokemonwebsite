/** Admin API: Liste aller Spielversionen. */
import { withAdminAuthAndErrorHandling, success } from '@/lib/api-utils';
import { GAME_VERSIONS } from '@/lib/game-versions';
import { bumpLiveRevisions } from '@/lib/live-updates.server';
import prisma from '@/lib/prisma';

export async function GET() {
  return withAdminAuthAndErrorHandling(async () => {
    if ((await prisma.gameVersion.count()) === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.gameVersion.createMany({
          data: GAME_VERSIONS.map((version) => ({
            key: version.key,
            name: version.name,
            generation: version.generation,
            pokeapiVersionSlug: version.versionSlug,
            pokeapiVersionGroupSlug: version.versionGroupSlug,
          })),
          skipDuplicates: true,
        });
        await bumpLiveRevisions(tx, ['runs']);
      });
    }

    const versions = await prisma.gameVersion.findMany({
      orderBy: [{ generation: 'asc' }, { name: 'asc' }],
    });

    return success(versions);
  }, 'fetching game versions');
}
