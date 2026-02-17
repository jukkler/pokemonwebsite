import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

function buildSafeDownloadFilename(name: string, id: number): {
  asciiFilename: string;
  encodedFilename: string;
} {
  const normalized = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._ -]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\.]+|[_\.]+$/g, '');

  const base = normalized || 'gamesave';
  const asciiFilename = `${base}_${id}.json`;
  const encodedFilename = encodeURIComponent(asciiFilename);

  return { asciiFilename, encodedFilename };
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async () => {
    try {
    const { id } = await params;
    const gameSaveId = parseInt(id, 10);

    if (Number.isNaN(gameSaveId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    const gameSave = await prisma.gameSave.findUnique({
      where: { id: gameSaveId },
    });

    if (!gameSave) {
      return NextResponse.json(
        { error: 'Spielstand nicht gefunden' },
        { status: 404 }
      );
    }

    const { asciiFilename, encodedFilename } = buildSafeDownloadFilename(
      gameSave.name,
      gameSaveId
    );

    return new NextResponse(gameSave.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
      },
    });
    } catch (error) {
      console.error('Error downloading game save:', error);
      return NextResponse.json(
        { error: 'Fehler beim Herunterladen des Spielstands' },
        { status: 500 }
      );
    }
  });
}


