'use client';

/**
 * StreamsTopBar - Kompakte Leiste mit Timer, nächstem Orden und Run-Stats
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getBadgesForGame, getLevelCapsForGame } from '@/lib/badge-data';

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

interface StreamRef {
  id: number;
  player: { name: string };
}

interface StreamsTopBarProps {
  activeRun: ActiveRun | null;
  currentRunStats: PlayerStats[];
  playerColors: Record<string, string>;
  streams?: StreamRef[];
  hiddenStreamIds?: Set<number>;
  onToggleStream?: (streamId: number) => void;
}

function formatElapsed(ms: number): string {
  if (ms <= 0) return '0m 0s';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function StreamsTopBar({ activeRun, currentRunStats, playerColors, streams, hiddenStreamIds, onToggleStream }: StreamsTopBarProps) {
  const [now, setNow] = useState<number | null>(null);
  const timerRunId = activeRun?.id ?? null;
  const timerPausedAt = activeRun?.pausedAt ?? null;

  // Timer-Logik (analog zu RunStatsPanel)
  useEffect(() => {
    if (timerRunId === null || timerPausedAt) return;

    const updateTimer = () => setNow(Date.now());
    const initialUpdate = setTimeout(updateTimer, 0);
    const interval = setInterval(updateTimer, 1000);

    return () => {
      clearTimeout(initialUpdate);
      clearInterval(interval);
    };
  }, [timerRunId, timerPausedAt]);

  if (!activeRun) return null;

  const startTime = new Date(activeRun.startedAt).getTime();
  const referenceTime = activeRun.pausedAt
    ? new Date(activeRun.pausedAt).getTime()
    : now ?? startTime + (activeRun.totalPausedMs || 0);
  const elapsedTime = formatElapsed(
    Math.max(0, referenceTime - startTime - (activeRun.totalPausedMs || 0)),
  );

  // Badge-Daten
  const badges = activeRun.gameVersion ? getBadgesForGame(activeRun.gameVersion.key) : null;
  const levelCaps = activeRun.gameVersion ? getLevelCapsForGame(activeRun.gameVersion.key) : null;
  const nextBadge = badges?.[activeRun.badgesEarned];
  const nextLevelCap = levelCaps?.[activeRun.badgesEarned];

  return (
    <section aria-label="Aktueller Run" className="app-band app-band--navy no-scrollbar flex w-full shrink-0 items-stretch overflow-x-auto text-sm">
      {/* Timer */}
      <div className="flex shrink-0 items-center gap-2 border-r border-white/20 px-4 py-3">
        <span className="text-[10px] font-black uppercase tracking-wide text-white/60">Laufzeit</span>
        <span className="font-mono font-black tabular-nums text-white">
          {elapsedTime}
        </span>
        {activeRun.pausedAt && (
          <span className="text-xs font-black text-yellow-300">■ PAUSIERT</span>
        )}
      </div>

      {/* Run Info */}
      <div className="flex shrink-0 items-center gap-2 border-r border-white/20 px-4 py-3">
        <span className="font-black text-white">
          Run #{activeRun.runNumber}
        </span>
        {activeRun.gameVersion && (
          <span className="border-l-2 border-red-500 pl-2 text-xs font-bold text-white/70">
            {activeRun.gameVersion.name}
          </span>
        )}
      </div>

      {/* Nächster Orden */}
      {nextBadge ? (
        <div className="flex shrink-0 items-center gap-2 border-r border-white/20 px-4 py-3">
          <Image
            src={nextBadge.imagePath}
            alt={nextBadge.nameDe}
            width={20}
            height={20}
            className="object-contain"
          />
          <span className="font-bold text-white">{nextBadge.nameDe}</span>
          {nextLevelCap && (
            <span className="text-xs text-white/60">
              Lv.{nextLevelCap}
            </span>
          )}
        </div>
      ) : badges && activeRun.badgesEarned >= badges.length ? (
        <div className="flex shrink-0 items-center gap-2 border-r border-white/20 px-4 py-3">
          <span className="font-black text-green-300">✓ Alle Orden</span>
        </div>
      ) : null}

      {/* Stats pro Spieler (klickbar zum Ein-/Ausblenden) */}
      <div className="flex shrink-0 items-stretch">
        {currentRunStats.map(stat => {
          const stream = streams?.find(s => s.player.name === stat.playerName);
          const isHidden = stream ? hiddenStreamIds?.has(stream.id) : false;
          const canToggle = !!(stream && onToggleStream);
          const visibleCount = streams
            ? streams.filter(s => !hiddenStreamIds?.has(s.id)).length
            : 0;
          const isLastVisible = !isHidden && visibleCount <= 1;

          return (
            <button
              key={stat.playerName}
              type="button"
              onClick={() => canToggle && !isLastVisible && onToggleStream!(stream!.id)}
              disabled={!canToggle || (isLastVisible && !isHidden)}
              className={`flex min-h-11 items-center gap-1.5 border-r border-white/20 px-4 py-2 transition-opacity ${
                canToggle && !(isLastVisible && !isHidden)
                  ? 'cursor-pointer hover:bg-white/10'
                  : canToggle
                    ? 'cursor-not-allowed'
                    : ''
              } ${isHidden ? 'opacity-40' : ''}`}
              title={
                !canToggle
                  ? undefined
                  : isLastVisible && !isHidden
                    ? 'Mindestens ein Stream muss sichtbar bleiben'
                    : isHidden
                      ? `${stat.playerName} einblenden`
                      : `${stat.playerName} ausblenden`
              }
            >
              {canToggle && (
                <svg
                  className="w-3 h-3 shrink-0"
                  style={{ color: isHidden ? 'var(--text-tertiary)' : (playerColors[stat.playerName] || 'var(--foreground)') }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  {isHidden ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  ) : (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </>
                  )}
                </svg>
              )}
              <span
                className={`font-medium ${isHidden ? 'line-through' : ''}`}
                style={{ color: playerColors[stat.playerName] || 'var(--foreground)' }}
              >
                {stat.playerName}
              </span>
              {stat.totalKnockedOut > 0 && (
                <span className="text-xs font-black text-red-300">{stat.totalKnockedOut} K.O.</span>
              )}
              {stat.totalNotCaught > 0 && (
                <span className="text-xs font-black text-yellow-300">{stat.totalNotCaught} verpasst</span>
              )}
              {stat.totalKnockedOut === 0 && stat.totalNotCaught === 0 && (
                <span className="text-xs font-black text-green-300">✓ ohne Verlust</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
