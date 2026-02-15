/**
 * Admin Dashboard
 * Übersicht und Links zu Admin-Funktionen
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import prisma from '@/lib/prisma';

async function getStats() {
  const [playerCount, routeCount, encounterCount, pokemonCount] =
    await Promise.all([
      prisma.player.count(),
      prisma.route.count(),
      prisma.encounter.count(),
      prisma.pokemon.count(),
    ]);

  return { playerCount, routeCount, encounterCount, pokemonCount };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      title: 'Spieler',
      count: stats.playerCount,
      href: '/admin/players',
      color: 'bg-blue-500',
    },
    {
      title: 'Routen',
      count: stats.routeCount,
      href: '/pokeroute',
      color: 'bg-green-500',
    },
    {
      title: 'Encounters',
      count: stats.encounterCount,
      href: '/pokeroute',
      color: 'bg-purple-500',
    },
    {
      title: 'Gecachte Pokémon',
      count: stats.pokemonCount,
      href: '/admin/pokemon',
      color: 'bg-red-500',
    },
  ];

  return (
    <div>
      <h1 className="text-4xl font-bold text-[var(--foreground)] mb-8">
        Admin Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="block bg-[var(--card-bg)] rounded-lg shadow-lg p-6 hover:shadow-xl transition border border-[var(--border-default)]"
          >
            <div
              className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-2xl font-bold mb-4`}
            >
              {card.count}
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              {card.title}
            </h3>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-[var(--card-bg)] rounded-lg shadow-lg p-6 border border-[var(--border-default)]">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Schnellzugriff
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/players"
            className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-md transition text-center"
          >
            Spieler verwalten
          </Link>
          <Link
            href="/admin/pokemon"
            className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-md transition text-center"
          >
            Pokémon synchronisieren
          </Link>
          <Link
            href="/admin/gamesaves"
            className="px-4 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-md transition text-center"
          >
            💾 Spielstände verwalten
          </Link>
          <Link
            href="/admin/import"
            className="px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-md transition text-center"
          >
            📤 CSV importieren
          </Link>
          <Link
            href="/pokeroute"
            className="px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-md transition text-center"
          >
            🎮 Routen & Teams bearbeiten
          </Link>
        </div>
      </div>
    </div>
  );
}

