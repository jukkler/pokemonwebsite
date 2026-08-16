import { NextResponse } from 'next/server';
import { withAdminAuthAndErrorHandling } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export async function GET() {
  return withAdminAuthAndErrorHandling(async () => {
    const pokemon = await prisma.pokemon.findMany({
      select: {
        id: true,
        pokedexId: true,
        name: true,
        nameGerman: true,
      },
      orderBy: { pokedexId: 'asc' },
    });

    return NextResponse.json(
      { data: pokemon, success: true },
      {
        headers: {
          'Cache-Control': 'private, max-age=300',
        },
      },
    );
  }, 'fetching compact pokemon options');
}
