'use client';

/**
 * Admin: Team-Builder (Neues System)
 * Verwalte Teams basierend auf Routen
 * Alle Pokémon einer Route teilen sich einen Team-Slot
 */

import { useState, useEffect, useCallback } from 'react';
import PokemonCard from '@/components/PokemonCard';

interface Pokemon {
  id: number;
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  types: string;
  spriteUrl: string | null;
}

interface Player {
  id: number;
  name: string;
  color: string;
}

interface Encounter {
  id: number;
  nickname: string | null;
  teamSlot: number | null;
  player: Player;
  pokemon: Pokemon;
}

interface Route {
  id: number;
  name: string;
  order: number;
  encounters: Encounter[];
}

export default function AdminTeamPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotAssignments, setSlotAssignments] = useState<{ [key: number]: number | null }>({});

  // Routen und Encounters laden
  const loadRoutes = useCallback(async () => {
    try {
      const res = await fetch('/api/routes');
      const data = await res.json();
      setRoutes(data);
      
      // Sammle aktuelle Slot-Zuweisungen
      const assignments: { [key: number]: number | null } = {};
      data.forEach((route: Route) => {
        if (route.encounters.length > 0) {
          assignments[route.id] = route.encounters[0].teamSlot;
        }
      });
      setSlotAssignments(assignments);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading routes:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Teamsicht initial befüllen
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRoutes();
  }, [loadRoutes]);

  // Slot für Route setzen
  const setTeamSlot = async (routeId: number, slot: number | null) => {
    try {
      const res = await fetch(`/api/admin/routes/${routeId}/set-team-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlot: slot }),
      });

      const data = await res.json();

      if (res.ok) {
        await loadRoutes();
        alert(`Route erfolgreich ${slot ? `zu Slot ${slot} hinzugefügt` : 'aus Team entfernt'}!`);
      } else {
        alert(`Fehler: ${data.error}`);
      }
    } catch (error) {
      console.error('Error setting team slot:', error);
      alert('Netzwerkfehler');
    }
  };

  // Welche Slots sind bereits belegt?
  const usedSlots = Object.values(slotAssignments).filter(s => s !== null) as number[];

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Teams bearbeiten (Routen-basiert)
      </h1>
      
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-8">
        <h2 className="font-bold mb-2">ℹ️ So funktioniert das Team-System:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Alle Pokémon einer Route teilen sich einen Team-Slot (1-6)</li>
          <li>Wenn Route &quot;Zweiblattdorf&quot; auf Slot 1 ist, sind ALLE Pokémon von Zweiblattdorf auf Slot 1</li>
          <li>Jeder Slot kann nur von einer Route belegt werden</li>
          <li>Maximal 6 Routen können ins Team aufgenommen werden</li>
        </ul>
      </div>

      {loading ? (
        <p className="text-gray-500">Lädt...</p>
      ) : (
        <div className="space-y-6">
          {routes.map((route) => {
            const currentSlot = slotAssignments[route.id];
            const hasEncounters = route.encounters.length > 0;
            
            return (
              <div key={route.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{route.name}</h3>
                    {currentSlot && (
                      <p className="text-sm text-green-600 font-semibold">
                        ✓ Im Team (Slot {currentSlot})
                      </p>
                    )}
                    {!hasEncounters && (
                      <p className="text-sm text-gray-500">
                        Keine Pokémon auf dieser Route gefangen
                      </p>
                    )}
                  </div>

                  {hasEncounters && (
                    <div className="flex gap-2 flex-wrap">
                      {currentSlot ? (
                        <button
                          onClick={() => setTeamSlot(route.id, null)}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                        >
                          Aus Team entfernen
                        </button>
                      ) : (
                        <>
                          {[1, 2, 3, 4, 5, 6].map((slot) => {
                            const isUsed = usedSlots.includes(slot);
                            return (
                              <button
                                key={slot}
                                onClick={() => setTeamSlot(route.id, slot)}
                                disabled={isUsed}
                                className={`px-4 py-2 rounded-md transition ${
                                  isUsed
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                                title={isUsed ? 'Slot bereits belegt' : `Zu Slot ${slot} hinzufügen`}
                              >
                                Slot {slot}
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Pokémon dieser Route horizontal anzeigen */}
                {hasEncounters && (
                  <div className="flex flex-wrap items-start gap-6 border-t pt-4">
                    {Array.from(
                      new Set(route.encounters.map((e) => e.player.id))
                    ).map((playerId) => {
                      const playerEncounters = route.encounters.filter(
                        (e) => e.player.id === playerId
                      );
                      const player = playerEncounters[0].player;

                      return (
                        <div key={playerId} className="flex-shrink-0">
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: player.color }}
                            />
                            <h4 className="font-semibold text-lg">{player.name}</h4>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {playerEncounters.map((encounter) => (
                              <div key={encounter.id} className="flex-shrink-0">
                                <PokemonCard
                                  pokemon={encounter.pokemon}
                                  nickname={encounter.nickname}
                                  size="small"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
