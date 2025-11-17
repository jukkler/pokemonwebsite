'use client';

import { useMemo, useState } from 'react';

type PlayerInfo = {
  id: number;
  name: string;
  color: string;
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

export default function TabelleClient({ players, rows }: TabelleClientProps) {
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'route',
    direction: 'asc',
  });
  const [onlyAvailable, setOnlyAvailable] = useState(false);

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
              const translations: Record<string, string> = {
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
              return translations[lower] || type.charAt(0).toUpperCase() + type.slice(1);
            })
            .join(' / ')
        : null;

    return (
      <div className="flex items-start gap-3">
        {cell.spriteUrl && (
          <img
            src={cell.spriteUrl}
            alt={displayName}
            className="w-16 h-16 object-contain flex-shrink-0"
          />
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{displayName}</span>
          {typeText && (
            <span className="text-sm text-gray-600">{typeText}</span>
          )}
          <span className="text-sm font-medium text-purple-700">
            BP: {cell.basePoints ?? '-'}
          </span>
          {cell.status && (
            <span
              className={`mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
                cell.status === 'ko'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-800'
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
      return 'bg-red-50';
    }
    if (status === 'notCaught') {
      return 'bg-amber-50';
    }
    return '';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-4 flex items-center justify-end gap-2">
        <label htmlFor="only-available" className="text-sm font-medium text-gray-700">
          Nur verfügbare Pokémon anzeigen
        </label>
        <input
          id="only-available"
          type="checkbox"
          checked={onlyAvailable}
          onChange={(e) => setOnlyAvailable(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('route')}
                  className="flex items-center gap-2 font-semibold text-gray-700"
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
                    className="flex items-center gap-2 font-semibold text-gray-700"
                  >
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
                  className="flex items-center gap-2 font-semibold text-gray-700 ml-auto"
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
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Keine Encounters gefunden.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b last:border-b-0 ${getRowHighlight(row.status)}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.name}
                  </td>
                  {row.players.map((cell, index) => (
                    <td key={`${row.id}-player-${index}`} className="px-4 py-3">
                      {renderPlayerCell(cell)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold text-purple-800">
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
    </div>
  );
}

