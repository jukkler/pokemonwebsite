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
  const [elapsedTime, setElapsedTime] = useState('');

  // Timer-Logik (analog zu RunStatsPanel)
  useEffect(() => {
    if (!activeRun) {
      setElapsedTime('');
      return;
    }

    const updateTimer = () => {
      const startTime = new Date(activeRun.startedAt).getTime();
      const totalPausedMs = activeRun.totalPausedMs || 0;

      let elapsedMs: number;
      if (activeRun.pausedAt) {
        const pauseTime = new Date(activeRun.pausedAt).getTime();
        elapsedMs = pauseTime - startTime - totalPausedMs;
      } else {
        elapsedMs = Date.now() - startTime - totalPausedMs;
      }

      setElapsedTime(formatElapsed(Math.max(0, elapsedMs)));
    };

    updateTimer();

    if (!activeRun.pausedAt) {
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [activeRun]);

  if (!activeRun) return null;

  // Badge-Daten
  const badges = activeRun.gameVersion ? getBadgesForGame(activeRun.gameVersion.key) : null;
  const levelCaps = activeRun.gameVersion ? getLevelCapsForGame(activeRun.gameVersion.key) : null;
  const nextBadge = badges?.[activeRun.badgesEarned];
  const nextLevelCap = levelCaps?.[activeRun.badgesEarned];

  return (
    <div className="w-full bg-[var(--card-bg)]/90 backdrop-blur-sm border-b border-[var(--border-default)] px-4 py-2 flex items-center justify-center gap-6 text-sm overflow-x-auto shrink-0">
      {/* Timer */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[var(--text-tertiary)]">⏱</span>
        <span className="font-mono font-bold text-[var(--foreground)]">
          {elapsedTime || '0m 0s'}
        </span>
        {activeRun.pausedAt && (
          <span className="text-xs text-yellow-500 font-medium">PAUSIERT</span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[var(--border-default)] shrink-0" />

      {/* Run Info */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[var(--text-secondary)]">
          Run #{activeRun.runNumber}
        </span>
        {activeRun.gameVersion && (
          <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
            {activeRun.gameVersion.name}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[var(--border-default)] shrink-0" />

      {/* Nächster Orden */}
      {nextBadge ? (
        <div className="flex items-center gap-2 shrink-0">
          <Image
            src={nextBadge.imagePath}
            alt={nextBadge.nameDe}
            width={20}
            height={20}
            className="object-contain"
          />
          <span className="text-[var(--foreground)] font-medium">{nextBadge.nameDe}</span>
          {nextLevelCap && (
            <span className="text-xs text-[var(--text-tertiary)]">
              Lv.{nextLevelCap}
            </span>
          )}
        </div>
      ) : badges && activeRun.badgesEarned >= badges.length ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-green-400 font-medium">Alle Orden!</span>
        </div>
      ) : null}

      {/* Divider */}
      <div className="w-px h-5 bg-[var(--border-default)] shrink-0" />

      {/* Stats pro Spieler (klickbar zum Ein-/Ausblenden) */}
      <div className="flex items-center gap-4 shrink-0">
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
              className={`flex items-center gap-1.5 transition-all duration-200 rounded px-1.5 py-0.5 ${
                canToggle && !(isLastVisible && !isHidden)
                  ? 'cursor-pointer hover:bg-[var(--background-secondary)]'
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
                <span className="text-red-400 text-xs">{stat.totalKnockedOut}💀</span>
              )}
              {stat.totalNotCaught > 0 && (
                <span className="text-yellow-400 text-xs">{stat.totalNotCaught}❌</span>
              )}
              {stat.totalKnockedOut === 0 && stat.totalNotCaught === 0 && (
                <span className="text-green-400 text-xs">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
