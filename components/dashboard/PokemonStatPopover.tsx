'use client';

import Image from 'next/image';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { getTypeColor } from '@/lib/design-tokens';
import { getSpriteUrl } from '@/lib/sprite-utils';
import {
  getBaseStatBarWidth,
  getStrongestBaseStats,
  getTeamPokemonTotal,
  TEAM_BASE_STAT_DEFINITIONS,
  type TeamBaseStats,
} from '@/lib/team-base-stats';
import { getGermanTypeName } from '@/lib/typeEffectiveness';

export type PokemonStatPopoverPokemon = TeamBaseStats & {
  name: string;
  nameGerman?: string | null;
  nickname?: string | null;
  types: readonly string[];
  spriteUrl: string | null;
  spriteGifUrl?: string | null;
};

export type PokemonStatPopoverTriggerProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | 'type'
  | 'aria-label'
  | 'aria-expanded'
  | 'aria-controls'
  | 'aria-describedby'
  | 'disabled'
  | 'onFocus'
  | 'onClick'
>;

export interface PokemonStatPopoverProps {
  pokemon: PokemonStatPopoverPokemon;
  slotNumber: number;
  teamAverage: number | null;
  averageLabel?: string;
  interactionDisabled?: boolean;
  renderTrigger?: (triggerProps: PokemonStatPopoverTriggerProps) => ReactNode;
}

function formatAverageDelta(total: number, teamAverage: number | null, averageLabel: string): string {
  if (teamAverage === null) return 'Kein Teamdurchschnitt verfügbar';

  const delta = total - teamAverage;
  if (delta === 0) return `Entspricht dem ${averageLabel}`;
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)} BP zum ${averageLabel}`;
}

export default function PokemonStatPopover({
  pokemon,
  slotNumber,
  teamAverage,
  averageLabel = 'Team-Ø',
  interactionDisabled = false,
  renderTrigger,
}: PokemonStatPopoverProps) {
  const { spriteMode, baseStatOverlaysEnabled } = useSpriteMode();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const interactionsEnabled = baseStatOverlaysEnabled && !interactionDisabled;
  const isOpen = interactionsEnabled && (isHovered || isFocused || isPinned);
  const displayName = pokemon.nickname ?? pokemon.nameGerman ?? pokemon.name;
  const speciesName = pokemon.nameGerman ?? pokemon.name;
  const spriteUrl = getSpriteUrl(pokemon, spriteMode) ?? '/pokeball.svg';
  const total = getTeamPokemonTotal(pokemon);
  const strongestStats = new Set(getStrongestBaseStats(pokemon));

  useEffect(() => {
    if (!isOpen) return;

    const close = () => {
      setIsHovered(false);
      setIsFocused(false);
      setIsPinned(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const triggerProps: PokemonStatPopoverTriggerProps = {
    type: 'button',
    'aria-label': interactionsEnabled ? `Basiswerte von ${displayName} anzeigen` : displayName,
    'aria-expanded': interactionsEnabled ? isOpen : undefined,
    'aria-controls': interactionsEnabled ? popoverId : undefined,
    'aria-describedby': isOpen ? popoverId : undefined,
    disabled: !interactionsEnabled,
    onFocus: () => {
      if (interactionsEnabled) setIsFocused(true);
    },
    onClick: () => {
      if (!interactionsEnabled) return;
      if (isPinned) {
        setIsPinned(false);
        setIsFocused(false);
      } else {
        setIsPinned(true);
      }
    },
  };

  const defaultTrigger = (
    <button
      {...triggerProps}
      className="dashboard-pokemon-stat-trigger"
    >
      <span className="dashboard-slot-number">{slotNumber}</span>
      <Image
        src={spriteUrl}
        alt=""
        width={72}
        height={72}
        sizes="(max-width: 767px) 44px, 64px"
        className="dashboard-pokemon-sprite"
        unoptimized={spriteMode === 'animated' && Boolean(pokemon.spriteGifUrl)}
      />
      <strong title={pokemon.nickname ? `${speciesName} (${pokemon.nickname})` : undefined}>
        {displayName}
      </strong>
      {pokemon.nickname ? <small>{speciesName}</small> : null}
      <span className="dashboard-type-list">
        {pokemon.types.length > 0 ? pokemon.types.map(type => (
            <span
              key={type}
              className="dashboard-type-tag"
              style={{ '--type-accent': getTypeColor(type) } as CSSProperties}
            >
              {getGermanTypeName(type)}
            </span>
          )) : <span className="dashboard-empty-value">–</span>}
      </span>
    </button>
  );

  return (
    <div
      ref={shellRef}
      className="dashboard-pokemon-stat-shell"
      data-open={isOpen ? 'true' : 'false'}
      data-overlays-enabled={interactionsEnabled ? 'true' : 'false'}
      onPointerEnter={event => {
        if (interactionsEnabled && event.pointerType === 'mouse') setIsHovered(true);
      }}
      onPointerLeave={event => {
        if (event.pointerType === 'mouse') setIsHovered(false);
      }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsFocused(false);
          setIsPinned(false);
        }
      }}
    >
      {renderTrigger ? renderTrigger(triggerProps) : defaultTrigger}

      {interactionsEnabled ? (
        <aside
          id={popoverId}
          role="tooltip"
          aria-hidden={!isOpen}
          className="dashboard-pokemon-stat-popover"
        >
          <header>
            <span>{displayName}</span>
            <strong>{total} BP</strong>
          </header>
          <dl>
            {TEAM_BASE_STAT_DEFINITIONS.map(definition => {
              const value = pokemon[definition.key];
              const isStrongest = strongestStats.has(definition.key);

              return (
                <div key={definition.key} data-strongest={isStrongest ? 'true' : undefined}>
                  <dt>
                    {definition.label}
                    {isStrongest ? <span>Top</span> : null}
                  </dt>
                  <dd>
                    <span className="dashboard-pokemon-stat-track" aria-hidden="true">
                      <span style={{ '--stat-width': `${getBaseStatBarWidth(value)}%` } as CSSProperties} />
                    </span>
                    <strong>{value}</strong>
                  </dd>
                </div>
              );
            })}
          </dl>
          <footer data-positive={teamAverage !== null && total >= teamAverage ? 'true' : undefined}>
            {formatAverageDelta(total, teamAverage, averageLabel)}
          </footer>
        </aside>
      ) : null}
    </div>
  );
}
