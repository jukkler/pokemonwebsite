import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getPokemonSyncProgress } from '@/lib/pokemonSyncProgress';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const progress = getPokemonSyncProgress();
    return NextResponse.json(progress, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error fetching sync progress:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Sync-Status' },
      { status: 500 }
    );
  }
}


