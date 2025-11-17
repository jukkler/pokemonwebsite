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

  // Auth-Status prüfen
  useEffect(() => {
    fetchJson<{ isAdmin?: boolean }>('/api/auth/status')
      .then((data) => {
        setIsAdmin(data.isAdmin || false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          PokéTool by Lukas
        </h1>
      </div>

      {/* Aktuelle Teams */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Aktuelle Teams</h2>
        {players.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">
              Noch keine Spieler vorhanden. Admin kann Spieler im Admin-Panel hinzufügen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {players.map((player) => (
              <TeamDisplay
                key={player.id}
                playerName={player.name}
                playerColor={player.color}
                teamMembers={player.encounters}
                routes={routes}
                isAdmin={isAdmin}
                onRemoveFromTeam={handleRemoveFromTeam}
              />
            ))}
          </div>
        )}
      </div>

      {/* Routen */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Routen & Encounters</h2>
        <RouteList 
          routes={routes}
          players={players}
          isAdmin={isAdmin}
          onTeamUpdate={reloadData}
        />
      </div>
    </div>
  );
}

