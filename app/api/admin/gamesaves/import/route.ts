import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import {
  GameSaveValidationError,
  validateGameSaveData,
} from '@/lib/gamesave-validation';

export async function POST(request: Request) {
  return withAdminAuth(async () => {
    try {
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

    // Dateigröße prüfen (max 50MB)
    const MAX_GAMESAVE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_GAMESAVE_SIZE) {
      return NextResponse.json(
        { error: 'Datei zu groß. Maximum: 50MB' },
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

    let validated: ReturnType<typeof validateGameSaveData>;
    try {
      validated = validateGameSaveData(parsed);
    } catch (error) {
      if (error instanceof GameSaveValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const saveName =
      name && name.length > 0
        ? name
        : `Importiert ${new Date().toLocaleString('de-DE')}`;

    const gameSave = await prisma.gameSave.create({
      data: {
        name: saveName,
        description: description && description.length > 0 ? description : null,
        data: JSON.stringify(validated),
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
  });
}


