'use client';

/**
 * Admin: Spieler-Verwaltung
 * CRUD für Spieler
 */

import { useState, useEffect } from 'react';

interface Player {
  id: number;
  name: string;
  color: string;
  createdAt: string;
  _count?: {
    encounters: number;
    teamMembers: number;
  };
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', color: '#FF0000' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Spieler laden
  const loadPlayers = async () => {
    try {
      const res = await fetch('/api/admin/players');
      const data = await res.json();
      setPlayers(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading players:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  // Spieler erstellen/aktualisieren
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingId
        ? `/api/admin/players/${editingId}`
        : '/api/admin/players';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        await loadPlayers();
        setFormData({ name: '', color: '#FF0000' });
        setEditingId(null);
      } else {
        setError(data.error || 'Fehler beim Speichern');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    }
  };

  // Spieler löschen
  const handleDelete = async (id: number) => {
    if (!confirm('Spieler wirklich löschen? Alle Encounters und Team-Einträge werden ebenfalls gelöscht.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/players/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadPlayers();
      } else {
        alert('Fehler beim Löschen');
      }
    } catch (err) {
      alert('Netzwerkfehler');
    }
  };

  // Bearbeiten starten
  const startEdit = (player: Player) => {
    setFormData({ name: player.name, color: player.color });
    setEditingId(player.id);
    setError('');
  };

  // Bearbeiten abbrechen
  const cancelEdit = () => {
    setFormData({ name: '', color: '#FF0000' });
    setEditingId(null);
    setError('');
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Spieler verwalten
      </h1>

      {/* Formular */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {editingId ? 'Spieler bearbeiten' : 'Neuer Spieler'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Farbe
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="h-10 w-20 cursor-pointer rounded-md"
              />
              <span className="text-sm text-gray-600">{formData.color}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              {editingId ? 'Aktualisieren' : 'Erstellen'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition"
              >
                Abbrechen
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Spieler-Liste</h2>

        {loading ? (
          <p className="text-gray-500">Lädt...</p>
        ) : players.length === 0 ? (
          <p className="text-gray-500">Noch keine Spieler vorhanden</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Name</th>
                  <th className="text-left py-2 px-4">Farbe</th>
                  <th className="text-center py-2 px-4">Encounters</th>
                  <th className="text-center py-2 px-4">Team</th>
                  <th className="text-right py-2 px-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{player.name}</td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="text-sm text-gray-600">
                          {player.color}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-center">
                      {player._count?.encounters || 0}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {player._count?.teamMembers || 0}/6
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => startEdit(player)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition mr-2"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(player.id)}
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
    </div>
  );
}

