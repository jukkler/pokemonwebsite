'use client';

/**
 * Admin: Routen-Verwaltung
 * CRUD für Routen
 */

import { useState, useEffect } from 'react';

interface Route {
  id: number;
  name: string;
  order: number;
  createdAt: string;
  _count?: {
    encounters: number;
  };
}

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', order: 1 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Berechne die nächsthöhere Order-Nummer
  const getNextOrder = () => {
    if (routes.length === 0) return 1;
    const maxOrder = Math.max(...routes.map(r => r.order));
    return maxOrder + 1;
  };

  // Routen laden
  const loadRoutes = async () => {
    try {
      const res = await fetch('/api/admin/routes');
      const data = await res.json();
      setRoutes(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading routes:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  // Aktualisiere Order-Feld wenn Routen geladen werden und nicht im Edit-Modus
  useEffect(() => {
    if (!editingId && routes.length > 0) {
      const maxOrder = Math.max(...routes.map(r => r.order));
      const nextOrder = maxOrder + 1;
      setFormData(prev => ({ ...prev, order: nextOrder }));
    } else if (!editingId && routes.length === 0) {
      setFormData(prev => ({ ...prev, order: 1 }));
    }
  }, [routes, editingId]);

  // Route erstellen/aktualisieren
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingId
        ? `/api/admin/routes/${editingId}`
        : '/api/admin/routes';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        await loadRoutes();
        setEditingId(null);
        // Order wird durch useEffect automatisch auf getNextOrder() gesetzt
        setFormData({ name: '', order: getNextOrder() });
      } else {
        setError(data.error || 'Fehler beim Speichern');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    }
  };

  // Route löschen
  const handleDelete = async (id: number) => {
    if (!confirm('Route wirklich löschen? Alle Encounters auf dieser Route werden ebenfalls gelöscht.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/routes/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadRoutes();
      } else {
        alert('Fehler beim Löschen');
      }
    } catch (err) {
      alert('Netzwerkfehler');
    }
  };

  // Bearbeiten starten
  const startEdit = (route: Route) => {
    setFormData({ name: route.name, order: route.order });
    setEditingId(route.id);
    setError('');
  };

  // Bearbeiten abbrechen
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', order: getNextOrder() });
    setError('');
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Routen verwalten
      </h1>

      {/* Formular */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {editingId ? 'Route bearbeiten' : 'Neue Route'}
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
              placeholder="z.B. Route 201, Erzelingen, Jubelstadt"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sortier-Reihenfolge
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={getNextOrder().toString()}
            />
            <p className="text-sm text-gray-500 mt-1">
              {editingId 
                ? 'Niedrigere Zahlen werden zuerst angezeigt' 
                : `Automatisch auf ${getNextOrder()} gesetzt. Niedrigere Zahlen werden zuerst angezeigt.`
              }
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
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
        <h2 className="text-2xl font-bold mb-4">Routen-Liste</h2>

        {loading ? (
          <p className="text-gray-500">Lädt...</p>
        ) : routes.length === 0 ? (
          <p className="text-gray-500">Noch keine Routen vorhanden</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Name</th>
                  <th className="text-center py-2 px-4">Reihenfolge</th>
                  <th className="text-center py-2 px-4">Encounters</th>
                  <th className="text-right py-2 px-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-semibold">{route.name}</td>
                    <td className="py-2 px-4 text-center">{route.order}</td>
                    <td className="py-2 px-4 text-center">
                      {route._count?.encounters || 0}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => startEdit(route)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition mr-2"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
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

