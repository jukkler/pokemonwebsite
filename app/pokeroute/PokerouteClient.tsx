'use client';

/**
 * Client-Komponente für Pokeroute mit Admin-Funktionalität
 */

import { useState, useEffect, useCallback } from 'react';
import TeamDisplay from '@/components/TeamDisplay';
import RouteList from '@/components/RouteList';
import { fetchJson } from '@/lib/fetchJson';

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

  // Automatisches Polling: Aktualisiere Daten alle 3 Sekunden
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

    // Polling-Interval: Alle 3 Sekunden aktualisieren
    const interval = setInterval(() => {
      // Nur aktualisieren, wenn die Seite sichtbar ist
      if (!document.hidden) {
        loadData();
      }
    }, 3000); // 3 Sekunden

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
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
          PokéTool by Lukas
        </h1>
      </div>

      {/* Aktuelle Teams */}
      <div className="mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 md:mb-6">Aktuelle Teams</h2>
        {players.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">
              Noch keine Spieler vorhanden. Admin kann Spieler im Admin-Panel hinzufügen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            {players.map((player) => (
              <TeamDisplay
                key={player.id}
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
            ))}
          </div>
        )}
      </div>

      {/* Routen */}
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 md:mb-6">Routen & Encounters</h2>
        <RouteList 
          routes={routes}
          players={players}
          isAdmin={isAdmin}
          onTeamUpdate={reloadData}
          pokemon={pokemon}
        />
      </div>

      {/* Admin: Neue Route erstellen (am Seitenende) */}
      {isAdmin && (
        <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Neue Route erstellen</h3>
          <form onSubmit={handleCreateRoute} className="flex gap-2">
            <input
              type="text"
              value={newRouteName}
              onChange={(e) => setNewRouteName(e.target.value)}
              placeholder="Routenname eingeben..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isCreatingRoute}
            />
            <button
              type="submit"
              disabled={isCreatingRoute || !newRouteName.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
            >
              {isCreatingRoute ? 'Erstelle...' : '+ Route erstellen'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

