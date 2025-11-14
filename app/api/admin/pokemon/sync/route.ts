/**
 * Admin API: Pokemon Sync
 * POST /api/admin/pokemon/sync - Alle verfügbaren Pokémon synchronisieren
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { syncAllPlatinumPokemon, syncAllAvailablePokemon } from '@/lib/pokeapi';
import {
  startPokemonSync,
  updatePokemonSync,
  finishPokemonSync,
} from '@/lib/pokemonSyncProgress';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unbekannter Fehler';

// POST: Alle Pokémon synchronisieren
export async function POST(request: NextRequest) {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Prüfe ob "all" Parameter gesetzt ist
    const syncAll = request.nextUrl.searchParams.get('all') === 'true';

    // Sync starten (dies kann sehr lange dauern!)
    console.log(`Starting Pokemon sync (${syncAll ? 'all available' : 'Gen 1-4 only'})...`);
    
    let results;
    const total = syncAll ? 1050 : 493;
    startPokemonSync(total);

    try {
      results = syncAll
        ? await syncAllAvailablePokemon((current, totalProgress) => {
            updatePokemonSync(current, totalProgress);
            if (current % 50 === 0) {
              console.log(`Progress: ${current}/${totalProgress}`);
            }
          })
        : await syncAllPlatinumPokemon((current, totalProgress) => {
            updatePokemonSync(current, totalProgress);
            if (current % 50 === 0) {
              console.log(`Progress: ${current}/${totalProgress}`);
            }
          });
    } catch (syncError) {
      finishPokemonSync();
      console.error('Error in sync function:', syncError);
      return NextResponse.json(
        { 
          error: `Fehler beim Synchronisieren: ${getErrorMessage(syncError)}`,
          details: syncError instanceof Error ? syncError.stack : undefined,
        },
        { status: 500 }
      );
    }

    finishPokemonSync();

    return NextResponse.json({
      success: true,
      count: results.length,
      message: `${results.length} Pokémon erfolgreich synchronisiert`,
    });
  } catch (error) {
    console.error('Error syncing pokemon:', error);
    return NextResponse.json(
      { 
        error: `Fehler beim Synchronisieren der Pokémon: ${getErrorMessage(error)}`,
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: 500 }
    );
  }
}

