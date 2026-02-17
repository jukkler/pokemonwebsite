'use client';

/**
 * Statistik-Seite: Zeigt alle vergangenen Runs mit Details
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BentoGrid, BentoCard, BentoKPICard } from '@/components/layout/BentoGrid';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';

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
  totalPausedMs: number;
  pausedAt: string | null;
  gameVersion: GameVersion | null;
  playerStats: PlayerStats[];
  encounters: RunEncounter[];
}

interface MostCaughtPokemon {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  count: number;
  spriteUrl: string | null;
}

interface LongestTeamMember {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  playerName: string;
  routeName: string;
  nickname: string | null;
  daysInTeam: number;
  isActive: boolean;
  spriteUrl: string | null;
}

interface Analytics {
  mostCaught: MostCaughtPokemon[];
  longestTeamMembers: LongestTeamMember[];
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0m 0s';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function calculateRunDuration(run: Run): number {
  const start = new Date(run.startedAt).getTime();
  const paused = run.totalPausedMs || 0;
  if (run.endedAt) {
    return new Date(run.endedAt).getTime() - start - paused;
  }
  if (run.pausedAt) {
    return new Date(run.pausedAt).getTime() - start - paused;
  }
  return Date.now() - start - paused;
}

export default function StatistikPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [archivedRuns, setArchivedRuns] = useState<Run[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [totalTimeDisplay, setTotalTimeDisplay] = useState('');
  const { spriteMode } = useSpriteMode();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [runsRes, analyticsRes] = await Promise.all([
          fetch('/api/runs/history'),
          fetch('/api/runs/analytics'),
        ]);

        if (runsRes.ok) {
          const data = await runsRes.json();
          setRuns(data.runs || []);
          setArchivedRuns(data.archivedRuns || []);
        }

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Live-Ticker für Gesamtzeit (aktualisiert jede Sekunde falls aktiver Run läuft)
  useEffect(() => {
    if (runs.length === 0) {
      setTotalTimeDisplay('');
      return;
    }

    const updateTotalTime = () => {
      const totalMs = runs.reduce((sum, run) => sum + calculateRunDuration(run), 0);
      setTotalTimeDisplay(formatDuration(totalMs));
    };

    updateTotalTime();

    // Prüfe ob ein aktiver, nicht-pausierter Run existiert → live ticken
    const hasActiveRunning = runs.some(r => r.status === 'active' && !r.pausedAt);
    if (!hasActiveRunning) return;

    const interval = setInterval(updateTotalTime, 1000);
    return () => clearInterval(interval);
  }, [runs]);

  const getSpriteUrl = (pokedexId: number) => {
    if (spriteMode === 'animated') {
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokedexId}.gif`;
    }
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexId}.png`;
  };

  // Helper: Gibt Sprite-URL basierend auf Sprite-Modus zurück
  const getAdaptiveSpriteUrl = (staticUrl: string | null, pokedexId: number) => {
    if (spriteMode === 'animated') {
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokedexId}.gif`;
    }
    return staticUrl || getSpriteUrl(pokedexId);
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
  const failedRuns = completedRuns.filter(r => r.status === 'failed');
  const completedSuccessRuns = completedRuns.filter(r => r.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--foreground)] mb-2">
          Run-Statistiken
        </h1>
        <p className="text-[var(--text-secondary)]">
          Übersicht aller vergangenen Nuzlocke-Runs
        </p>
      </div>

      {completedRuns.length === 0 && archivedRuns.length === 0 && (
        <BentoCard>
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="w-16 h-16 text-[var(--text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-[var(--text-secondary)] text-lg">
              Noch keine abgeschlossenen Runs vorhanden.
            </p>
          </div>
        </BentoCard>
      )}

      {completedRuns.length > 0 && (
        <>
          {/* KPI Cards - eigenes 4-Spalten-Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
            <BentoKPICard
              label="Total Runs"
              value={completedRuns.length}
              icon="🎯"
              className="animate-[scale-in_0.3s_ease-out]"
            />
            <BentoKPICard
              label="Abgeschlossen"
              value={completedSuccessRuns.length}
              icon="✅"
              className="animate-[scale-in_0.3s_ease-out] stagger-1"
            />
            <BentoKPICard
              label="Gescheitert"
              value={failedRuns.length}
              icon="💀"
              className="animate-[scale-in_0.3s_ease-out] stagger-2"
            />
            {totalTimeDisplay && (
              <BentoKPICard
                label="Gesamtzeit"
                value={totalTimeDisplay}
                icon="⏱️"
                className="animate-[scale-in_0.3s_ease-out] stagger-3"
              />
            )}
          </div>

        <BentoGrid>
          {/* Häufigste Pokémon (run-übergreifend) */}
          {analytics && analytics.mostCaught.length > 0 && (
            <BentoCard
              span={{ sm: 1, md: 3, lg: 3 }}
              className="animate-[scale-in_0.3s_ease-out] stagger-3"
            >
              <h2 className="text-xl font-bold mb-4 text-[var(--foreground)] flex items-center gap-2">
                <span>🎯</span> Häufigste Pokémon (Run-Übergreifend)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
                {analytics.mostCaught.map((pokemon, index) => (
                  <div
                    key={pokemon.pokedexId}
                    className="bg-[var(--card-bg-elevated)] rounded-lg p-3 border border-[var(--border-default)] hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-16 h-16">
                        <Image
                          src={getAdaptiveSpriteUrl(pokemon.spriteUrl, pokemon.pokedexId)}
                          alt={pokemon.nameGerman || pokemon.name}
                          fill
                          className="object-contain pixelated"
                          unoptimized
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-[var(--foreground)] truncate max-w-full">
                          {pokemon.nameGerman || pokemon.name}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-lg font-bold text-indigo-400">{pokemon.count}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">x</span>
                        </div>
                        {index < 3 && (
                          <div className="text-xs mt-1">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>
          )}

          {/* Längste Team-Mitglieder */}
          {analytics && analytics.longestTeamMembers.length > 0 && (
            <BentoCard
              span={{ sm: 1, md: 3, lg: 3 }}
              className="animate-[scale-in_0.3s_ease-out] stagger-4"
            >
              <h2 className="text-xl font-bold mb-4 text-[var(--foreground)] flex items-center gap-2">
                <span>⏳</span> Längste Team-Mitglieder (Aktueller Run)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.longestTeamMembers.map((member) => (
                  <div
                    key={`${member.pokedexId}-${member.playerName}-${member.routeName}`}
                    className={`bg-[var(--card-bg-elevated)] rounded-lg p-3 border transition-all duration-300 hover:scale-105 ${
                      member.isActive
                        ? 'border-green-500/30 hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                        : 'border-red-500/30 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] grayscale'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={getAdaptiveSpriteUrl(member.spriteUrl, member.pokedexId)}
                          alt={member.nameGerman || member.name}
                          fill
                          className="object-contain pixelated"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--foreground)] truncate">
                          {member.nameGerman || member.name}
                        </p>
                        {member.nickname && (
                          <p className="text-xs text-[var(--text-secondary)] italic truncate">
                            &quot;{member.nickname}&quot;
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-secondary)]">
                          <span>{member.playerName}</span>
                          <span>•</span>
                          <span className="truncate">{member.routeName}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`text-sm font-bold ${member.isActive ? 'text-green-400' : 'text-red-400'}`}>
                            {member.daysInTeam} Tag{member.daysInTeam !== 1 ? 'e' : ''}
                          </span>
                          {!member.isActive && <span className="text-xs">💀</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>
          )}

          {/* Run History (volle Breite) */}
          <BentoCard
            span={{ sm: 1, md: 3, lg: 3 }}
            className="animate-[scale-in_0.3s_ease-out] stagger-3"
          >
            <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Run History</h2>
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
                    className="bg-[var(--card-bg-elevated)] rounded-xl border border-[var(--border-default)] overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--player-color-rgb),0.15)]"
                  >
                    {/* Run Header */}
                    <button
                      onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                      className="w-full p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-[var(--background-tertiary)] transition-all duration-300 text-left"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                          run.status === 'failed'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}>
                          Run #{run.runNumber}
                        </span>
                        {run.gameVersion && (
                          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm border border-indigo-500/30">
                            {run.gameVersion.name}
                          </span>
                        )}
                        {run.status === 'failed' && run.loserPlayerName && (
                          <span className="text-sm text-[var(--text-secondary)]">
                            Verloren von <strong className="text-[var(--foreground)]">{run.loserPlayerName}</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                        <span title="Gefangen">🎯 {totalCaught}</span>
                        <span title="K.O.">💀 {totalKO}</span>
                        <span title="Nicht gefangen">❌ {totalNotCaught}</span>
                        <span title="Dauer">⏱️ {formatDuration(calculateRunDuration(run))}</span>
                        <span>
                          {run.endedAt
                            ? new Date(run.endedAt).toLocaleDateString('de-DE')
                            : '-'
                          }
                        </span>
                        <span className="text-lg transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-[var(--border-default)] p-4 md:p-5 bg-[var(--background-secondary)] animate-[slide-in-up_0.3s_ease-out]">
                        {Object.keys(encountersByPlayer).length === 0 ? (
                          <p className="text-[var(--text-secondary)] text-center py-4">
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
                                <div key={playerName} className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-default)]">
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className={`text-lg font-bold ${
                                      playerStats?.isLoser ? 'text-red-400' : 'text-[var(--foreground)]'
                                    }`}>
                                      {playerName}
                                      {playerStats?.isLoser && (
                                        <span className="ml-2 text-sm font-normal text-red-500">
                                          (Verlierer)
                                        </span>
                                      )}
                                    </h3>
                                    <div className="flex gap-3 text-sm">
                                      <span className="text-green-400">🎯 {caught.length}</span>
                                      <span className="text-red-400">💀 {ko.length}</span>
                                      <span className="text-orange-400">❌ {notCaught.length}</span>
                                    </div>
                                  </div>

                                  {/* Pokemon Grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                    {encounters.map((enc) => (
                                      <div
                                        key={enc.id}
                                        className={`relative p-2 rounded-lg border text-center transition-all duration-300 hover:scale-105 ${
                                          enc.isNotCaught
                                            ? 'bg-orange-500/10 border-orange-500/30'
                                            : enc.isKnockedOut
                                            ? 'bg-red-500/10 border-red-500/30'
                                            : 'bg-green-500/10 border-green-500/30'
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
                                        <p className="text-xs font-medium truncate mt-1 text-[var(--foreground)]">
                                          {enc.pokemonNameGerman || enc.pokemonName}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)] truncate">
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
          </BentoCard>
        </BentoGrid>
        </>
      )}

      {/* Archiv */}
      {archivedRuns.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowArchive(!showArchive)}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors duration-300 font-medium mb-4"
              >
                <span className="transition-transform duration-300" style={{ transform: showArchive ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                <span>Archiv ({archivedRuns.length} Run{archivedRuns.length !== 1 ? 's' : ''})</span>
              </button>

              {showArchive && (
                <div className="space-y-6 animate-[slide-in-up_0.3s_ease-out]">
                  {/* Gruppiere archivierte Runs nach Game-Version */}
                  {Object.entries(
                    archivedRuns.reduce<Record<string, Run[]>>((groups, run) => {
                      const key = run.gameVersion?.name || 'Unbekannt';
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(run);
                      return groups;
                    }, {})
                  ).map(([versionName, versionRuns]) => (
                    <BentoCard key={versionName}>
                      <h3 className="text-lg font-bold mb-4 text-[var(--foreground)] flex items-center gap-2">
                        <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm border border-indigo-500/30">
                          {versionName}
                        </span>
                        <span className="text-sm font-normal text-[var(--text-secondary)]">
                          {versionRuns.length} Run{versionRuns.length !== 1 ? 's' : ''}
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {versionRuns.map((run) => {
                          const isExpanded = expandedRun === run.id;
                          const encountersByPlayer = groupEncountersByPlayer(run.encounters);
                          const totalCaught = run.encounters.filter(e => !e.isNotCaught).length;
                          const totalKO = run.encounters.filter(e => e.isKnockedOut).length;
                          const totalNotCaught = run.encounters.filter(e => e.isNotCaught).length;

                          return (
                            <div
                              key={run.id}
                              className="bg-[var(--card-bg-elevated)] rounded-xl border border-[var(--border-default)] overflow-hidden transition-all duration-300 opacity-70 hover:opacity-100"
                            >
                              <button
                                onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                                className="w-full p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-[var(--background-tertiary)] transition-all duration-300 text-left"
                              >
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                                    run.status === 'failed'
                                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                      : 'bg-green-500/20 text-green-400 border-green-500/30'
                                  }`}>
                                    Run #{run.runNumber}
                                  </span>
                                  {run.status === 'failed' && run.loserPlayerName && (
                                    <span className="text-sm text-[var(--text-secondary)]">
                                      Verloren von <strong className="text-[var(--foreground)]">{run.loserPlayerName}</strong>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                                  <span title="Gefangen">🎯 {totalCaught}</span>
                                  <span title="K.O.">💀 {totalKO}</span>
                                  <span title="Nicht gefangen">❌ {totalNotCaught}</span>
                                  <span title="Dauer">⏱️ {formatDuration(calculateRunDuration(run))}</span>
                                  <span>
                                    {run.endedAt
                                      ? new Date(run.endedAt).toLocaleDateString('de-DE')
                                      : '-'
                                    }
                                  </span>
                                  <span className="text-lg transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="border-t border-[var(--border-default)] p-4 bg-[var(--background-secondary)] animate-[slide-in-up_0.3s_ease-out]">
                                  {Object.keys(encountersByPlayer).length === 0 ? (
                                    <p className="text-[var(--text-secondary)] text-center py-4">
                                      Keine Pokemon-Daten für diesen Run gespeichert.
                                    </p>
                                  ) : (
                                    <div className="space-y-6">
                                      {Object.entries(encountersByPlayer).map(([playerName, encounters]) => {
                                        const playerStats = run.playerStats.find(s => s.playerName === playerName);
                                        const caught = encounters.filter(e => !e.isNotCaught);
                                        const ko = encounters.filter(e => e.isKnockedOut);
                                        const nc = encounters.filter(e => e.isNotCaught);

                                        return (
                                          <div key={playerName} className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-default)]">
                                            <div className="flex items-center justify-between mb-3">
                                              <h3 className={`text-lg font-bold ${
                                                playerStats?.isLoser ? 'text-red-400' : 'text-[var(--foreground)]'
                                              }`}>
                                                {playerName}
                                                {playerStats?.isLoser && (
                                                  <span className="ml-2 text-sm font-normal text-red-500">(Verlierer)</span>
                                                )}
                                              </h3>
                                              <div className="flex gap-3 text-sm">
                                                <span className="text-green-400">🎯 {caught.length}</span>
                                                <span className="text-red-400">💀 {ko.length}</span>
                                                <span className="text-orange-400">❌ {nc.length}</span>
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                              {encounters.map((enc) => (
                                                <div
                                                  key={enc.id}
                                                  className={`relative p-2 rounded-lg border text-center transition-all duration-300 hover:scale-105 ${
                                                    enc.isNotCaught
                                                      ? 'bg-orange-500/10 border-orange-500/30'
                                                      : enc.isKnockedOut
                                                      ? 'bg-red-500/10 border-red-500/30'
                                                      : 'bg-green-500/10 border-green-500/30'
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
                                                  <p className="text-xs font-medium truncate mt-1 text-[var(--foreground)]">
                                                    {enc.pokemonNameGerman || enc.pokemonName}
                                                  </p>
                                                  <p className="text-xs text-[var(--text-secondary)] truncate">
                                                    {enc.routeName}
                                                  </p>
                                                  {enc.isKnockedOut && <span className="absolute top-1 right-1 text-xs">💀</span>}
                                                  {enc.isNotCaught && <span className="absolute top-1 right-1 text-xs">❌</span>}
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
                    </BentoCard>
                  ))}
                </div>
              )}
            </div>
          )}
    </div>
  );
}
