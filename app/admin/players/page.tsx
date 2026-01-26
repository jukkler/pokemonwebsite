'use client';

/**
 * Admin: Spieler-Verwaltung
 * CRUD für Spieler mit Avatar-Upload
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { AVATAR_OPTIONS, getAvatarUrl } from '@/lib/avatars';

interface Player {
  id: number;
  name: string;
  color: string;
  avatar: string | null;
  createdAt: string;
  _count?: {
    encounters: number;
    teamMembers: number;
  };
}

interface UploadedAvatar {
  filename: string;
  url: string;
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', color: '#FF0000', avatar: 'none' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [uploadedAvatars, setUploadedAvatars] = useState<UploadedAvatar[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Spieler laden
  const loadPlayers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/players');
      const data = await res.json();
      setPlayers(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading players:', err);
      setLoading(false);
    }
  }, []);

  // Hochgeladene Avatare laden
  const loadUploadedAvatars = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/avatars/upload');
      const data = await res.json();
      if (data.data?.avatars) {
        setUploadedAvatars(data.data.avatars);
      }
    } catch (err) {
      console.error('Error loading uploaded avatars:', err);
    }
  }, []);

  // Avatar hochladen
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('avatar', file);

      const res = await fetch('/api/admin/avatars/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();

      if (res.ok && data.data?.url) {
        // Neuen Avatar zur Liste hinzufügen und auswählen
        const newAvatar = { filename: data.data.filename, url: data.data.url };
        setUploadedAvatars(prev => [...prev, newAvatar]);
        setFormData(prev => ({ ...prev, avatar: data.data.url }));
      } else {
        setError(data.error || 'Fehler beim Hochladen');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Netzwerkfehler beim Hochladen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Hochgeladenen Avatar löschen
  const handleDeleteUploadedAvatar = async (filename: string, url: string) => {
    if (!confirm('Avatar wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/admin/avatars/${filename}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUploadedAvatars(prev => prev.filter(a => a.filename !== filename));
        // Falls der gelöschte Avatar ausgewählt war, zurücksetzen
        if (formData.avatar === url) {
          setFormData(prev => ({ ...prev, avatar: 'none' }));
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  useEffect(() => {
    // Spieler und Avatare initial laden
    loadPlayers();
    loadUploadedAvatars();
  }, [loadPlayers, loadUploadedAvatars]);

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
        setFormData({ name: '', color: '#FF0000', avatar: 'none' });
        setEditingId(null);
      } else {
        setError(data.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Error saving player:', error);
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
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Netzwerkfehler');
    }
  };

  // Bearbeiten starten
  const startEdit = (player: Player) => {
    setFormData({ name: player.name, color: player.color, avatar: player.avatar || 'none' });
    setEditingId(player.id);
    setError('');
  };

  // Bearbeiten abbrechen
  const cancelEdit = () => {
    setFormData({ name: '', color: '#FF0000', avatar: 'none' });
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar
            </label>
            
            {/* Vordefinierte Avatare */}
            <p className="text-xs text-gray-500 mb-2">Vordefinierte Avatare:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.key}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar: avatar.key })}
                  className={`relative w-14 h-14 rounded-lg border-2 transition flex items-center justify-center ${
                    formData.avatar === avatar.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  title={avatar.label}
                >
                  {avatar.url ? (
                    <Image
                      src={avatar.url}
                      alt={avatar.label}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Ohne</span>
                  )}
                  {formData.avatar === avatar.key && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Hochgeladene Avatare */}
            {uploadedAvatars.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mb-2">Eigene Avatare:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {uploadedAvatars.map((avatar) => (
                    <div key={avatar.filename} className="relative group">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: avatar.url })}
                        className={`relative w-14 h-14 rounded-lg border-2 transition flex items-center justify-center overflow-hidden ${
                          formData.avatar === avatar.url
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <Image
                          src={avatar.url}
                          alt="Eigener Avatar"
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                        {formData.avatar === avatar.url && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                      {/* Löschen-Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteUploadedAvatar(avatar.filename, avatar.url)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Avatar löschen"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Upload-Button */}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className={`px-4 py-2 rounded-md cursor-pointer transition ${
                  uploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {uploading ? 'Lädt...' : '📤 Eigenen Avatar hochladen'}
              </label>
              <span className="text-xs text-gray-500">
                PNG, JPG, GIF oder WebP (max. 500KB)
              </span>
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
                  <th className="text-left py-2 px-4">Spieler</th>
                  <th className="text-left py-2 px-4">Farbe</th>
                  <th className="text-center py-2 px-4">Encounters</th>
                  <th className="text-center py-2 px-4">Team</th>
                  <th className="text-right py-2 px-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => {
                  const avatarUrl = getAvatarUrl(player.avatar);
                  return (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={player.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full border-2"
                            style={{ backgroundColor: player.color }}
                          />
                        )}
                        <span className="font-medium">{player.name}</span>
                      </div>
                    </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

