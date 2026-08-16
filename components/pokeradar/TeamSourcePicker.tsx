'use client';

import { useMemo, useState } from 'react';
import SelectionStatusBadge from '@/components/pokeradar/SelectionStatusBadge';
import PokemonMiniSprite from '@/components/pokeradar/PokemonMiniSprite';
import type {
  ComparisonSelectionStatus,
  TeamSourcePlayer,
} from '@/components/pokeradar/team-comparison-types';

export interface AppliedPlayerTeam {
  playerId: number;
  playerName: string;
  pokemonIds: number[];
  statuses: ComparisonSelectionStatus[];
  sourceLabel: string;
}

export interface AppliedTeamPokemon {
  playerId: number;
  playerName: string;
  pokedexId: number;
  status: ComparisonSelectionStatus;
  sourceLabel: string;
}

export interface TeamSourcePickerProps {
  players: TeamSourcePlayer[];
  selectedPokemonIds: readonly number[];
  loading?: boolean;
  error?: string | null;
  onApplyTeam: (team: AppliedPlayerTeam) => void;
  onTogglePokemon: (pokemon: AppliedTeamPokemon) => void;
  disabled?: boolean;
  className?: string;
}

function getOccupiedTeamMembers(player: TeamSourcePlayer | undefined) {
  if (!player) return [];

  return [...player.teamSlots]
    .filter(
      (member) =>
        Number.isInteger(member.teamSlot) &&
        member.teamSlot !== null &&
        member.teamSlot >= 1 &&
        member.teamSlot <= 6,
    )
    .sort((left, right) => (left.teamSlot ?? 7) - (right.teamSlot ?? 7))
    .slice(0, 6);
}

function getDistinctComparedMembers(
  members: ReturnType<typeof getOccupiedTeamMembers>,
) {
  const seenPokedexIds = new Set<number>();
  return members.filter((member) => {
    if (seenPokedexIds.has(member.pokedexId)) return false;
    seenPokedexIds.add(member.pokedexId);
    return true;
  });
}

export default function TeamSourcePicker({
  players,
  selectedPokemonIds,
  loading = false,
  error = null,
  onApplyTeam,
  onTogglePokemon,
  disabled = false,
  className = '',
}: TeamSourcePickerProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const resolvedPlayerId = players.some(
    (player) => player.id === selectedPlayerId,
  )
    ? selectedPlayerId
    : players[0]?.id ?? null;
  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === resolvedPlayerId),
    [players, resolvedPlayerId],
  );
  const occupiedMembers = useMemo(
    () => getOccupiedTeamMembers(selectedPlayer),
    [selectedPlayer],
  );
  const comparedMembers = useMemo(
    () => getDistinctComparedMembers(occupiedMembers),
    [occupiedMembers],
  );

  const applyTeam = () => {
    if (!selectedPlayer || comparedMembers.length === 0) return;

    onApplyTeam({
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      pokemonIds: comparedMembers.map((member) => member.pokedexId),
      statuses: comparedMembers.map((member) => member.status),
      sourceLabel: `Team von ${selectedPlayer.name}`,
    });
  };

  return (
    <section
      aria-labelledby="team-source-heading"
      className={`p-4 ${className}`}
    >
      <div>
        <h2 id="team-source-heading" className="text-lg font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">
          Spielerteams
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
          Wähle einzelne Pokémon aus oder übernimm alle belegten Teamplätze.
        </p>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3" aria-busy="true" aria-label="Spielerteams werden geladen">
          <div className="h-11 animate-pulse bg-[var(--background-tertiary)]" />
          <div className="h-20 animate-pulse bg-[var(--background-tertiary)]" />
        </div>
      ) : error ? (
        <div className="mt-4 border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </div>
      ) : players.length === 0 ? (
        <p className="mt-4 border border-dashed border-[var(--border-default)] bg-[var(--background-secondary)] p-4 text-sm text-[var(--text-secondary)]">
          Noch keine Spielerteams verfügbar.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold text-[var(--foreground)]">
            Spieler auswählen
            <select
              value={resolvedPlayerId ?? ''}
              onChange={(event) => setSelectedPlayerId(Number(event.target.value))}
              disabled={disabled}
              className="mt-1.5 min-h-11 w-full border border-[var(--border-default)] bg-[var(--background-secondary)] px-3 text-sm font-bold text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

          {occupiedMembers.length > 0 ? (
            <ol className="grid grid-cols-2 gap-0 border-l border-t border-[var(--border-default)]" aria-label={`Belegte Teamplätze von ${selectedPlayer?.name}`}>
              {occupiedMembers.map((member) => {
                const displayName = member.pokemonNameGerman || member.pokemonName;
                const selected = selectedPokemonIds.includes(member.pokedexId);
                const selectionDisabled = disabled || (!selected && selectedPokemonIds.length >= 6);
                return (
                  <li
                    key={member.encounterId}
                    className="min-w-0 border-b border-r border-[var(--border-default)] bg-[var(--background-secondary)]"
                  >
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${member.nickname || displayName} ${selected ? 'aus dem Vergleich entfernen' : 'zum Vergleich hinzufügen'}`}
                      disabled={selectionDisabled}
                      onClick={() => onTogglePokemon({
                        playerId: selectedPlayer?.id ?? 0,
                        playerName: selectedPlayer?.name ?? '',
                        pokedexId: member.pokedexId,
                        status: member.status,
                        sourceLabel: `Team von ${selectedPlayer?.name ?? ''}`,
                      })}
                      className={`block min-h-24 w-full px-3 py-2 text-left transition hover:bg-[var(--card-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-45 ${selected ? 'bg-red-600/8' : ''}`}
                    >
                      <span className="flex items-center justify-between gap-2 text-xs text-[var(--text-tertiary)]">
                        <span>Platz {member.teamSlot}</span>
                        <span
                          aria-hidden="true"
                          className={`grid size-5 shrink-0 place-items-center border font-black ${selected ? 'border-red-600 bg-red-600 text-white' : 'border-[var(--border-strong)] text-[var(--foreground)]'}`}
                        >
                          {selected ? '✓' : '+'}
                        </span>
                      </span>
                      <span className="mt-1 flex min-w-0 items-center gap-2">
                        <PokemonMiniSprite pokemon={member} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[var(--foreground)]" title={member.nickname || displayName}>
                            {member.nickname || displayName}
                          </span>
                          {member.nickname ? (
                            <span className="block truncate text-xs text-[var(--text-secondary)]" title={displayName}>
                              {displayName}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <SelectionStatusBadge
                        status={member.status}
                        className="mt-1.5"
                      />
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="border border-dashed border-[var(--border-default)] bg-[var(--background-secondary)] p-3 text-sm text-[var(--text-secondary)]">
              Für {selectedPlayer?.name} sind keine Teamplätze belegt.
            </p>
          )}

          {comparedMembers.length < occupiedMembers.length ? (
            <p className="text-xs leading-5 text-[var(--text-tertiary)]">
              Alle Plätze werden eingelesen. Gleiche Pokémon-Arten erscheinen im Basiswertvergleich einmal.
            </p>
          ) : null}

          <button
            type="button"
            onClick={applyTeam}
            disabled={disabled || occupiedMembers.length === 0}
            className="app-action app-action-primary min-h-11 w-full disabled:cursor-not-allowed disabled:opacity-45"
          >
            {selectedPlayer
              ? `Team von ${selectedPlayer.name} übernehmen`
              : 'Team übernehmen'}
          </button>
        </div>
      )}
    </section>
  );
}
