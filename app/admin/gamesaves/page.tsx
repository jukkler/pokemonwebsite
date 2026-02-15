'use client';

import { useState, useEffect, useCallback } from 'react';

interface GameSave {
  id: number;
  name: string;
  description: string | null;
  gameVersionKey: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GameVersion {
  key: string;
  name: string;
  generation: number;
}

interface Run {
  id: number;
  runNumber: number;
  status: string;
  loserPlayerName: string | null;
  startedAt: string;
  endedAt: string | null;
  gameVersion: GameVersion | null;
  playerStats: {
    playerName: string;
    knockedOutCount: number;
    notCaughtCount: number;
    isLoser: boolean;
  }[];
}

interface Player {
  id: number;
  name: string;
}

export default function AdminGameSavesPage() {
  const [gameSaves, setGameSaves] = useState<GameSave[]>([]);
  const [gameVersions, setGameVersions] = useState<GameVersion[]>([]);
  const [activeRun, setActiveRun] = useState<Run | null>(null);
  const [historicalRuns, setHistoricalRuns] = useState<Run[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Dialog States
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showEndRunDialog, setShowEndRunDialog] = useState(false);
  const [showRestartRunDialog, setShowRestartRunDialog] = useState(false);
  const [showStartRunDialog, setShowStartRunDialog] = useState(false);
  
  // Form States
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveGameVersion, setSaveGameVersion] = useState('');
  const [selectedLoser, setSelectedLoser] = useState('');
  const [newRunGameVersion, setNewRunGameVersion] = useState('');
  
  // Upload States
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Unbekannter Fehler';

  const fetchData = useCallback(async () => {
    try {
      const [savesRes, versionsRes, runsRes, playersRes] = await Promise.all([
        fetch('/api/admin/gamesaves'),
        fetch('/api/admin/game-versions'),
        fetch('/api/admin/runs'),
        fetch('/api/players'),
      ]);

      if (!savesRes.ok || !versionsRes.ok || !runsRes.ok) {
        throw new Error('Fehler beim Laden der Daten');
      }

      const savesJson = await savesRes.json();
      const versionsJson = await versionsRes.json();
      const runsJson = await runsRes.json();
      const playersJson = await playersRes.json();

      setGameSaves(savesJson.data || []);
      setGameVersions(versionsJson.data || []);
      setActiveRun(runsJson.data?.activeRun || null);
      setHistoricalRuns(runsJson.data?.historicalRuns || []);
      setPlayers(playersJson || []);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Run Management
  const handleStartRun = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameVersionKey: newRunGameVersion || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Starten');
      }

      alert('Neuer Run gestartet!');
      setShowStartRunDialog(false);
      setNewRunGameVersion('');
      fetchData();
    } catch (error) {
      alert(`Fehler: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleEndRun = async () => {
    if (!activeRun || !selectedLoser) {
      alert('Bitte wähle einen Verlierer aus');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/runs/${activeRun.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'failed',
          loserPlayerName: selectedLoser,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Beenden');
      }

      alert(`Run #${activeRun.runNumber} beendet. ${selectedLoser} hat verloren.`);
      setShowEndRunDialog(false);
      setSelectedLoser('');
      fetchData();
    } catch (error) {
      alert(`Fehler: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRestartRun = async () => {
    if (!selectedLoser) {
      alert('Bitte wähle einen Verlierer aus');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/admin/runs/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loserPlayerName: selectedLoser,
          gameVersionKey: newRunGameVersion || activeRun?.gameVersion?.key || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Neustarten');
      }

      const data = await res.json();
      alert(data.data?.message || 'Run neu gestartet!');
      setShowRestartRunDialog(false);
      setSelectedLoser('');
      setNewRunGameVersion('');
      window.location.reload();
    } catch (error) {
      alert(`Fehler: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  // GameSave Management
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
          gameVersionKey: saveGameVersion || null,
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
      setSaveGameVersion('');
      fetchData();
    } catch (error) {
      alert(`Fehler: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleLoadGame = async (gameSaveId: number, name: string) => {
    if (!confirm(`Möchtest du wirklich den Spielstand "${name}" laden?\n\nALLE AKTUELLEN DATEN WERDEN ÜBERSCHRIEBEN!`)) {
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
      window.location.reload();
    } catch (error) {
      alert(`Fehler: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSave = async (gameSaveId: number, name: string) => {
    if (!confirm(`Spielstand "${name}" wirklich löschen?`)) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/gamesaves/${gameSaveId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Löschen');
      }
      alert('Spielstand gelöscht');
      fetchData();
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
      if (uploadName.trim()) formData.append('name', uploadName.trim());
      if (uploadDescription.trim()) formData.append('description', uploadDescription.trim());

      const res = await fetch('/api/admin/gamesaves/import', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Fehler beim Importieren');

      alert('Spielstand erfolgreich importiert!');
      setUploadName('');
      setUploadDescription('');
      setUploadFile(null);
      fetchData();
    } catch (error) {
      setUploadError(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  // Group versions by generation
  const versionsByGen = gameVersions.reduce((acc, v) => {
    if (!acc[v.generation]) acc[v.generation] = [];
    acc[v.generation].push(v);
    return acc;
  }, {} as Record<number, GameVersion[]>);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-[var(--text-tertiary)]">Lade Daten...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-400">Fehler: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Spielstände & Runs</h1>
      <p className="text-[var(--text-secondary)] mb-6">Verwalte Spielstände und Nuzlocke-Runs</p>

      {/* Aktueller Run Status */}
      <div className="bg-[var(--card-bg)] rounded-lg shadow-lg p-6 mb-6 border border-[var(--border-default)]">
        <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Aktueller Run</h2>
        
        {activeRun ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg">
                <span className="font-bold text-green-400">Run #{activeRun.runNumber}</span>
                {activeRun.gameVersion && (
                  <span className="ml-2 text-[var(--text-secondary)]">- {activeRun.gameVersion.name}</span>
                )}
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">
                Gestartet: {new Date(activeRun.startedAt).toLocaleDateString('de-DE')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRestartRunDialog(true)}
                disabled={processing}
                className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-lg transition disabled:opacity-50 font-semibold"
              >
                🔄 Run neu starten
              </button>
              <button
                onClick={() => setShowEndRunDialog(true)}
                disabled={processing}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition disabled:opacity-50 font-semibold"
              >
                ❌ Run beenden
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-[var(--text-tertiary)]">Kein aktiver Run. Starte einen neuen Run!</p>
            <button
              onClick={() => setShowStartRunDialog(true)}
              disabled={processing}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition disabled:opacity-50 font-semibold"
            >
              ▶️ Neuen Run starten
            </button>
          </div>
        )}
      </div>

      {/* Run History */}
      {historicalRuns.length > 0 && (
        <div className="bg-[var(--card-bg)] rounded-lg shadow-lg p-6 mb-6 border border-[var(--border-default)]">
          <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Run-Historie ({historicalRuns.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="py-2 px-4 text-[var(--text-secondary)]">Run</th>
                  <th className="py-2 px-4 text-[var(--text-secondary)]">Spiel</th>
                  <th className="py-2 px-4 text-[var(--text-secondary)]">Status</th>
                  <th className="py-2 px-4 text-[var(--text-secondary)]">Verlierer</th>
                  <th className="py-2 px-4 text-[var(--text-secondary)]">Datum</th>
                </tr>
              </thead>
              <tbody>
                {historicalRuns.map((run) => (
                  <tr key={run.id} className="border-b border-[var(--border-default)] hover:bg-[var(--background-secondary)]">
                    <td className="py-2 px-4 font-bold text-[var(--foreground)]">#{run.runNumber}</td>
                    <td className="py-2 px-4 text-[var(--foreground)]">{run.gameVersion?.name || '-'}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-sm border ${
                        run.status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'
                      }`}>
                        {run.status === 'failed' ? 'Gescheitert' : 'Abgeschlossen'}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-[var(--foreground)]">{run.loserPlayerName || '-'}</td>
                    <td className="py-2 px-4 text-sm text-[var(--text-tertiary)]">
                      {run.endedAt ? new Date(run.endedAt).toLocaleDateString('de-DE') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Spielstände Actions */}
      <div className="flex justify-end gap-3 mb-4">
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={processing}
          className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition disabled:opacity-50 font-semibold"
        >
          💾 Aktuelles Spiel speichern
        </button>
      </div>

      {/* Game Saves List */}
      <div className="bg-[var(--card-bg)] rounded-lg shadow-lg overflow-hidden mb-6 border border-[var(--border-default)]">
        <div className="px-6 py-4 bg-[var(--background-secondary)] border-b border-[var(--border-default)]">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Gespeicherte Spielstände ({gameSaves.length})</h2>
        </div>

        {gameSaves.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-tertiary)]">
            <p className="text-lg mb-2">📦 Noch keine Spielstände vorhanden</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {gameSaves.map((save) => (
              <div key={save.id} className="p-6 hover:bg-[var(--background-secondary)] transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">{save.name}</h3>
                    {save.description && <p className="text-[var(--text-secondary)] mb-2">{save.description}</p>}
                    <div className="flex gap-4 text-sm text-[var(--text-tertiary)]">
                      <span>📅 {new Date(save.createdAt).toLocaleString('de-DE')}</span>
                      {save.gameVersionKey && (
                        <span>🎮 {gameVersions.find(v => v.key === save.gameVersionKey)?.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-4">
                    <button
                      onClick={() => handleDownloadSave(save.id)}
                      className="px-4 py-2 bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] text-[var(--foreground)] border border-[var(--border-default)] rounded-md transition text-sm font-semibold"
                      disabled={processing}
                    >
                      ⬇️ Download
                    </button>
                    <button
                      onClick={() => handleLoadGame(save.id, save.name)}
                      disabled={processing}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-md transition disabled:opacity-50 text-sm font-semibold"
                    >
                      📂 Laden
                    </button>
                    <button
                      onClick={() => handleDeleteSave(save.id, save.name)}
                      disabled={processing}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-md transition disabled:opacity-50 text-sm font-semibold"
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

      {/* Upload Section */}
      <div className="bg-[var(--card-bg)] rounded-lg shadow-lg p-6 border border-[var(--border-default)]">
        <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Spielstand importieren</h2>
        <form className="space-y-4" onSubmit={handleUploadSave}>
          {uploadError && <div className="bg-red-500/20 text-red-400 p-3 rounded-md border border-red-500/30">{uploadError}</div>}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Datei *</label>
            <input
              type="file"
              accept="application/json"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-[var(--foreground)]"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name (optional)</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--background-secondary)] text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Beschreibung (optional)</label>
              <input
                type="text"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--background-secondary)] text-[var(--foreground)]"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-md transition disabled:opacity-50 font-semibold"
            >
              {uploading ? 'Importiere...' : 'Importieren'}
            </button>
          </div>
        </form>
      </div>

      {/* Dialogs */}
      
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--border-default)]">
            <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Spielstand speichern</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name *</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="z.B. Pokémon Platin - Nach Arena 4"
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--background-secondary)] text-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Spielversion</label>
                <select
                  value={saveGameVersion}
                  onChange={(e) => setSaveGameVersion(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--background-secondary)] text-[var(--foreground)]"
                >
                  <option value="">-- Keine Version --</option>
                  {Object.entries(versionsByGen).map(([gen, versions]) => (
                    <optgroup key={gen} label={`Generation ${gen}`}>
                      {versions.map((v) => (
                        <option key={v.key} value={v.key}>{v.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Beschreibung (optional)</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--background-secondary)] text-[var(--foreground)]"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowSaveDialog(false); setSaveName(''); setSaveDescription(''); setSaveGameVersion(''); }}
                  className="px-4 py-2 bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] text-[var(--foreground)] border border-[var(--border-default)] rounded-md"
                  disabled={processing}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveGame}
                  disabled={processing}
                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-md disabled:opacity-50"
                >
                  {processing ? 'Speichere...' : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Run Dialog */}
      {showStartRunDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--border-default)]">
            <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Neuen Run starten</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Spielversion</label>
                <select
                  value={newRunGameVersion}
                  onChange={(e) => setNewRunGameVersion(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--background-secondary)] text-[var(--foreground)]"
                >
                  <option value="">-- Keine Version --</option>
                  {Object.entries(versionsByGen).map(([gen, versions]) => (
                    <optgroup key={gen} label={`Generation ${gen}`}>
                      {versions.map((v) => (
                        <option key={v.key} value={v.key}>{v.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowStartRunDialog(false); setNewRunGameVersion(''); }}
                  className="px-4 py-2 bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] text-[var(--foreground)] border border-[var(--border-default)] rounded-md"
                  disabled={processing}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleStartRun}
                  disabled={processing}
                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-md disabled:opacity-50"
                >
                  {processing ? 'Starte...' : 'Run starten'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Run Dialog */}
      {showEndRunDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--border-default)]">
            <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Run beenden</h2>
            <p className="text-[var(--text-secondary)] mb-4">Wer hat den Run verloren?</p>
            <div className="space-y-4">
              <select
                value={selectedLoser}
                onChange={(e) => setSelectedLoser(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--background-secondary)] text-[var(--foreground)]"
              >
                <option value="">-- Spieler auswählen --</option>
                {players.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowEndRunDialog(false); setSelectedLoser(''); }}
                  className="px-4 py-2 bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] text-[var(--foreground)] border border-[var(--border-default)] rounded-md"
                  disabled={processing}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleEndRun}
                  disabled={processing || !selectedLoser}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-md disabled:opacity-50"
                >
                  {processing ? 'Beende...' : 'Run beenden'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restart Run Dialog */}
      {showRestartRunDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--border-default)]">
            <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Run neu starten</h2>
            <p className="text-[var(--text-secondary)] mb-2">Der aktuelle Run wird als gescheitert markiert.</p>
            <p className="text-[var(--text-secondary)] mb-4">Spieler bleiben erhalten, Routen und Encounters werden gelöscht.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Wer hat verloren? *</label>
                <select
                  value={selectedLoser}
                  onChange={(e) => setSelectedLoser(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--background-secondary)] text-[var(--foreground)]"
                >
                  <option value="">-- Spieler auswählen --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Spielversion für neuen Run</label>
                <select
                  value={newRunGameVersion}
                  onChange={(e) => setNewRunGameVersion(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--background-secondary)] text-[var(--foreground)]"
                >
                  <option value="">-- Gleiche Version beibehalten --</option>
                  {Object.entries(versionsByGen).map(([gen, versions]) => (
                    <optgroup key={gen} label={`Generation ${gen}`}>
                      {versions.map((v) => (
                        <option key={v.key} value={v.key}>{v.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowRestartRunDialog(false); setSelectedLoser(''); setNewRunGameVersion(''); }}
                  className="px-4 py-2 bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] text-[var(--foreground)] border border-[var(--border-default)] rounded-md"
                  disabled={processing}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleRestartRun}
                  disabled={processing || !selectedLoser}
                  className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-md disabled:opacity-50"
                >
                  {processing ? 'Starte neu...' : 'Run neu starten'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
