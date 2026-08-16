'use client';

import Image from 'next/image';
import { createPortal } from 'react-dom';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useGameEvents } from '@/lib/contexts/EventContext';
import {
  getEventPresentation,
  type EventPresentation,
} from '@/lib/event-presentation';
import type { GameEvent } from '@/lib/event-store';

const DURATIONS: Record<GameEvent['type'], number> = {
  run_failed: 5500,
  run_completed: 5500,
  pokemon_ko: 4600,
  badge_unlocked: 4800,
  pokemon_not_caught: 4300,
  team_link_added: 5200,
  team_link_boxed: 5200,
};

const FADEOUT_BEFORE = 800;
const PARTICLES = [
  { left: 8, top: 22, delay: 0.1, size: 4, drift: -42 },
  { left: 16, top: 72, delay: 0.7, size: 3, drift: 28 },
  { left: 24, top: 38, delay: 1.15, size: 5, drift: -18 },
  { left: 32, top: 82, delay: 0.35, size: 2, drift: 36 },
  { left: 41, top: 17, delay: 1.4, size: 3, drift: -30 },
  { left: 49, top: 68, delay: 0.9, size: 4, drift: 24 },
  { left: 58, top: 28, delay: 0.45, size: 2, drift: -34 },
  { left: 65, top: 79, delay: 1.2, size: 5, drift: 20 },
  { left: 73, top: 15, delay: 0.25, size: 3, drift: -26 },
  { left: 81, top: 62, delay: 1.55, size: 4, drift: 34 },
  { left: 89, top: 34, delay: 0.75, size: 2, drift: -20 },
  { left: 94, top: 77, delay: 1.05, size: 3, drift: 25 },
] as const;

const RAYS = Array.from({ length: 12 }, (_, index) => index);
const subscribeToClient = () => () => {};

type OverlayPhase = 'enter' | 'exit';
type CustomProperties = CSSProperties & Record<`--${string}`, string | number>;

export default function EventOverlay() {
  const { currentEvent, dismissEvent } = useGameEvents();
  const mounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );

  if (!mounted || !currentEvent) return null;

  return createPortal(
    <ActiveEventOverlay
      key={currentEvent.id}
      event={currentEvent}
      dismissEvent={dismissEvent}
    />,
    document.body,
  );
}

function ActiveEventOverlay({
  event,
  dismissEvent,
}: {
  event: GameEvent;
  dismissEvent: () => void;
}) {
  const [phase, setPhase] = useState<OverlayPhase>('enter');

  useEffect(() => {
    const duration = DURATIONS[event.type];
    const exitTimer = window.setTimeout(
      () => setPhase('exit'),
      duration - FADEOUT_BEFORE,
    );
    const dismissTimer = window.setTimeout(dismissEvent, duration);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [dismissEvent, event.type]);

  const presentation = getEventPresentation(event);

  return (
    <CinematicOverlay
      event={event}
      phase={phase}
      presentation={presentation}
      visual={renderVisual(event, presentation)}
    />
  );
}

function CinematicOverlay({
  event,
  phase,
  presentation,
  visual,
}: {
  event: GameEvent;
  phase: OverlayPhase;
  presentation: EventPresentation;
  visual: ReactNode;
}) {
  const accessibleText = [
    presentation.eyebrow,
    presentation.headline,
    presentation.declaration,
    ...presentation.details,
    ...(event.type === 'team_link_added' || event.type === 'team_link_boxed'
      ? (event.data.teamMembers ?? []).map(
          (member) =>
            `${member.playerName}: ${member.pokemonNameGerman || member.pokemonName}`,
        )
      : []),
  ].join('. ');

  return (
    <div
      className={`event-cinematic event-cinematic--${presentation.tone} event-cinematic--${phase}`}
      style={
        { '--event-duration': `${DURATIONS[event.type]}ms` } as CustomProperties
      }
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      aria-label={accessibleText}
    >
      <div className="event-cinematic__backdrop" aria-hidden="true" />
      <div className="event-cinematic__wash" aria-hidden="true" />
      <div className="event-cinematic__grid" aria-hidden="true" />
      <div className="event-cinematic__streaks" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="event-cinematic__particles" aria-hidden="true">
        {PARTICLES.map((particle) => (
          <i
            key={`${particle.left}-${particle.top}`}
            style={
              {
                '--particle-left': `${particle.left}%`,
                '--particle-top': `${particle.top}%`,
                '--particle-delay': `${particle.delay}s`,
                '--particle-size': `${particle.size}px`,
                '--particle-drift': `${particle.drift}px`,
              } as CustomProperties
            }
          />
        ))}
      </div>
      <div className="event-cinematic__horizon" aria-hidden="true" />

      <div className="event-cinematic__content">
        {visual}
        <div className="event-cinematic__copy">
          <p className="event-cinematic__eyebrow">{presentation.eyebrow}</p>
          <h2 className="event-cinematic__headline">{presentation.headline}</h2>
          <p className="event-cinematic__declaration">
            {presentation.declaration}
          </p>
          {presentation.details.length > 0 && (
            <div className="event-cinematic__details">
              {presentation.details.map((detail) => (
                <span key={detail}>{detail}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="event-cinematic__timer" aria-hidden="true" />
    </div>
  );
}

function renderVisual(
  event: GameEvent,
  presentation: EventPresentation,
): ReactNode {
  if (presentation.visual === 'pokemon') {
    return (
      <PokemonEventVisual
        event={event}
        escaping={presentation.tone === 'escape'}
      />
    );
  }
  if (presentation.visual === 'badge') {
    return <BadgeEventVisual event={event} />;
  }
  if (presentation.visual === 'team') {
    return (
      <TeamLinkEventVisual event={event} boxed={presentation.tone === 'box'} />
    );
  }
  return <RunEventVisual victory={presentation.visual === 'victory'} />;
}

function PokemonEventVisual({
  event,
  escaping,
}: {
  event: GameEvent;
  escaping: boolean;
}) {
  const sprite = event.data.spriteUrl || '/pokeball.svg';

  return (
    <div
      className={`event-cinematic__pokemon ${escaping ? 'is-escaping' : 'is-fallen'}`}
      aria-hidden="true"
    >
      <span className="event-cinematic__orbit event-cinematic__orbit--outer" />
      <span className="event-cinematic__orbit event-cinematic__orbit--inner" />
      {escaping && (
        <>
          <Image
            src={sprite}
            alt=""
            width={192}
            height={192}
            className="event-cinematic__afterimage event-cinematic__afterimage--one"
            unoptimized
          />
          <Image
            src={sprite}
            alt=""
            width={192}
            height={192}
            className="event-cinematic__afterimage event-cinematic__afterimage--two"
            unoptimized
          />
        </>
      )}
      <Image
        src={sprite}
        alt=""
        width={192}
        height={192}
        className="event-cinematic__sprite"
        unoptimized
      />
      {!escaping && (
        <div className="event-cinematic__slashes">
          <i />
          <i />
          <i />
        </div>
      )}
    </div>
  );
}

function BadgeEventVisual({ event }: { event: GameEvent }) {
  return (
    <div className="event-cinematic__badge" aria-hidden="true">
      <div className="event-cinematic__rays">
        {RAYS.map((ray) => (
          <i
            key={ray}
            style={
              {
                '--ray-index': ray,
                '--ray-delay': `${250 + ray * 28}ms`,
              } as CustomProperties
            }
          />
        ))}
      </div>
      <span className="event-cinematic__badge-ring event-cinematic__badge-ring--one" />
      <span className="event-cinematic__badge-ring event-cinematic__badge-ring--two" />
      <div className="event-cinematic__badge-image">
        {event.data.badgeImagePath ? (
          <Image
            src={event.data.badgeImagePath}
            alt=""
            width={180}
            height={180}
            className="h-full w-full object-contain"
          />
        ) : (
          <span>★</span>
        )}
      </div>
    </div>
  );
}

function TeamLinkEventVisual({
  event,
  boxed,
}: {
  event: GameEvent;
  boxed: boolean;
}) {
  const members = event.data.teamMembers ?? [];

  return (
    <div
      className={`event-cinematic__team-link ${boxed ? 'is-boxed' : 'is-joining'}`}
      aria-hidden="true"
    >
      <span className="event-cinematic__team-link-beam" />
      <span className="event-cinematic__team-link-node">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.15-1.15" />
        </svg>
      </span>
      {boxed && (
        <span className="event-cinematic__storage-box">
          <svg viewBox="0 0 120 92" fill="none">
            <path className="event-cinematic__storage-lid" d="M14 24 27 10h66l13 14" />
            <path d="M13 27h94v54H13z" />
            <path d="M13 42h94M46 42v13h28V42" />
            <circle cx="60" cy="65" r="7" />
            <path d="M53 65h14M60 58v14" />
          </svg>
        </span>
      )}
      <ul>
        {members.map((member, index) => {
          const displayName = member.pokemonNameGerman || member.pokemonName;
          const center = (members.length - 1) / 2;
          return (
            <li
              key={`${member.playerName}-${member.pokemonName}-${index}`}
              style={
                {
                  '--member-delay': `${260 + index * 150}ms`,
                  '--member-box-shift': `${(center - index) * 112}px`,
                } as CustomProperties
              }
            >
              <span className="event-cinematic__team-member-sprite">
                <Image
                  src={member.spriteUrl || '/pokeball.svg'}
                  alt=""
                  width={112}
                  height={112}
                  unoptimized
                />
              </span>
              <strong>{displayName}</strong>
              <span>{member.playerName}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RunEventVisual({ victory }: { victory: boolean }) {
  return (
    <div
      className={`event-cinematic__run-icon ${victory ? 'is-victory' : 'is-failure'}`}
      aria-hidden="true"
    >
      {victory ? (
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M20 8h24v13c0 9-5 16-12 16S20 30 20 21V8Z" />
          <path d="M20 14H9v5c0 9 6 15 15 16M44 14h11v5c0 9-6 15-15 16M32 37v10M21 56h22M24 47h16v9H24z" />
          <path d="m32 14 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8 2.5-5Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 64 64" fill="none">
          <path d="m13 12 39 40M52 12 13 52" />
          <path d="M8 24h14M42 40h14M24 7v12M40 45v12" />
        </svg>
      )}
    </div>
  );
}
