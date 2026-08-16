'use client';

/** Horizontaler Ordenfortschritt im Team-Sheet-Stil. */

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
    <div className="app-band mt-3 bg-[var(--brand-navy)] px-4 py-3 text-white">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-black uppercase tracking-wide">Ordenfortschritt {badgesEarned}/{badges.length}</span>
        <span className="text-xs font-black uppercase tracking-widest text-[var(--brand-gold)]">
          {badgesEarned === badges.length ? 'Alle Orden erhalten' : 'Nächster Orden offen'}
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="relative flex min-w-max items-start gap-3 px-1 pt-1">
          <div aria-hidden="true" className="absolute left-6 right-6 top-6 h-0.5 bg-[var(--brand-gold)]/70" />
          {badges.map((badge, index) => {
          const isEarned = index < badgesEarned;
          const isNext = index === badgesEarned;
          const isLastEarned = isEarned && index === badgesEarned - 1;
          const cap = levelCaps?.[index];
          const isClickable = onBadgeClick && (isNext || isLastEarned);

          return (
            <div key={`${badge.key}-${index}`} className="relative z-10 w-20 shrink-0 text-center">
              <button
                type="button"
                onClick={() => {
                  if (!onBadgeClick) return;
                  if (isNext) onBadgeClick(badgesEarned + 1);
                  else if (isLastEarned) onBadgeClick(badgesEarned - 1);
                }}
                className={`mx-auto flex w-full flex-col items-center ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                title={`${badge.nameDe} (${badge.leaderDe})${cap ? ` – Lv ${cap}` : ''}${
                  isEarned ? ' ✓' : isNext ? ' – Klicken zum Erhalten' : ''
                }`}
              >
                <div
                  className={`relative h-11 w-11 shrink-0 transition-all duration-200 ${
                    isEarned
                      ? 'opacity-100'
                      : isNext
                        ? 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100'
                        : 'grayscale opacity-35'
                  }`}
                >
                  <Image src={badge.imagePath} alt={badge.nameDe} width={44} height={44} className="h-full w-full object-contain" />
                </div>
                <span className={`mt-1 max-w-full truncate text-[10px] font-bold ${isEarned ? 'text-white' : 'text-white/55'}`}>{badge.nameDe}</span>
                {cap != null ? <span className="text-[9px] font-bold tabular-nums text-[var(--brand-gold)]">LV {cap}</span> : null}
              </button>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
