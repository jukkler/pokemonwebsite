'use client';

/**
 * Admin: Pokémon-Cache-Verwaltung
 * PokeAPI Synchronisierung und Cache-Übersicht
 */

import { useState, useEffect } from 'react';

interface Pokemon {
  id: number;
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  updatedAt: string;
}

export default function AdminPokemonPage() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [addPokedexId, setAddPokedexId] = useState('');
  const [adding, setAdding] = useState(false);
  const MAX_AVAILABLE = 1050; // Aktuell verfügbare Pokémon (Gen 1-9)

  // Pokémon laden
  const loadPokemon = async () => {
    try {
      const res = await fetch('/api/pokemon');
      const data = await res.json();
      setPokemon(data.pokemon || []);
      setCount(data.count || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error loading pokemon:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPokemon();
  }, []);

  // Alle Pokémon synchronisieren (Gen 1-4, 1-493)
  const handleSyncPlatinum = async () => {
    if (!confirm('Alle Pokémon von Gen 1-4 (1-493) synchronisieren? Dies kann einige Minuten dauern.')) {
      return;
    }

    setSyncing(true);
    setSyncProgress('Synchronisierung gestartet...');

    try {
      const res = await fetch('/api/admin/pokemon/sync', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setSyncProgress(`Erfolgreich! ${data.count} Pokémon synchronisiert.`);
        await loadPokemon();
      } else {
        const errorMsg = data.error || 'Unbekannter Fehler';
        const details = data.details ? `\n\nDetails: ${data.details}` : '';
        setSyncProgress(`Fehler: ${errorMsg}${details}`);
        console.error('Sync error:', data);
      }
    } catch (err: any) {
      setSyncProgress(`Netzwerkfehler beim Synchronisieren: ${err.message || 'Unbekannter Fehler'}`);
      console.error('Network error:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Alle verfügbaren Pokémon synchronisieren (1-1050)
  const handleSyncAll = async () => {
    if (!confirm(`Alle verfügbaren Pokémon (1-${MAX_AVAILABLE}, Gen 1-9) synchronisieren?\n\nDies kann 15-20 Minuten dauern!`)) {
      return;
    }

    setSyncing(true);
    setSyncProgress('Synchronisierung gestartet... (Dies kann sehr lange dauern!)');

    try {
      const res = await fetch('/api/admin/pokemon/sync?all=true', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setSyncProgress(`Erfolgreich! ${data.count} Pokémon synchronisiert.`);
        await loadPokemon();
      } else {
        const errorMsg = data.error || 'Unbekannter Fehler';
        const details = data.details ? `\n\nDetails: ${data.details}` : '';
        setSyncProgress(`Fehler: ${errorMsg}${details}`);
        console.error('Sync error:', data);
      }
    } catch (err: any) {
      setSyncProgress(`Netzwerkfehler beim Synchronisieren: ${err.message || 'Unbekannter Fehler'}`);
      console.error('Network error:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Einzelnes Pokémon hinzufügen
  const handleAddPokemon = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const res = await fetch('/api/admin/pokemon/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pokedexId: addPokedexId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        setAddPokedexId('');
        await loadPokemon();
      } else {
        alert(`Fehler: ${data.error}`);
      }
    } catch (err) {
      alert('Netzwerkfehler');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Pokémon-Cache verwalten
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Gecachte Pokémon
          </h3>
          <p className="text-4xl font-bold text-red-600">{count}</p>
          <p className="text-sm text-gray-500 mt-1">
            von {MAX_AVAILABLE} (Gen 1-9)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Fortschritt
          </h3>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-blue-600">
              {((count / MAX_AVAILABLE) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((count / MAX_AVAILABLE) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sync-Aktionen */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Synchronisierung</h2>

        <div className="space-y-4">
          {/* Vollständige Synchronisierung - Alle verfügbaren */}
          <div>
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {syncing
                ? 'Synchronisiere...'
                : `Alle verfügbaren Pokémon synchronisieren (1-${MAX_AVAILABLE})`}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Lädt alle verfügbaren Pokémon von Gen 1-9 von der PokeAPI. Dies kann 15-20 Minuten dauern.
            </p>
            {syncProgress && (
              <div className={`mt-3 p-3 rounded-md whitespace-pre-wrap ${
                syncProgress.startsWith('Fehler:') || syncProgress.startsWith('Netzwerkfehler')
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}>
                <div className="max-h-48 overflow-y-auto">
                  {syncProgress}
                </div>
              </div>
            )}
          </div>

          {/* Nur Gen 1-4 Synchronisierung */}
          <div className="pt-4 border-t">
            <button
              onClick={handleSyncPlatinum}
              disabled={syncing}
              className="px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing
                ? 'Synchronisiere...'
                : 'Nur Gen 1-4 synchronisieren (1-493)'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Lädt nur Pokémon von Gen 1-4 (Pokémon Platin). Dies kann 5-10 Minuten dauern.
            </p>
          </div>

          {/* Einzelnes Pokémon hinzufügen */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">
              Einzelnes Pokémon hinzufügen
            </h3>
            <form onSubmit={handleAddPokemon} className="flex gap-2">
              <input
                type="number"
                min="1"
                max={MAX_AVAILABLE}
                required
                value={addPokedexId}
                onChange={(e) => setAddPokedexId(e.target.value)}
                placeholder={`Pokedex-Nummer (1-${MAX_AVAILABLE})`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
              >
                {adding ? 'Lädt...' : 'Hinzufügen'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Pokémon-Liste */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Gecachte Pokémon</h2>

        {loading ? (
          <p className="text-gray-500">Lädt...</p>
        ) : pokemon.length === 0 ? (
          <p className="text-gray-500">
            Noch keine Pokémon im Cache. Klicke auf &quot;Alle Pokémon
            synchronisieren&quot; um zu starten.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="text-left py-2 px-4">#</th>
                  <th className="text-left py-2 px-4">Name (Deutsch)</th>
                  <th className="text-left py-2 px-4">Name (Englisch)</th>
                  <th className="text-left py-2 px-4">Zuletzt aktualisiert</th>
                </tr>
              </thead>
              <tbody>
                {pokemon.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">#{p.pokedexId}</td>
                    <td className="py-2 px-4 font-semibold">
                      {p.nameGerman || '-'}
                    </td>
                    <td className="py-2 px-4">{p.name}</td>
                    <td className="py-2 px-4 text-gray-500">
                      {new Date(p.updatedAt).toLocaleDateString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

