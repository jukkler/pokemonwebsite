'use client';

/**
 * BadgeProgressTracker - Vertikaler Skill-Tree für Gym-Orden-Fortschritt
 */

import Image from 'next/image';
import { getBadgesForGame, getLevelCapsForGame } from '@/lib/badge-data';

interface BadgeProgressTrackerProps {
  gameVersionKey: string | null;
  badgesEarned: number;
  onBadgeClick?: (newCount: number) => void;
}

export default function BadgeProgressTracker({
  gameVersionKey,
  badgesEarned,
  onBadgeClick,
}: BadgeProgressTrackerProps) {
  const badges = gameVersionKey ? getBadgesForGame(gameVersionKey) : null;
  const levelCaps = gameVersionKey ? getLevelCapsForGame(gameVersionKey) : null;

  if (!badges) return null;

  return (
    <div className="mt-3 mb-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] mb-3 font-medium uppercase tracking-wide">
        <span>Orden</span>
        <span className="ml-auto font-mono text-[var(--text-secondary)]">
          {badgesEarned}/{badges.length}
        </span>
      </div>

      {/* Vertikaler Skill-Tree */}
      <div className="flex flex-col">
        {badges.map((badge, index) => {
          const isEarned = index < badgesEarned;
          const isNext = index === badgesEarned;
          const isLastEarned = isEarned && index === badgesEarned - 1;
          const isLast = index === badges.length - 1;
          const cap = levelCaps?.[index];
          const isClickable = onBadgeClick && (isNext || isLastEarned);

          return (
            <div key={`${badge.key}-${index}`} className="flex items-stretch">
              {/* Linke Spalte: Linie + Node */}
              <div className="flex flex-col items-center w-9 shrink-0">
                {/* Node (Kreis-Punkt auf der Linie) */}
                <button
                  onClick={() => {
                    if (!onBadgeClick) return;
                    if (isNext) onBadgeClick(badgesEarned + 1);
                    else if (isLastEarned) onBadgeClick(badgesEarned - 1);
                  }}
                  className={`relative z-10 w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all duration-300 ${
                    isEarned
                      ? 'bg-amber-400 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : isNext
                        ? 'bg-transparent border-[var(--text-secondary)] hover:border-amber-400/60 hover:shadow-[0_0_6px_rgba(251,191,36,0.3)]'
                        : 'bg-transparent border-[var(--border-default)]'
                  } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                  aria-label={isNext ? 'Orden erhalten' : isLastEarned ? 'Orden zurücknehmen' : undefined}
                />
                {/* Verbindungslinie nach unten */}
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[14px] transition-colors duration-300 ${
                      isEarned && !isLastEarned
                        ? 'bg-amber-400/50'
                        : isEarned || isNext
                          ? 'bg-gradient-to-b from-amber-400/40 to-[var(--border-default)]'
                          : 'bg-[var(--border-default)]'
                    }`}
                  />
                )}
              </div>

              {/* Rechte Spalte: Badge-Icon + Info */}
              <button
                onClick={() => {
                  if (!onBadgeClick) return;
                  if (isNext) onBadgeClick(badgesEarned + 1);
                  else if (isLastEarned) onBadgeClick(badgesEarned - 1);
                }}
                className={`flex items-center gap-3 flex-1 pb-3.5 -mt-0.5 transition-all duration-300 ${
                  isClickable
                    ? 'cursor-pointer hover:translate-x-0.5'
                    : 'cursor-default'
                }`}
                title={`${badge.nameDe} (${badge.leaderDe})${cap ? ` – Lv ${cap}` : ''}${
                  isEarned ? ' ✓' : isNext ? ' – Klicken zum Erhalten' : ''
                }`}
              >
                {/* Badge-Bild */}
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 relative shrink-0 transition-all duration-300 ${
                    isEarned
                      ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                      : isNext
                        ? 'grayscale brightness-75 opacity-60 hover:grayscale-[50%] hover:opacity-80'
                        : 'grayscale brightness-50 opacity-25'
                  }`}
                >
                  <Image
                    src={badge.imagePath}
                    alt={badge.nameDe}
                    width={40}
                    height={40}
                    className="object-contain w-full h-full"
                  />
                </div>

                {/* Name + Level Cap */}
                <div className="flex items-baseline justify-between flex-1 min-w-0 gap-2">
                  <span
                    className={`text-sm font-medium transition-colors duration-300 truncate ${
                      isEarned
                        ? 'text-[var(--foreground)]'
                        : isNext
                          ? 'text-[var(--text-secondary)]'
                          : 'text-[var(--text-tertiary)] opacity-50'
                    }`}
                  >
                    {badge.nameDe}
                  </span>
                  {cap != null && (
                    <span
                      className={`text-xs font-mono shrink-0 transition-colors duration-300 ${
                        isEarned
                          ? 'text-amber-400/80'
                          : isNext
                            ? 'text-[var(--text-tertiary)]'
                            : 'text-[var(--text-tertiary)] opacity-40'
                      }`}
                    >
                      Lv {cap}
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
