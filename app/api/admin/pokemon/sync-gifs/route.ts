/**
 * Admin API: Sync GIF Sprites
 * POST /api/admin/pokemon/sync-gifs - Synchronisiert GIF-Sprites für alle Pokémon
 */

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { syncGifSprites } from '@/lib/pokeapi';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unbekannter Fehler';

// POST: GIF-Sprites synchronisieren
export async function POST() {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    console.log('Starting GIF sprite sync...');
    
    const result = await syncGifSprites((current, total, updated) => {
      if (current % 10 === 0) {
        console.log(`GIF Sync Progress: ${current}/${total} (${updated} updated)`);
      }
    });

    return NextResponse.json({
      success: true,
      message: `GIF-Sprites synchronisiert: ${result.updated} von ${result.total} aktualisiert`,
      total: result.total,
      updated: result.updated,
    });
  } catch (error) {
    console.error('Error syncing GIF sprites:', error);
    return NextResponse.json(
      { 
        error: `Fehler beim Synchronisieren der GIF-Sprites: ${getErrorMessage(error)}`,
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Bitte POST verwenden um GIF-Sprites zu synchronisieren' },
    { status: 405 }
  );
}
