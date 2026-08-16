'use client';

/**
 * StreamAdminPanel - Inline Admin-Steuerung zum Hinzufügen/Entfernen von Streams
 */

import { useState } from 'react';
import { isValidYouTubeUrl } from '@/lib/youtube-utils';

interface StreamPlayer {
  name: string;
  color: string;
}

interface StreamData {
  id: number;
  url: string;
  player: StreamPlayer;
}

interface PlayerOption {
  id: number;
  name: string;
}

interface StreamAdminPanelProps {
  streams: StreamData[];
  players: PlayerOption[];
  onAdd: (url: string, playerId: number) => Promise<void>;
  onRemove: (streamId: number) => Promise<void>;
}

export default function StreamAdminPanel({ streams, players, onAdd, onRemove }: StreamAdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Spieler die noch keinen Stream haben
  const usedPlayerIds = new Set(streams.map(s => s.player.name));
  const availablePlayers = players.filter(p => !usedPlayerIds.has(p.name));

  const handleAdd = async () => {
    if (!url.trim()) {
      setError('Bitte YouTube-URL eingeben');
      return;
    }
    if (!isValidYouTubeUrl(url)) {
      setError('Ungültige YouTube-URL');
      return;
    }
    if (!selectedPlayerId) {
      setError('Bitte Spieler auswählen');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onAdd(url.trim(), selectedPlayerId as number);
      setUrl('');
      setSelectedPlayerId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (streamId: number) => {
    setLoading(true);
    try {
      await onRemove(streamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Entfernen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle-Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="app-action app-action-primary fixed bottom-20 right-4 z-50 min-h-11 gap-2 md:bottom-4"
        title="Stream-Verwaltung"
      >
        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Streams verwalten</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto border-t-4 border-red-600 bg-[var(--card-bg)] p-4 shadow-2xl animate-[slide-in-up_0.2s_ease-out]">
            <div className="app-section-title flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">Stream-Verwaltung</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 min-w-11 items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                aria-label="Stream-Verwaltung schließen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formular zum Hinzufügen */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                value={url}
                onChange={e => { setUrl(e.target.value); setError(''); }}
                placeholder="YouTube-URL einfügen..."
                className="min-h-11 flex-1 border border-[var(--border-default)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              />
              <select
                value={selectedPlayerId}
                onChange={e => { setSelectedPlayerId(e.target.value ? Number(e.target.value) : ''); setError(''); }}
                className="min-h-11 border border-[var(--border-default)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="">Spieler...</option>
                {availablePlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={loading}
                className="app-action app-action-primary min-h-11 shrink-0 disabled:opacity-50"
              >
                {loading ? '...' : 'Hinzufügen'}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-3">{error}</p>
            )}

            {/* Aktive Streams */}
            {streams.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-[var(--text-tertiary)]">Aktive Streams</p>
                <div className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
                {streams.map(stream => (
                  <div
                    key={stream.id}
                    className="flex items-center justify-between bg-[var(--background-secondary)] px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3 w-3 shrink-0"
                        style={{ backgroundColor: stream.player.color }}
                      />
                      <span className="text-sm font-medium text-[var(--foreground)]">{stream.player.name}</span>
                      <span className="text-xs text-[var(--text-tertiary)] truncate">{stream.url}</span>
                    </div>
                    <button
                      onClick={() => handleRemove(stream.id)}
                      disabled={loading}
                      className="ml-2 min-h-11 shrink-0 px-2 text-sm font-bold text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-300"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
