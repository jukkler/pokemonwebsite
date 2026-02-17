/**
 * Admin API: Streams
 * POST /api/admin/streams - Stream hinzufügen
 */

import { NextRequest } from 'next/server';
import { withAdminAuthAndErrorHandling, success, badRequest } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { isValidYouTubeUrl } from '@/lib/youtube-utils';

export async function POST(request: NextRequest) {
  return withAdminAuthAndErrorHandling(async () => {
    const body = await request.json();
    const { url, playerId } = body;

    if (!url || !playerId) {
      return badRequest('URL und Spieler sind erforderlich');
    }

    if (!isValidYouTubeUrl(url)) {
      return badRequest('Ungültige YouTube-URL');
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return badRequest('Spieler nicht gefunden');
    }

    const stream = await prisma.stream.create({
      data: {
        url: String(url).trim(),
        playerId,
      },
      include: { player: true },
    });

    return success(stream);
  }, 'creating stream');
}
