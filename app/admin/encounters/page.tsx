'use client';

/**
 * Admin: Encounters-Verwaltung
 * Encounters erstellen und löschen
 */

import { useState, useEffect } from 'react';

interface Player {
  id: number;
  name: string;
  color: string;
}

interface Route {
  id: number;
  name: string;
}

interface Pokemon {
  id: number;
  pokedexId: number;
  name: string;
  nameGerman: string | null;
}

interface Encounter {
  id: number;
  nickname: string | null;
  createdAt: string;
  player: Player;
  route: Route;
  pokemon: Pokemon;
}

export default function AdminEncountersPage() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    playerId: '',
    routeId: '',
    pokemonId: '',
    nickname: '',
  });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Daten laden
  const loadData = async () => {
    try {
      const [encountersRes, playersRes, routesRes, pokemonRes] = await Promise.all([
        fetch('/api/admin/encounters'),
        fetch('/api/admin/players'),
        fetch('/api/admin/routes'),
        fetch('/api/pokemon'),
      ]);

      const encountersData = await encountersRes.json();
      const playersData = await playersRes.json();
      const routesData = await routesRes.json();
      const pokemonData = await pokemonRes.json();

      setEncounters(encountersData);
      setPlayers(playersData);
      setRoutes(routesData);
      setPokemon(pokemonData.pokemon || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Encounter erstellen
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        await loadData();
        setFormData({
          playerId: '',
          routeId: '',
          pokemonId: '',
          nickname: '',
        });
      } else {
        setError(data.error || 'Fehler beim Erstellen');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    }
  };

  // Encounter löschen
  const handleDelete = async (id: number) => {
    if (!confirm('Encounter wirklich löschen?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/encounters/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadData();
      } else {
        alert('Fehler beim Löschen');
      }
    } catch (err) {
      alert('Netzwerkfehler');
    }
  };

  // Pokémon filtern
  const filteredPokemon = pokemon.filter((p) => {
    const search = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(search) ||
      p.nameGerman?.toLowerCase().includes(search) ||
      p.pokedexId.toString().includes(search)
    );
  });

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Encounters verwalten
      </h1>

      {loading ? (
        <p className="text-gray-500">Lädt...</p>
      ) : (
        <>
          {/* Formular */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Neuer Encounter</h2>

            {players.length === 0 || routes.length === 0 || pokemon.length === 0 ? (
              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md">
                <p>
                  Bitte stellen Sie sicher, dass mindestens ein Spieler, eine
                  Route und Pokémon vorhanden sind.
                </p>
                {pokemon.length === 0 && (
                  <p className="mt-2">
                    Gehe zu <a href="/admin/pokemon" className="underline">Pokémon-Cache</a> um Pokémon zu synchronisieren.
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-800 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm">
                  ℹ️ <strong>Regel:</strong> Jeder Spieler darf nur 1 Pokémon pro Route fangen!
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spieler
                  </label>
                  <select
                    required
                    value={formData.playerId}
                    onChange={(e) =>
                      setFormData({ ...formData, playerId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">-- Spieler wählen --</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Route
                  </label>
                  <select
                    required
                    value={formData.routeId}
                    onChange={(e) =>
                      setFormData({ ...formData, routeId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">-- Route wählen --</option>
                    {routes.map((r) => {
                      // Prüfe, ob ausgewählter Spieler bereits auf dieser Route ein Pokémon hat
                      const playerHasEncounter = formData.playerId && encounters.some(
                        (e) => e.player.id === parseInt(formData.playerId) && e.route.id === r.id
                      );
                      return (
                        <option 
                          key={r.id} 
                          value={r.id}
                          disabled={playerHasEncounter}
                        >
                          {r.name} {playerHasEncounter ? '(bereits belegt)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {formData.playerId && (
                    <p className="text-sm text-gray-500 mt-1">
                      Belegte Routen werden ausgegraut
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pokémon
                  </label>
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
                  />
                  <select
                    required
                    value={formData.pokemonId}
                    onChange={(e) =>
                      setFormData({ ...formData, pokemonId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 max-h-48"
                    size={8}
                  >
                    <option value="">-- Pokémon wählen --</option>
                    {filteredPokemon.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.pokedexId} - {p.nameGerman || p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spitzname (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) =>
                      setFormData({ ...formData, nickname: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="z.B. Flammy"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                >
                  Encounter erstellen
                </button>
              </form>
            )}
          </div>

          {/* Liste */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">
              Alle Encounters ({encounters.length})
            </h2>

            {encounters.length === 0 ? (
              <p className="text-gray-500">Noch keine Encounters vorhanden</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Spieler</th>
                      <th className="text-left py-2 px-4">Route</th>
                      <th className="text-left py-2 px-4">Pokémon</th>
                      <th className="text-left py-2 px-4">Spitzname</th>
                      <th className="text-right py-2 px-4">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {encounters.map((encounter) => (
                      <tr key={encounter.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: encounter.player.color }}
                            />
                            {encounter.player.name}
                          </div>
                        </td>
                        <td className="py-2 px-4">{encounter.route.name}</td>
                        <td className="py-2 px-4">
                          #{encounter.pokemon.pokedexId} -{' '}
                          {encounter.pokemon.nameGerman || encounter.pokemon.name}
                        </td>
                        <td className="py-2 px-4">
                          {encounter.nickname ? (
                            <span className="italic">&quot;{encounter.nickname}&quot;</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <button
                            onClick={() => handleDelete(encounter.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                          >
                            Löschen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

