'use client';

/**
 * Client-Komponente für Pokeroute mit Admin-Funktionalität
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TeamDisplay from '@/components/TeamDisplay';
import RouteList from '@/components/RouteList';

interface Player {
  id: number;
  name: string;
  color: string;
  encounters: any[];
}

interface Route {
  id: number;
  name: string;
  encounters: any[];
}

interface PokerouteClientProps {
  initialPlayers: Player[];
  initialRoutes: Route[];
}

export default function PokerouteClient({
  initialPlayers,
  initialRoutes,
}: PokerouteClientProps) {
  const router = useRouter();
  const [players, setPlayers] = useState(initialPlayers);
  const [routes, setRoutes] = useState(initialRoutes);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth-Status prüfen
  useEffect(() => {
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.isAdmin || false);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Daten neu laden (wird auch von anderen Funktionen verwendet)
  const reloadData = useCallback(async () => {
    try {
      const [playersRes, routesRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/routes'),
      ]);
      
      const playersData = await playersRes.json();
      const routesData = await routesRes.json();
      
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
        const [playersRes, routesRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/routes'),
        ]);
        
        const playersData = await playersRes.json();
        const routesData = await routesRes.json();
        
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
  const handleRemoveFromTeam = async (routeId: number) => {
    try {
      const res = await fetch(`/api/admin/routes/${routeId}/set-team-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlot: null }),
      });

      if (res.ok) {
        await reloadData();
      } else {
        const data = await res.json();
        alert(`Fehler: ${data.error}`);
      }
    } catch (error) {
      alert('Netzwerkfehler beim Entfernen');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          PokémonTool by Lukas
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

