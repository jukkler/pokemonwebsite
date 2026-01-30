'use client';

/**
 * Statistik-Seite: Zeigt alle vergangenen Runs mit Details
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface GameVersion {
  key: string;
  name: string;
  generation: number;
}

interface RunEncounter {
  id: number;
  playerName: string;
  pokemonPokedexId: number;
  pokemonName: string;
  pokemonNameGerman: string | null;
  routeName: string;
  isKnockedOut: boolean;
  isNotCaught: boolean;
}

interface PlayerStats {
  playerName: string;
  knockedOutCount: number;
  notCaughtCount: number;
  isLoser: boolean;
}

interface Run {
  id: number;
  runNumber: number;
  status: string;
  loserPlayerName: string | null;
  startedAt: string;
  endedAt: string | null;
  gameVersion: GameVersion | null;
  playerStats: PlayerStats[];
  encounters: RunEncounter[];
}

export default function StatistikPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<number | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const res = await fetch('/api/runs/history');
        if (res.ok) {
          const data = await res.json();
          setRuns(data.runs || []);
        }
      } catch (error) {
        console.error('Error fetching runs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, []);

  const getSpriteUrl = (pokedexId: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexId}.png`;
  };

  const groupEncountersByPlayer = (encounters: RunEncounter[]) => {
    const grouped: Record<string, RunEncounter[]> = {};
    for (const enc of encounters) {
      if (!grouped[enc.playerName]) {
        grouped[enc.playerName] = [];
      }
      grouped[enc.playerName].push(enc);
    }
    return grouped;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Lade Statistiken...</p>
      </div>
    );
  }

  const completedRuns = runs.filter(r => r.status !== 'active');

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
          Run-Statistiken
        </h1>
        <p className="text-gray-600">
          Übersicht aller vergangenen Nuzlocke-Runs
        </p>
      </div>

      {completedRuns.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">
            Noch keine abgeschlossenen Runs vorhanden.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {completedRuns.map((run) => {
            const isExpanded = expandedRun === run.id;
            const encountersByPlayer = groupEncountersByPlayer(run.encounters);
            const totalCaught = run.encounters.filter(e => !e.isNotCaught).length;
            const totalKO = run.encounters.filter(e => e.isKnockedOut).length;
            const totalNotCaught = run.encounters.filter(e => e.isNotCaught).length;

            return (
              <div
                key={run.id}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
              >
                {/* Run Header */}
                <button
                  onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                  className="w-full p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      run.status === 'failed' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      Run #{run.runNumber}
                    </span>
                    {run.gameVersion && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                        {run.gameVersion.name}
                      </span>
                    )}
                    {run.status === 'failed' && run.loserPlayerName && (
                      <span className="text-sm text-gray-600">
                        Verloren von <strong>{run.loserPlayerName}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span title="Gefangen">🎯 {totalCaught}</span>
                    <span title="K.O.">💀 {totalKO}</span>
                    <span title="Nicht gefangen">❌ {totalNotCaught}</span>
                    <span>
                      {run.endedAt 
                        ? new Date(run.endedAt).toLocaleDateString('de-DE')
                        : '-'
                      }
                    </span>
                    <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 md:p-5 bg-gray-50">
                    {Object.keys(encountersByPlayer).length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Keine Pokemon-Daten für diesen Run gespeichert.
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(encountersByPlayer).map(([playerName, encounters]) => {
                          const playerStats = run.playerStats.find(s => s.playerName === playerName);
                          const caught = encounters.filter(e => !e.isNotCaught);
                          const ko = encounters.filter(e => e.isKnockedOut);
                          const notCaught = encounters.filter(e => e.isNotCaught);

                          return (
                            <div key={playerName} className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-lg font-bold ${
                                  playerStats?.isLoser ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {playerName}
                                  {playerStats?.isLoser && (
                                    <span className="ml-2 text-sm font-normal text-red-500">
                                      (Verlierer)
                                    </span>
                                  )}
                                </h3>
                                <div className="flex gap-3 text-sm">
                                  <span className="text-green-600">🎯 {caught.length}</span>
                                  <span className="text-red-600">💀 {ko.length}</span>
                                  <span className="text-orange-600">❌ {notCaught.length}</span>
                                </div>
                              </div>

                              {/* Pokemon Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {encounters.map((enc) => (
                                  <div
                                    key={enc.id}
                                    className={`relative p-2 rounded-lg border text-center ${
                                      enc.isNotCaught
                                        ? 'bg-orange-50 border-orange-200'
                                        : enc.isKnockedOut
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-green-50 border-green-200'
                                    }`}
                                  >
                                    <div className="relative w-12 h-12 mx-auto">
                                      <Image
                                        src={getSpriteUrl(enc.pokemonPokedexId)}
                                        alt={enc.pokemonNameGerman || enc.pokemonName}
                                        fill
                                        className={`object-contain ${
                                          enc.isKnockedOut || enc.isNotCaught ? 'grayscale opacity-50' : ''
                                        }`}
                                        unoptimized
                                      />
                                    </div>
                                    <p className="text-xs font-medium truncate mt-1">
                                      {enc.pokemonNameGerman || enc.pokemonName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {enc.routeName}
                                    </p>
                                    {enc.isKnockedOut && (
                                      <span className="absolute top-1 right-1 text-xs">💀</span>
                                    )}
                                    {enc.isNotCaught && (
                                      <span className="absolute top-1 right-1 text-xs">❌</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
