'use client';

import { useState, useEffect, useCallback } from 'react';

interface GameSave {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminGameSavesPage() {
  const [gameSaves, setGameSaves] = useState<GameSave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Unbekannter Fehler';

  const fetchGameSaves = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gamesaves');
      if (!res.ok) throw new Error('Fehler beim Laden');
      const json = await res.json();
      // API gibt { data: GameSave[], success: true } zurueck
      const data: GameSave[] = json.data || [];
      setGameSaves(data);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGameSaves();
  }, [fetchGameSaves]);

  const handleSaveGame = async () => {
    if (!saveName.trim()) {
      alert('Bitte gib einen Namen ein');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/admin/gamesaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          description: saveDescription,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      alert('Spielstand erfolgreich gespeichert!');
      setShowSaveDialog(false);
      setSaveName('');
      setSaveDescription('');
      fetchGameSaves();
    } catch (error) {
      alert(`Fehler: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleLoadGame = async (gameSaveId: number, name: string) => {
    if (
      !confirm(
        `Möchtest du wirklich den Spielstand "${name}" laden?\n\nALLE AKTUELLEN DATEN WERDEN ÜBERSCHRIEBEN!\n\nTipp: Speichere vorher dein aktuelles Spiel!`
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/admin/gamesaves/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameSaveId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Laden');
      }

      const data = await res.json();
      alert(data.message);
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      alert(`Fehler: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleNewGame = async () => {
    if (
      !confirm(
        `Möchtest du wirklich ein NEUES SPIEL starten?\n\nALLE AKTUELLEN DATEN WERDEN GELÖSCHT!\n\n✓ Ein Auto-Save wird erstellt\n\nFortfahren?`
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/admin/gamesaves/newgame', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Starten');
      }

      const data = await res.json();
      alert(data.message);
      window.location.reload();
    } catch (error) {
      alert(`Fehler: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleResetGame = async () => {
    if (
      !confirm(
        `⚠️ ACHTUNG: Möchtest du wirklich das aktuelle Spiel ZURÜCKSETZEN?\n\nALLE AKTUELLEN DATEN WERDEN UNWIDERRUFLICH GELÖSCHT!\n\n❌ Es wird KEIN Auto-Save erstellt!\n\nDies kann NICHT rückgängig gemacht werden!\n\nFortfahren?`
      )
    ) {
      return;
    }

    // Doppelte Bestätigung für Reset
    if (
      !confirm(
        `⚠️ LETZTE WARNUNG!\n\nBist du dir wirklich sicher?\n\nAlle Spieler, Routen und Encounters werden gelöscht!`
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/admin/gamesaves/reset', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Zurücksetzen');
      }

      const data = await res.json();
      alert(data.message);
      window.location.reload();
    } catch (error) {
      alert(`Fehler: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSave = async (gameSaveId: number, name: string) => {
    if (!confirm(`Spielstand "${name}" wirklich löschen?`)) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/gamesaves/${gameSaveId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Löschen');
      }

      alert('Spielstand gelöscht');
      fetchGameSaves();
    } catch (error) {
      alert(`Fehler: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadSave = (gameSaveId: number) => {
    window.location.href = `/api/admin/gamesaves/${gameSaveId}/download`;
  };

  const handleUploadSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Bitte wähle eine JSON-Datei aus.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadName.trim()) {
        formData.append('name', uploadName.trim());
      }
      if (uploadDescription.trim()) {
        formData.append('description', uploadDescription.trim());
      }

      const res = await fetch('/api/admin/gamesaves/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Importieren');
      }

      alert('Spielstand erfolgreich importiert!');
      setUploadName('');
      setUploadDescription('');
      setUploadFile(null);
      fetchGameSaves();
    } catch (error) {
      setUploadError(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Lade Spielstände...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">Fehler: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Spielstände verwalten
          </h1>
          <p className="text-gray-600">
            Speichere deinen Fortschritt oder lade alte Spielstände
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={processing}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
          >
            💾 Aktuelles Spiel speichern
          </button>
          <button
            onClick={handleNewGame}
            disabled={processing}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
          >
            🆕 Neues Spiel starten
          </button>
          <button
            onClick={handleResetGame}
            disabled={processing}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
          >
            🔄 Aktuelles Spiel zurücksetzen
          </button>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Spielstand speichern</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="z.B. Pokémon Platin - Abgeschlossen"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung (optional)
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="z.B. Alle 8 Orden, Team Level 50+"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveName('');
                    setSaveDescription('');
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition"
                  disabled={processing}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveGame}
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition disabled:opacity-50"
                >
                  {processing ? 'Speichere...' : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Saves List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-bold">
            Gespeicherte Spielstände ({gameSaves.length})
          </h2>
        </div>

        {gameSaves.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg mb-2">📦 Noch keine Spielstände vorhanden</p>
            <p className="text-sm">
              Klicke auf &quot;Aktuelles Spiel speichern&quot;, um deinen Fortschritt zu sichern.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {gameSaves.map((save) => (
              <div
                key={save.id}
                className="p-6 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {save.name}
                    </h3>
                    {save.description && (
                      <p className="text-gray-600 mb-2">{save.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>
                        📅 Erstellt:{' '}
                        {new Date(save.createdAt).toLocaleString('de-DE')}
                      </span>
                      {save.updatedAt !== save.createdAt && (
                        <span>
                          🔄 Aktualisiert:{' '}
                          {new Date(save.updatedAt).toLocaleString('de-DE')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-4">
                    <button
                      onClick={() => handleDownloadSave(save.id)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition text-sm font-semibold"
                      disabled={processing}
                    >
                      ⬇️ Download
                    </button>
                    <button
                      onClick={() => handleLoadGame(save.id, save.name)}
                      disabled={processing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition disabled:opacity-50 text-sm font-semibold"
                    >
                      📂 Laden
                    </button>
                    <button
                      onClick={() => handleDeleteSave(save.id, save.name)}
                      disabled={processing}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition disabled:opacity-50 text-sm font-semibold"
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Spielstand importieren</h2>
        <p className="text-sm text-gray-600 mb-4">
          Lade einen zuvor exportierten Spielstand als JSON-Datei hoch, um ihn in die Liste aufzunehmen.
        </p>
        <form className="space-y-4" onSubmit={handleUploadSave}>
          {uploadError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md">{uploadError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datei *
            </label>
            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setUploadFile(file);
              }}
              className="w-full text-sm text-gray-600"
            />
            {uploadFile && (
              <p className="text-xs text-gray-500 mt-1">
                Ausgewählt: {uploadFile.name}
              </p>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung (optional)
              </label>
              <input
                type="text"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition disabled:opacity-50 font-semibold"
            >
              {uploading ? 'Importiere...' : 'Importieren'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2">💡 Tipps:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>💾 Aktuelles Spiel speichern</strong>: Erstellt einen Snapshot
            deines aktuellen Fortschritts
          </li>
          <li>
            • <strong>📂 Laden</strong>: Überschreibt ALLE aktuellen Daten mit dem
            gespeicherten Stand
          </li>
          <li>
            • <strong>🆕 Neues Spiel starten</strong>: Löscht alle Daten und
            erstellt automatisch einen Auto-Save
          </li>
          <li>
            • <strong>🔄 Aktuelles Spiel zurücksetzen</strong>: Löscht alle Daten
            <span className="text-red-700 font-bold"> OHNE Auto-Save</span> (doppelte Bestätigung erforderlich!)
          </li>
          <li>
            • <strong>🗑️ Löschen</strong>: Entfernt einen gespeicherten Spielstand
          </li>
          <li>
            • Spielstände enthalten: Spieler, Routen, Encounters und Team-Slots
          </li>
        </ul>
      </div>
    </div>
  );
}

