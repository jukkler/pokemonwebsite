/**
 * Admin API: Pokemon Sync
 * POST /api/admin/pokemon/sync - Alle verfügbaren Pokémon synchronisieren
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { syncAllPlatinumPokemon, syncAllAvailablePokemon } from '@/lib/pokeapi';

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
    try {
      results = syncAll
        ? await syncAllAvailablePokemon((current, total) => {
            if (current % 50 === 0) {
              console.log(`Progress: ${current}/${total}`);
            }
          })
        : await syncAllPlatinumPokemon((current, total) => {
            if (current % 50 === 0) {
              console.log(`Progress: ${current}/${total}`);
            }
          });
    } catch (syncError: any) {
      console.error('Error in sync function:', syncError);
      return NextResponse.json(
        { 
          error: `Fehler beim Synchronisieren: ${syncError.message || 'Unbekannter Fehler'}`,
          details: syncError.stack 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      message: `${results.length} Pokémon erfolgreich synchronisiert`,
    });
  } catch (error: any) {
    console.error('Error syncing pokemon:', error);
    return NextResponse.json(
      { 
        error: `Fehler beim Synchronisieren der Pokémon: ${error.message || 'Unbekannter Fehler'}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

