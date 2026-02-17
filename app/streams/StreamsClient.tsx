'use client';

/**
 * StreamsClient - Hauptseite für YouTube-Stream-Einbettung
 * Zeigt Streams im Auto-Layout mit Topbar, Team-Overlays und Admin-Panel
 */

import { useState, useEffect, useCallback } from 'react';
import StreamsTopBar from '@/components/streams/StreamsTopBar';
import StreamGrid from '@/components/streams/StreamGrid';
import StreamAdminPanel from '@/components/streams/StreamAdminPanel';
import { fetchJson } from '@/lib/fetchJson';

interface GameVersion {
  key: string;
  name: string;
  generation: number;
}

interface ActiveRun {
  id: number;
  runNumber: number;
  gameVersion: GameVersion | null;
  startedAt: string;
  pausedAt: string | null;
  totalPausedMs: number;
  badgesEarned: number;
}

interface PlayerStats {
  playerName: string;
  totalKnockedOut: number;
  totalNotCaught: number;
}

interface TeamPokemon {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  spriteUrl: string | null;
  spriteGifUrl: string | null;
}

interface TeamEncounter {
  teamSlot: number | null;
  pokemon: TeamPokemon;
}

interface StreamPlayer {
  id: number;
  name: string;
  color: string;
  encounters: TeamEncounter[];
}

interface StreamData {
  id: number;
  url: string;
  sortOrder: number;
  player: StreamPlayer;
}

interface StreamsResponse {
  streams: StreamData[];
  activeRun: ActiveRun | null;
  currentRunStats: PlayerStats[];
}

interface PlayerOption {
  id: number;
  name: string;
}

const HIDDEN_STREAMS_KEY = 'hidden-stream-ids';

export default function StreamsClient() {
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [currentRunStats, setCurrentRunStats] = useState<PlayerStats[]>([]);
  const [playerColors, setPlayerColors] = useState<Record<string, string>>({});
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Individuelle Stream-Sichtbarkeit pro Spectator (localStorage)
  const [hiddenStreamIds, setHiddenStreamIds] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(HIDDEN_STREAMS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {}
    return new Set();
  });

  const fetchStreams = useCallback(async () => {
    try {
      const data = await fetchJson<StreamsResponse>('/api/streams');
      setStreams(data.streams);
      setActiveRun(data.activeRun);
      setCurrentRunStats(data.currentRunStats);

      // Player-Colors aus Stream-Daten extrahieren
      const colors: Record<string, string> = {};
      for (const stream of data.streams) {
        colors[stream.player.name] = stream.player.color;
      }
      // Auch aus Stats (falls Spieler keinen Stream hat)
      for (const stat of data.currentRunStats) {
        if (!colors[stat.playerName]) {
          colors[stat.playerName] = 'var(--foreground)';
        }
      }
      setPlayerColors(colors);
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth-Check und initiale Daten
  useEffect(() => {
    fetchJson<{ isAdmin?: boolean }>('/api/auth/status')
      .then(data => {
        setIsAdmin(data.isAdmin || false);
        if (data.isAdmin) {
          // Player-Liste für Admin-Panel laden
          fetchJson<{ id: number; name: string }[]>('/api/admin/players')
            .then(res => setPlayers(Array.isArray(res) ? res : []))
            .catch(() => {});
        }
      })
      .catch(() => setIsAdmin(false));

    fetchStreams();
  }, [fetchStreams]);

  // Polling für Team-Updates
  useEffect(() => {
    const interval = setInterval(fetchStreams, 30_000);
    return () => clearInterval(interval);
  }, [fetchStreams]);

  // localStorage-Sync für hiddenStreamIds
  useEffect(() => {
    localStorage.setItem(HIDDEN_STREAMS_KEY, JSON.stringify([...hiddenStreamIds]));
  }, [hiddenStreamIds]);

  // Veraltete IDs aufräumen wenn Streams sich ändern
  useEffect(() => {
    if (streams.length === 0) return;
    setHiddenStreamIds(prev => {
      const validIds = new Set(streams.map(s => s.id));
      const cleaned = new Set([...prev].filter(id => validIds.has(id)));
      if (cleaned.size !== prev.size) return cleaned;
      return prev;
    });
  }, [streams]);

  const toggleStreamVisibility = useCallback((streamId: number) => {
    setHiddenStreamIds(prev => {
      const next = new Set(prev);
      if (next.has(streamId)) {
        next.delete(streamId);
      } else {
        // Mindestens 1 Stream muss sichtbar bleiben
        const visibleCount = streams.filter(s => !next.has(s.id)).length;
        if (visibleCount <= 1) return prev;
        next.add(streamId);
      }
      return next;
    });
  }, [streams]);

  const visibleStreams = streams.filter(s => !hiddenStreamIds.has(s.id));

  const handleAddStream = async (url: string, playerId: number) => {
    await fetchJson('/api/admin/streams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, playerId }),
    });
    await fetchStreams();
  };

  const handleRemoveStream = async (streamId: number) => {
    await fetchJson(`/api/admin/streams/${streamId}`, {
      method: 'DELETE',
    });
    await fetchStreams();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-[var(--text-secondary)]">Lade Streams...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <StreamsTopBar
        activeRun={activeRun}
        currentRunStats={currentRunStats}
        playerColors={playerColors}
        streams={streams}
        hiddenStreamIds={hiddenStreamIds}
        onToggleStream={toggleStreamVisibility}
      />

      {/* Stream Grid */}
      <StreamGrid streams={visibleStreams} />

      {/* Admin Panel */}
      {isAdmin && (
        <StreamAdminPanel
          streams={streams}
          players={players}
          onAdd={handleAddStream}
          onRemove={handleRemoveStream}
        />
      )}
    </div>
  );
}
