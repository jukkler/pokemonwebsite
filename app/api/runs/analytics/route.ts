/**
 * Public API: Run Analytics
 * GET /api/runs/analytics - Erweiterte Statistiken für Statistik-Seite
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface LongestTeamMember {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  playerName: string;
  routeName: string;
  nickname: string | null;
  daysInTeam: number;
  isActive: boolean;
  spriteUrl: string | null;
}

export async function GET() {
  try {
    // 1. Häufigste Pokémon über nicht-archivierte Runs
    const nonArchivedRunIds = (await prisma.run.findMany({
      where: { archived: false },
      select: { id: true },
    })).map(r => r.id);

    const runEncounters = await prisma.runEncounter.findMany({
      where: {
        isNotCaught: false,
        runId: { in: nonArchivedRunIds },
      },
      select: {
        pokemonPokedexId: true,
        pokemonName: true,
        pokemonNameGerman: true,
      },
    });

    // Gruppiere nach pokemonPokedexId und zähle
    const pokemonCountMap = new Map<number, { name: string; nameGerman: string | null; count: number }>();

    for (const enc of runEncounters) {
      const existing = pokemonCountMap.get(enc.pokemonPokedexId);
      if (existing) {
        existing.count += 1;
      } else {
        pokemonCountMap.set(enc.pokemonPokedexId, {
          name: enc.pokemonName,
          nameGerman: enc.pokemonNameGerman,
          count: 1,
        });
      }
    }

    // Konvertiere zu Array, sortiere nach count (absteigend) und nimm Top 10
    const mostCaughtArray = Array.from(pokemonCountMap.entries())
      .map(([pokedexId, data]) => ({
        pokedexId,
        name: data.name,
        nameGerman: data.nameGerman,
        count: data.count,
        spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexId}.png`,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 2. Pokémon am längsten im Team (aus aktivem Run)
    const activeRun = await prisma.run.findFirst({
      where: { status: 'active' },
    });

    let longestTeamMembers: LongestTeamMember[] = [];

    if (activeRun) {
      const encounters = await prisma.encounter.findMany({
        where: {
          isNotCaught: false, // Nur gefangene Pokémon
        },
        select: {
          createdAt: true,
          isKnockedOut: true,
          koDate: true,
          nickname: true,
          player: { select: { name: true } },
          route: { select: { name: true } },
          pokemon: { select: { pokedexId: true, name: true, nameGerman: true, spriteUrl: true } },
        },
      });

      const now = new Date();

      longestTeamMembers = encounters
        .map(enc => {
          // Berechne Tage seit Fang
          const startDate = enc.createdAt;
          const endDate = enc.isKnockedOut && enc.koDate ? enc.koDate : now;
          const daysInTeam = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

          return {
            pokedexId: enc.pokemon.pokedexId,
            name: enc.pokemon.name,
            nameGerman: enc.pokemon.nameGerman,
            playerName: enc.player.name,
            routeName: enc.route.name,
            nickname: enc.nickname,
            daysInTeam,
            isActive: !enc.isKnockedOut,
            spriteUrl: enc.pokemon.spriteUrl,
          };
        })
        .sort((a, b) => b.daysInTeam - a.daysInTeam)
        .slice(0, 10);
    }

    return NextResponse.json(
      {
        mostCaught: mostCaughtArray,
        longestTeamMembers,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching run analytics:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Analytics' },
      { status: 500 }
    );
  }
}
