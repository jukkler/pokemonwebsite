import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

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

    const filename = `${gameSave.name.replace(/\s+/g, '_') || 'gamesave'}_${
      gameSaveId
    }.json`;

    return new NextResponse(gameSave.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading game save:', error);
    return NextResponse.json(
      { error: 'Fehler beim Herunterladen des Spielstands' },
      { status: 500 }
    );
  }
}


