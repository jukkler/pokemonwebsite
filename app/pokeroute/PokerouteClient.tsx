'use client';

/**
 * Client-Komponente für Pokeroute mit Admin-Funktionalität
 */

import { useState, useEffect, useCallback } from 'react';
import TeamDisplay from '@/components/TeamDisplay';
import RouteList from '@/components/RouteList';
import RunStatsPanel from '@/components/RunStatsPanel';
import { fetchJson } from '@/lib/fetchJson';
import { getAvatarUrl } from '@/lib/avatars';
import Image from 'next/image';
import { BentoGrid, BentoCard } from '@/components/layout/BentoGrid';

interface PlayerEncounter {
  id: number;
  teamSlot: number | null;
  nickname: string | null;
  pokemon: {
    pokedexId: number;
    name: string;
    nameGerman: string | null;
    types: string;
    spriteUrl: string | null;
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  route: {
    id: number;
    name: string;
  };
}

interface Player {
  id: number;
  name: string;
  color: string;
  avatar: string | null;
  encounters: PlayerEncounter[];
}

interface RouteEncounterMeta {
  id: number;
  nickname: string | null;
  teamSlot: number | null;
  isKnockedOut: boolean;
  koCausedBy: string | null;
  koReason: string | null;
  koDate: string | null;
  isNotCaught: boolean;
  notCaughtBy: string | null;
  notCaughtReason: string | null;
  notCaughtDate: string | null;
  player: {
    id: number;
    name: string;
    color: string;
  };
  pokemon: {
    pokedexId: number;
    name: string;
    nameGerman: string | null;
    types: string;
    spriteUrl: string | null;
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
}

interface RouteListRoute {
  id: number;
  name: string;
  order: number;
  encounters: RouteEncounterMeta[];
}

interface Pokemon {
  id: number;
  pokedexId: number;
  name: string;
  nameGerman: string | null;
}

interface PokerouteClientProps {
  initialPlayers: Player[];
  initialRoutes: RouteListRoute[];
}

export default function PokerouteClient({
  initialPlayers,
  initialRoutes,
}: PokerouteClientProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [routes, setRoutes] = useState<RouteListRoute[]>(initialRoutes);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);

  // Auth-Status prüfen und Pokémon laden
  useEffect(() => {
    fetchJson<{ isAdmin?: boolean }>('/api/auth/status')
      .then((data) => {
        setIsAdmin(data.isAdmin || false);
        // Pokémon nur für Admins laden
        if (data.isAdmin) {
          fetchJson<{ pokemon: Pokemon[] }>('/api/pokemon')
            .then((pokemonData) => {
              setPokemon(pokemonData.pokemon || []);
            })
            .catch((err) => {
              console.error('Error loading pokemon:', err);
            });
        }
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, []);

  // Daten neu laden (wird auch von anderen Funktionen verwendet)
  const reloadData = useCallback(async () => {
    try {
      const [playersData, routesData] = await Promise.all([
        fetchJson<Player[]>('/api/players'),
        fetchJson<RouteListRoute[]>('/api/routes'),
      ]);

      setPlayers(playersData);
      setRoutes(routesData);
    } catch (error) {
      console.error('Error reloading data:', error);
    }
  }, []); // Keine Dependencies, da setState stabil ist

  // Automatisches Polling: Aktualisiere Daten regelmäßig
  useEffect(() => {
    // Funktion zum Laden der Daten (definiert im useEffect für stabile Referenz)
    const loadData = async () => {
      try {
        const [playersData, routesData] = await Promise.all([
          fetchJson<Player[]>('/api/players'),
          fetchJson<RouteListRoute[]>('/api/routes'),
        ]);

        setPlayers(playersData);
        setRoutes(routesData);
      } catch (error) {
        console.error('Error reloading data:', error);
      }
    };

    // Initiales Laden
    loadData();

    // Polling-Interval: Jede Sekunde aktualisieren für Echtzeit-Experience
    const interval = setInterval(() => {
      // Nur aktualisieren, wenn die Seite sichtbar ist
      if (!document.hidden) {
        loadData();
      }
    }, 1000); // 1 Sekunde für Echtzeit-Updates

    // Cleanup beim Unmount
    return () => clearInterval(interval);
  }, []); // Leeres Array - Funktion ist im useEffect definiert

  // Encounter aus Team entfernen
  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Unbekannter Fehler';

  const handleRemoveFromTeam = async (routeId: number) => {
    try {
      await fetchJson(`/api/admin/routes/${routeId}/set-team-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlot: null }),
      });
      await reloadData();
    } catch (error: unknown) {
      alert(`Fehler beim Entfernen: ${getErrorMessage(error)}`);
    }
  };

  // Neue Route erstellen
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName.trim()) return;

    setIsCreatingRoute(true);
    try {
      // Berechne die nächste Order-Nummer
      const maxOrder = routes.length > 0 
        ? Math.max(...routes.map(r => r.order)) 
        : 0;

      await fetchJson('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newRouteName.trim(),
          order: maxOrder + 1,
        }),
      });
      setNewRouteName('');
      await reloadData();
    } catch (error: unknown) {
      alert(`Fehler beim Erstellen: ${getErrorMessage(error)}`);
    } finally {
      setIsCreatingRoute(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-screen-2xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--foreground)] mb-2">
          PokéTool by Lukas
        </h1>
      </div>

      {/* Bento Grid Layout */}
      <BentoGrid>
        {/* Spieler Teams - links (2 Spalten), untereinander */}
        {players.length === 0 ? (
          <BentoCard
            span={{ sm: 1, md: 2, lg: 2 }}
            className="animate-[scale-in_0.3s_ease-out] lg:row-start-1"
          >
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="w-16 h-16 text-[var(--text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-[var(--text-secondary)] text-lg">
                Noch keine Spieler vorhanden. Admin kann Spieler im Admin-Panel hinzufügen.
              </p>
            </div>
          </BentoCard>
        ) : (
          players.map((player, index) => {
            // Explizite Row-Klassen für jedes Player-Item
            const rowClass = index === 0 ? 'lg:row-start-1' : index === 1 ? 'lg:row-start-2' : 'lg:row-start-3';
            return (
              <BentoCard
                key={player.id}
                span={{ sm: 1, md: 2, lg: 2 }}
                playerColor={player.color}
                className={`stagger-${(index % 6) + 1} animate-[scale-in_0.3s_ease-out] lg:col-span-2 ${rowClass}`}
              >
              <div className="flex items-center gap-2.5 mb-3">
                {(() => {
                  const avatarUrl = getAvatarUrl(player.avatar);
                  return avatarUrl ? (
                    <div
                      className="relative w-8 h-8 rounded-full overflow-hidden ring-2 transition-all duration-300 hover:ring-4"
                      style={{
                        ringColor: player.color,
                        '--tw-ring-color': player.color,
                        boxShadow: `0 0 12px ${player.color}40`
                      } as React.CSSProperties}
                    >
                      <Image
                        src={avatarUrl}
                        alt={player.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div
                      className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(var(--player-color-rgb),0.5)]"
                      style={{ backgroundColor: player.color }}
                    />
                  );
                })()}
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  {player.name}
                </h2>
              </div>
              <TeamDisplay
                playerName={player.name}
                playerColor={player.color}
                playerAvatar={player.avatar}
                teamMembers={player.encounters}
                routes={routes}
                isAdmin={isAdmin}
                onRemoveFromTeam={handleRemoveFromTeam}
                onEvolution={reloadData}
                pokemon={pokemon}
              />
              </BentoCard>
            );
          })
        )}

        {/* Live Stats Sidebar - rechts (1 Spalte), über 3 Reihen */}
        <BentoCard
          span={{ sm: 1, md: 1, lg: 1 }}
          variant="glass"
          className="order-first lg:order-none lg:col-start-3 lg:col-span-1 lg:row-start-1 lg:row-[span_3_/_span_3] animate-[scale-in_0.3s_ease-out]"
        >
          <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">Live Stats</h2>
          <RunStatsPanel />
        </BentoCard>

        {/* Routen Übersicht - unten (volle Breite) */}
        <BentoCard
          span={{ sm: 1, md: 3, lg: 3 }}
          className="animate-[scale-in_0.3s_ease-out] stagger-3 lg:col-span-3 lg:row-start-4"
        >
          <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">Routen & Encounters</h2>
          <RouteList
            routes={routes}
            players={players}
            isAdmin={isAdmin}
            onTeamUpdate={reloadData}
            pokemon={pokemon}
          />
        </BentoCard>
      </BentoGrid>

      {/* Admin: Neue Route erstellen (außerhalb Bento Grid) */}
      {isAdmin && (
        <div className="mt-8 bg-[var(--card-bg)] rounded-xl shadow-md p-6 border border-[var(--border-default)] transition-all duration-300 hover:border-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Neue Route erstellen</h3>
          <form onSubmit={handleCreateRoute} className="flex gap-2">
            <input
              type="text"
              value={newRouteName}
              onChange={(e) => setNewRouteName(e.target.value)}
              placeholder="Routenname eingeben..."
              className="flex-1 px-3 py-2 border border-[var(--border-default)] bg-[var(--background-secondary)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
              disabled={isCreatingRoute}
            />
            <button
              type="submit"
              disabled={isCreatingRoute || !newRouteName.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium whitespace-nowrap"
            >
              {isCreatingRoute ? 'Erstelle...' : '+ Route erstellen'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

