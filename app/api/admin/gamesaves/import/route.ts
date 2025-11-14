import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    let parsed: unknown;

    try {
      parsed = JSON.parse(fileContent);
    } catch {
      return NextResponse.json(
        { error: 'Ungültiges JSON im hochgeladenen Spielstand' },
        { status: 400 }
      );
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('players' in parsed) ||
      !('routes' in parsed)
    ) {
      return NextResponse.json(
        { error: 'Spielstand ist unvollständig (players/routes fehlen)' },
        { status: 400 }
      );
    }

    const saveName =
      name && name.length > 0
        ? name
        : `Importiert ${new Date().toLocaleString('de-DE')}`;

    const gameSave = await prisma.gameSave.create({
      data: {
        name: saveName,
        description: description && description.length > 0 ? description : null,
        data: JSON.stringify(parsed),
      },
    });

    return NextResponse.json({
      success: true,
      gameSave: {
        id: gameSave.id,
        name: gameSave.name,
        description: gameSave.description,
        createdAt: gameSave.createdAt,
      },
    });
  } catch (error) {
    console.error('Error importing game save:', error);
    return NextResponse.json(
      { error: 'Fehler beim Importieren des Spielstands' },
      { status: 500 }
    );
  }
}


