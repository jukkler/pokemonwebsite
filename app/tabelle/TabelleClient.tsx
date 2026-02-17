'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { BentoCard } from '@/components/layout/BentoGrid';

type PlayerInfo = {
  id: number;
  name: string;
  color: string;
  avatar: string | null;
};

type EncounterStatus = 'ko' | 'notCaught' | null;

type PlayerCell = {
  playerId: number;
  pokedexId: number | null;
  pokemonName: string;
  pokemonGermanName: string | null;
  types: string[];
  basePoints: number | null;
  status: EncounterStatus;
  spriteUrl: string | null;
  spriteGifUrl: string | null;
};

export type RouteRow = {
  id: number;
  name: string;
  order: number;
  players: (PlayerCell | null)[];
  averageBasePoints: number | null;
  status: EncounterStatus;
};

type SortKey = 'route' | 'average' | `player-${number}`;
type SortDirection = 'asc' | 'desc';

interface TabelleClientProps {
  players: PlayerInfo[];
  rows: RouteRow[];
}

const getSortIndicator = (direction: SortDirection) =>
  direction === 'asc' ? '▲' : '▼';

const TYPE_TRANSLATIONS: Record<string, string> = {
  normal: 'Normal',
  fire: 'Feuer',
  water: 'Wasser',
  electric: 'Elektro',
  grass: 'Pflanze',
  ice: 'Eis',
  fighting: 'Kampf',
  poison: 'Gift',
  ground: 'Boden',
  flying: 'Flug',
  psychic: 'Psycho',
  bug: 'Käfer',
  rock: 'Gestein',
  ghost: 'Geist',
  dragon: 'Drache',
  dark: 'Unlicht',
  steel: 'Stahl',
  fairy: 'Fee',
};

export default function TabelleClient({ players, rows }: TabelleClientProps) {
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'route',
    direction: 'asc',
  });
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const { spriteMode } = useSpriteMode();

  const handleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedRows = useMemo(() => {
    const sorted = [...rows];
    const multiplier = sort.direction === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      if (sort.key === 'route') {
        return a.name.localeCompare(b.name) * multiplier;
      }

      if (sort.key === 'average') {
        const aValue = a.averageBasePoints ?? -Infinity;
        const bValue = b.averageBasePoints ?? -Infinity;
        return (aValue - bValue) * multiplier;
      }

      const [, indexString] = sort.key.split('-');
      const playerIndex = parseInt(indexString, 10);
      const aCell = a.players[playerIndex];
      const bCell = b.players[playerIndex];

      const aValue = aCell?.basePoints ?? -Infinity;
      const bValue = bCell?.basePoints ?? -Infinity;

      if (aValue === bValue) {
        const aName = aCell?.pokemonGermanName || aCell?.pokemonName || '';
        const bName = bCell?.pokemonGermanName || bCell?.pokemonName || '';
        return aName.localeCompare(bName) * multiplier;
      }

      return (aValue - bValue) * multiplier;
    });

    const filtered = onlyAvailable
      ? sorted.filter((row) => row.status === null)
      : sorted;

    return filtered;
  }, [rows, sort, onlyAvailable]);

  const renderPlayerCell = (cell: PlayerCell | null) => {
    if (!cell) {
      return <span className="text-gray-400">-</span>;
    }

    const displayName = cell.pokemonGermanName || cell.pokemonName;
    const typeText =
      cell.types.length > 0
        ? cell.types
            .map((type) => {
              const lower = type.toLowerCase();
              return TYPE_TRANSLATIONS[lower] || type.charAt(0).toUpperCase() + type.slice(1);
            })
            .join(' / ')
        : null;

    // Sprite-URL basierend auf dem Modus wählen
    const displaySpriteUrl = spriteMode === 'animated' && cell.spriteGifUrl
      ? cell.spriteGifUrl
      : cell.spriteUrl;

    return (
      <div className="flex items-start gap-3">
        {displaySpriteUrl && (
          <Image
            src={displaySpriteUrl}
            alt={displayName}
            width={64}
            height={64}
            className="w-16 h-16 object-contain flex-shrink-0"
            unoptimized={spriteMode === 'animated'}
          />
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-[var(--foreground)]">{displayName}</span>
          {typeText && (
            <span className="text-sm text-[var(--text-secondary)]">{typeText}</span>
          )}
          <span className="text-sm font-medium text-purple-400">
            BP: {cell.basePoints ?? '-'}
          </span>
          {cell.status && (
            <span
              className={`mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium border ${
                cell.status === 'ko'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}
            >
              {cell.status === 'ko' ? 'K.O.' : 'Nicht gefangen'}
            </span>
          )}
        </div>
      </div>
    );
  };

  const getRowHighlight = (status: EncounterStatus) => {
    if (status === 'ko') {
      return 'bg-red-500/10';
    }
    if (status === 'notCaught') {
      return 'bg-amber-500/10';
    }
    return '';
  };

  return (
    <BentoCard
      span={{ sm: 1, md: 3, lg: 3 }}
      className="animate-[scale-in_0.3s_ease-out]"
    >
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Encounter-Tabelle</h1>
        <label htmlFor="only-available" className="flex items-center gap-3 cursor-pointer">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Nur verfügbare Pokémon
          </span>
          <input
            id="only-available"
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border-default)] text-purple-600 focus:ring-purple-500 bg-[var(--background-secondary)]"
          />
        </label>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
        <table className="w-full text-left">
          <thead className="bg-[var(--card-bg-elevated)]">
            <tr className="border-b border-[var(--border-default)]">
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('route')}
                  className="flex items-center gap-2 font-semibold text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors duration-300"
                >
                  Route
                  {sort.key === 'route' && (
                    <span className="text-xs">{getSortIndicator(sort.direction)}</span>
                  )}
                </button>
              </th>
              {players.map((player, index) => (
                <th key={player.id} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort(`player-${index}`)}
                    className="flex items-center gap-2 font-semibold text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors duration-300"
                  >
                    {player.avatar ? (
                      <Image
                        src={player.avatar}
                        alt={player.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                    )}
                    <span>{player.name}</span>
                    {sort.key === `player-${index}` && (
                      <span className="text-xs">
                        {getSortIndicator(sort.direction)}
                      </span>
                    )}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('average')}
                  className="flex items-center gap-2 font-semibold text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors duration-300 ml-auto"
                >
                  Durchschnitt Gesamt BP
                  {sort.key === 'average' && (
                    <span className="text-xs">{getSortIndicator(sort.direction)}</span>
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={players.length + 2}
                  className="px-4 py-8 text-center text-[var(--text-secondary)]"
                >
                  Keine Encounters gefunden.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--background-tertiary)] transition-colors duration-300 ${getRowHighlight(row.status)}`}
                >
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                    {row.name}
                  </td>
                  {row.players.map((cell, index) => (
                    <td key={`${row.id}-player-${index}`} className="px-4 py-3">
                      {renderPlayerCell(cell)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold text-purple-400">
                    {row.averageBasePoints !== null
                      ? Math.round(row.averageBasePoints)
                      : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </BentoCard>
  );
}

