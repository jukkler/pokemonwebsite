'use client';

/**
 * RunStatsPanel - Zeigt aktuelle Run-Info und historische Statistiken
 */

import { useState, useEffect } from 'react';

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
  currentRunStats: PlayerStats[];
}

export default function RunStatsPanel() {
  const [stats, setStats] = useState<RunStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
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

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 md:p-5 border border-gray-200 mb-6 md:mb-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { activeRun, totalRuns, failedRuns, aggregatedPlayerStats, currentRunStats } = stats;

  // Kombiniere historische und aktuelle Statistiken
  const combinedStats = aggregatedPlayerStats.map(historical => {
    const current = currentRunStats.find(c => c.playerName === historical.playerName);
    return {
      playerName: historical.playerName,
      totalKnockedOut: historical.totalKnockedOut + (current?.totalKnockedOut || 0),
      totalNotCaught: historical.totalNotCaught + (current?.totalNotCaught || 0),
      runsLost: historical.runsLost,
    };
  });

  // Füge Spieler hinzu, die nur im aktuellen Run sind
  currentRunStats.forEach(current => {
    if (!combinedStats.find(c => c.playerName === current.playerName)) {
      combinedStats.push({
        playerName: current.playerName,
        totalKnockedOut: current.totalKnockedOut,
        totalNotCaught: current.totalNotCaught,
        runsLost: 0,
      });
    }
  });

  // Kein aktiver Run und keine Historie -> nichts anzeigen
  if (!activeRun && totalRuns === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-md p-4 md:p-5 border border-indigo-200 mb-6 md:mb-8">
      {/* Header mit Run-Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {activeRun?.gameVersion && (
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              {activeRun.gameVersion.name}
            </span>
          )}
          {activeRun && (
            <span className="text-lg font-bold text-gray-800">
              Run #{activeRun.runNumber}
            </span>
          )}
        </div>
        
        {failedRuns > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-600 font-medium">
              {failedRuns} Run{failedRuns !== 1 ? 's' : ''} gescheitert
            </span>
          </div>
        )}
      </div>

      {/* Toggle für Statistiken */}
      {combinedStats.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 transition font-medium"
          >
            <span>{expanded ? '▼' : '▶'}</span>
            <span>Spieler-Statistiken {expanded ? 'ausblenden' : 'anzeigen'}</span>
          </button>

          {/* Statistik-Tabelle */}
          {expanded && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-indigo-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Spieler</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">
                      <span title="Pokémon K.O. gegangen">K.O.</span>
                    </th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">
                      <span title="Pokémon nicht gefangen">Nicht gef.</span>
                    </th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">
                      <span title="Runs gefailed">Gefailed</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {combinedStats.map((player) => (
                    <tr key={player.playerName} className="border-b border-indigo-100 hover:bg-indigo-50/50">
                      <td className="py-2 px-3 font-medium text-gray-800">{player.playerName}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded ${player.totalKnockedOut > 0 ? 'bg-red-100 text-red-700' : 'text-gray-400'}`}>
                          {player.totalKnockedOut}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded ${player.totalNotCaught > 0 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}>
                          {player.totalNotCaught}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded ${player.runsLost > 0 ? 'bg-purple-100 text-purple-700 font-bold' : 'text-gray-400'}`}>
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
    </div>
  );
}
