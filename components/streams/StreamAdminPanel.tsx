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
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-[var(--card-bg)] border border-[var(--border-default)] shadow-lg flex items-center justify-center hover:bg-[var(--background-tertiary)] transition-colors md:bottom-4"
        title="Stream-Verwaltung"
      >
        <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
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
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card-bg)] border-t border-[var(--border-default)] rounded-t-2xl shadow-2xl p-4 max-h-[50vh] overflow-y-auto animate-[slide-in-up_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Stream-Verwaltung</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--foreground)]"
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
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border-default)] text-[var(--foreground)] text-sm placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-blue-500"
              />
              <select
                value={selectedPlayerId}
                onChange={e => { setSelectedPlayerId(e.target.value ? Number(e.target.value) : ''); setError(''); }}
                className="px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border-default)] text-[var(--foreground)] text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Spieler...</option>
                {availablePlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
              >
                {loading ? '...' : 'Hinzufügen'}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-3">{error}</p>
            )}

            {/* Aktive Streams */}
            {streams.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">Aktive Streams</p>
                {streams.map(stream => (
                  <div
                    key={stream.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border-default)]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: stream.player.color }}
                      />
                      <span className="text-sm font-medium text-[var(--foreground)]">{stream.player.name}</span>
                      <span className="text-xs text-[var(--text-tertiary)] truncate">{stream.url}</span>
                    </div>
                    <button
                      onClick={() => handleRemove(stream.id)}
                      disabled={loading}
                      className="text-red-400 hover:text-red-300 text-sm font-medium shrink-0 ml-2 disabled:opacity-50"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
