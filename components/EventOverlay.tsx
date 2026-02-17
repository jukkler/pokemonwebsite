'use client';

/**
 * EventOverlay - Globale Fullscreen-Animationen für Game Events
 * Rendert via Portal über dem gesamten UI.
 * Inspiriert von Dark Souls "YOU DIED", GTA "WASTED", Sekiro "DEATH".
 */

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGameEvents } from '@/lib/contexts/EventContext';
import Image from 'next/image';
import type { GameEvent } from '@/lib/event-store';

// Auto-Dismiss Zeiten pro Event-Typ (ms)
const DURATIONS: Record<GameEvent['type'], number> = {
  run_failed: 5000,
  pokemon_ko: 3500,
  badge_unlocked: 3500,
  pokemon_not_caught: 3500,
};

// Fadeout startet X ms vor Ende
const FADEOUT_BEFORE = 800;

export default function EventOverlay() {
  const { currentEvent, dismissEvent } = useGameEvents();
  const [phase, setPhase] = useState<'enter' | 'exit' | null>(null);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portal-Target (client-only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Animation lifecycle
  useEffect(() => {
    if (!currentEvent) {
      setPhase(null);
      return;
    }

    setPhase('enter');

    const duration = DURATIONS[currentEvent.type];

    // Start fadeout
    exitTimerRef.current = setTimeout(() => {
      setPhase('exit');
    }, duration - FADEOUT_BEFORE);

    // Dismiss nach voller Dauer
    timerRef.current = setTimeout(() => {
      dismissEvent();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [currentEvent, dismissEvent]);

  if (!mounted || !currentEvent || !phase) return null;

  const overlay = renderEvent(currentEvent, phase);

  return createPortal(overlay, document.body);
}

function renderEvent(event: GameEvent, phase: 'enter' | 'exit') {
  switch (event.type) {
    case 'run_failed':
      return <RunFailedOverlay event={event} phase={phase} />;
    case 'pokemon_ko':
      return <PokemonKOOverlay event={event} phase={phase} />;
    case 'badge_unlocked':
      return <BadgeUnlockedOverlay event={event} phase={phase} />;
    case 'pokemon_not_caught':
      return <NotCaughtBanner event={event} phase={phase} />;
  }
}

// ============================================================
// RUN FAILED — "GESCHEITERT" (Dark Souls "YOU DIED" Style)
// ============================================================
function RunFailedOverlay({ event, phase }: { event: GameEvent; phase: 'enter' | 'exit' }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{
        zIndex: 10000,
        animation: phase === 'enter'
          ? 'event-backdrop-in 1s ease-out forwards'
          : 'event-backdrop-out 0.8s ease-in forwards',
      }}
    >
      {/* Schwarzer Backdrop */}
      <div className="absolute inset-0 bg-black/85" />

      {/* Rote Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(220, 38, 38, 0.3) 100%)',
          animation: 'vignette-pulse 2s ease-in-out infinite',
        }}
      />

      {/* Horizontale rote Linie */}
      <div
        className="absolute left-0 right-0 h-px bg-red-600/40"
        style={{
          top: 'calc(50% - 60px)',
          animation: phase === 'enter' ? 'fade-in 2s ease-out forwards' : undefined,
          boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
        }}
      />
      <div
        className="absolute left-0 right-0 h-px bg-red-600/40"
        style={{
          top: 'calc(50% + 60px)',
          animation: phase === 'enter' ? 'fade-in 2s ease-out forwards' : undefined,
          boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
        }}
      />

      {/* Haupttext */}
      <div className="relative text-center">
        <h1
          className="text-5xl md:text-7xl font-serif font-bold text-red-600 select-none"
          style={{
            animation: 'death-text-in 2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            textShadow: '0 0 40px rgba(220, 38, 38, 0.6), 0 0 80px rgba(220, 38, 38, 0.3)',
            letterSpacing: '0.3em',
          }}
        >
          GESCHEITERT
        </h1>

        {event.data.runNumber && (
          <p
            className="mt-6 text-lg md:text-xl text-red-400/70 font-light tracking-widest select-none"
            style={{
              animation: 'death-subtitle-in 1s ease-out 1.5s both',
            }}
          >
            Run #{event.data.runNumber}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// POKEMON K.O. — "GEFALLEN" (Lighter Death Screen)
// ============================================================
function PokemonKOOverlay({ event, phase }: { event: GameEvent; phase: 'enter' | 'exit' }) {
  const displayName = event.data.pokemonNameGerman || event.data.pokemonName || 'Pokemon';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{
        zIndex: 10000,
        animation: phase === 'enter'
          ? 'event-backdrop-in 0.6s ease-out forwards'
          : 'event-backdrop-out 0.6s ease-in forwards',
      }}
    >
      {/* Dunklerer Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Rote Vignette (dezenter) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(220, 38, 38, 0.2) 100%)',
        }}
      />

      {/* Text */}
      <div className="relative text-center">
        <h2
          className="text-3xl md:text-5xl font-serif font-bold text-red-500 select-none"
          style={{
            animation: 'ko-text-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            textShadow: '0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.2)',
            letterSpacing: '0.15em',
          }}
        >
          {displayName}
          <span className="block text-2xl md:text-3xl mt-1 tracking-[0.25em]">
            IST GEFALLEN
          </span>
        </h2>

        {event.data.playerName && (
          <p
            className="mt-5 text-sm md:text-base text-red-400/60 font-light tracking-wider select-none"
            style={{
              animation: 'death-subtitle-in 0.8s ease-out 0.8s both',
            }}
          >
            Verursacht von {event.data.playerName}
          </p>
        )}

        {event.data.routeName && (
          <p
            className="mt-1 text-xs md:text-sm text-red-400/40 font-light tracking-wider select-none"
            style={{
              animation: 'death-subtitle-in 0.8s ease-out 1s both',
            }}
          >
            {event.data.routeName}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// BADGE UNLOCKED — Golden Achievement
// ============================================================
function BadgeUnlockedOverlay({ event, phase }: { event: GameEvent; phase: 'enter' | 'exit' }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{
        zIndex: 10000,
        animation: phase === 'enter'
          ? 'event-backdrop-in 0.5s ease-out forwards'
          : 'event-backdrop-out 0.6s ease-in forwards',
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Golden shimmer sweep */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.08) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'golden-shimmer 2s linear infinite',
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center text-center">
        {/* Badge-Icon */}
        {event.data.badgeImagePath && (
          <div
            className="w-24 h-24 md:w-32 md:h-32 relative mb-6"
            style={{
              animation: 'badge-bounce-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.5))',
            }}
          >
            <div
              className="absolute inset-[-8px] rounded-full"
              style={{ animation: 'golden-glow 1.5s ease-in-out infinite' }}
            />
            <Image
              src={event.data.badgeImagePath}
              alt={event.data.badgeName || 'Badge'}
              width={128}
              height={128}
              className="object-contain w-full h-full relative z-10"
            />
          </div>
        )}

        {/* Badge-Name */}
        <h2
          className="text-2xl md:text-4xl font-bold text-amber-400 select-none tracking-wide"
          style={{
            animation: 'death-subtitle-in 0.6s ease-out 0.4s both',
            textShadow: '0 0 30px rgba(251, 191, 36, 0.4)',
          }}
        >
          {event.data.badgeName || 'Orden erhalten'}
        </h2>

        {event.data.badgeNumber != null && (
          <p
            className="mt-3 text-sm md:text-base text-amber-300/60 font-light tracking-widest select-none uppercase"
            style={{
              animation: 'death-subtitle-in 0.6s ease-out 0.7s both',
            }}
          >
            Orden #{event.data.badgeNumber}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// NOT CAUGHT — "ENTKOMMEN" (Analogous to K.O. Screen, Yellow)
// ============================================================
function NotCaughtBanner({ event, phase }: { event: GameEvent; phase: 'enter' | 'exit' }) {
  const displayName = event.data.pokemonNameGerman || event.data.pokemonName || 'Pokemon';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{
        zIndex: 10000,
        animation: phase === 'enter'
          ? 'event-backdrop-in 0.6s ease-out forwards'
          : 'event-backdrop-out 0.6s ease-in forwards',
      }}
    >
      {/* Dunklerer Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Gelbe Vignette (dezent) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(234, 179, 8, 0.2) 100%)',
        }}
      />

      {/* Text */}
      <div className="relative text-center">
        <h2
          className="text-3xl md:text-5xl font-serif font-bold text-yellow-500 select-none"
          style={{
            animation: 'ko-text-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            textShadow: '0 0 30px rgba(234, 179, 8, 0.5), 0 0 60px rgba(234, 179, 8, 0.2)',
            letterSpacing: '0.15em',
          }}
        >
          {displayName}
          <span className="block text-2xl md:text-3xl mt-1 tracking-[0.25em]">
            IST ENTKOMMEN
          </span>
        </h2>

        {event.data.playerName && (
          <p
            className="mt-5 text-sm md:text-base text-yellow-400/60 font-light tracking-wider select-none"
            style={{
              animation: 'death-subtitle-in 0.8s ease-out 0.8s both',
            }}
          >
            Verursacht von {event.data.playerName}
          </p>
        )}

        {event.data.routeName && (
          <p
            className="mt-1 text-xs md:text-sm text-yellow-400/40 font-light tracking-wider select-none"
            style={{
              animation: 'death-subtitle-in 0.8s ease-out 1s both',
            }}
          >
            {event.data.routeName}
          </p>
        )}
      </div>
    </div>
  );
}
