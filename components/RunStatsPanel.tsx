'use client';

/**
 * RunStatsPanel - Zeigt aktuelle Run-Info und historische Statistiken
 */

import { useState, useEffect } from 'react';
import BadgeProgressTracker from './BadgeProgressTracker';

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
  runsLost: number;
}

interface RunStats {
  activeRun: ActiveRun | null;
  totalRuns: number;
  failedRuns: number;
  completedRuns: number;
  aggregatedPlayerStats: PlayerStats[];
}

interface RunStatsPanelProps {
  isAdmin?: boolean;
}

export default function RunStatsPanel({ isAdmin = false }: RunStatsPanelProps) {
  const [stats, setStats] = useState<RunStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('');
  const [pauseLoading, setPauseLoading] = useState(false);
  const [badgeLoading, setBadgeLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/runs/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching run stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const togglePause = async () => {
    if (pauseLoading) return;

    setPauseLoading(true);
    try {
      const res = await fetch('/api/runs/pause', {
        method: 'POST',
      });

      if (res.ok) {
        // Stats neu laden
        await fetchStats();
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
    } finally {
      setPauseLoading(false);
    }
  };

  const handleBadgeClick = async (newCount: number) => {
    if (badgeLoading) return;
    setBadgeLoading(true);
    try {
      const action = newCount > (stats?.activeRun?.badgesEarned ?? 0)
        ? 'increment'
        : 'decrement';
      const res = await fetch('/api/runs/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchStats();
      }
    } catch (error) {
      console.error('Error updating badges:', error);
    } finally {
      setBadgeLoading(false);
    }
  };

  // Timer für vergangene Zeit
  useEffect(() => {
    if (!stats?.activeRun?.startedAt) {
      setElapsedTime('');
      return;
    }

    const updateElapsedTime = () => {
      const startTime = new Date(stats.activeRun!.startedAt).getTime();
      const now = Date.now();
      const totalPausedMs = stats.activeRun!.totalPausedMs || 0;

      let elapsedMs: number;

      if (stats.activeRun!.pausedAt) {
        // Run ist pausiert - zeige Zeit bis zur Pause
        const pauseTime = new Date(stats.activeRun!.pausedAt).getTime();
        elapsedMs = pauseTime - startTime - totalPausedMs;
      } else {
        // Run läuft - zeige aktuelle Zeit minus pausierte Zeit
        elapsedMs = now - startTime - totalPausedMs;
      }

      const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
      const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

      if (hours > 0) {
        setElapsedTime(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setElapsedTime(`${minutes}m ${seconds}s`);
      }
    };

    // Sofort aktualisieren
    updateElapsedTime();

    // Wenn pausiert, nicht weiter aktualisieren
    if (stats.activeRun!.pausedAt) {
      return;
    }

    // Jede Sekunde aktualisieren
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [stats?.activeRun?.startedAt, stats?.activeRun?.pausedAt, stats?.activeRun?.totalPausedMs]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-[var(--background-tertiary)] rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-[var(--background-tertiary)] rounded w-1/2"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { activeRun, totalRuns, failedRuns, aggregatedPlayerStats } = stats;

  // Kein aktiver Run und keine Historie -> nichts anzeigen
  if (!activeRun && totalRuns === 0) {
    return null;
  }

  return (
    <>
      {/* Header mit Run-Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            {activeRun?.gameVersion && (
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm font-medium border border-indigo-500/30">
                {activeRun.gameVersion.name}
              </span>
            )}
            {activeRun && (
              <span className="text-lg font-bold text-[var(--foreground)]">
                Run #{activeRun.runNumber}
              </span>
            )}
          </div>
          {elapsedTime && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-mono text-[var(--text-secondary)]">
                  {elapsedTime}
                </span>
                {stats.activeRun?.pausedAt && (
                  <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full font-medium">
                    Pausiert
                  </span>
                )}
              </div>

              {/* Pause/Play Button - nur für Admins */}
              {isAdmin && (
                <button
                  onClick={togglePause}
                  disabled={pauseLoading}
                  className={`p-1.5 rounded-lg transition-all duration-300 ${
                    pauseLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[var(--background-tertiary)] hover:scale-110'
                  }`}
                  title={stats.activeRun?.pausedAt ? 'Timer fortsetzen' : 'Timer pausieren'}
                >
                  {stats.activeRun?.pausedAt ? (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {failedRuns > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-500 font-medium">
              {failedRuns} Run{failedRuns !== 1 ? 's' : ''} gescheitert
            </span>
          </div>
        )}
      </div>

      {/* Toggle für Statistiken */}
      {aggregatedPlayerStats.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-all duration-300 font-medium"
          >
            <span className="transition-transform duration-300" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            <span>Übergreifende Statistiken {expanded ? 'ausblenden' : 'anzeigen'}</span>
          </button>

          {/* Statistik-Tabelle */}
          {expanded && (
            <div className="mt-4 overflow-x-auto animate-[slide-in-up_0.3s_ease-out]">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    <th className="text-left py-2 px-2 md:px-3 font-semibold text-[var(--text-secondary)]">Spieler</th>
                    <th className="text-center py-2 px-1 md:px-2 font-semibold text-[var(--text-secondary)]">
                      <span title="Pokémon K.O. über alle Runs">K.O.</span>
                    </th>
                    <th className="text-center py-2 px-1 md:px-2 font-semibold text-[var(--text-secondary)]">
                      <span title="Nicht gefangen über alle Runs">N.g.</span>
                    </th>
                    <th className="text-center py-2 px-2 md:px-3 font-semibold text-[var(--text-secondary)]">
                      <span title="Runs gefailed">Gefailed</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedPlayerStats.map((player) => (
                    <tr key={player.playerName} className="border-b border-[var(--border-default)] hover:bg-[var(--background-tertiary)] transition-colors duration-300">
                      <td className="py-2 px-2 md:px-3 font-medium text-[var(--foreground)]">{player.playerName}</td>

                      {/* K.O. */}
                      <td className="py-2 px-1 md:px-2 text-center">
                        <span className={`px-1.5 md:px-2 py-0.5 rounded transition-all duration-300 text-xs font-semibold ${player.totalKnockedOut > 0 ? 'bg-red-500/30 text-red-300 border border-red-500/40' : 'text-[var(--text-tertiary)]'}`}>
                          {player.totalKnockedOut}
                        </span>
                      </td>

                      {/* Nicht gefangen */}
                      <td className="py-2 px-1 md:px-2 text-center">
                        <span className={`px-1.5 md:px-2 py-0.5 rounded transition-all duration-300 text-xs font-semibold ${player.totalNotCaught > 0 ? 'bg-orange-500/30 text-orange-300 border border-orange-500/40' : 'text-[var(--text-tertiary)]'}`}>
                          {player.totalNotCaught}
                        </span>
                      </td>

                      {/* Gefailed */}
                      <td className="py-2 px-2 md:px-3 text-center">
                        <span className={`px-2 py-0.5 rounded transition-all duration-300 ${player.runsLost > 0 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold' : 'text-[var(--text-tertiary)]'}`}>
                          {player.runsLost}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Badge Progress Tracker */}
      {activeRun && (
        <BadgeProgressTracker
          gameVersionKey={activeRun.gameVersion?.key ?? null}
          badgesEarned={activeRun.badgesEarned ?? 0}
          onBadgeClick={isAdmin ? handleBadgeClick : undefined}
        />
      )}
    </>
  );
}
