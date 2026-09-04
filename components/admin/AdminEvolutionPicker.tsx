'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { getSpriteUrl } from '@/lib/sprite-utils';
import {
  getAdjacentEvolutionChoices,
  type AdminEvolutionChoice,
  type AdminEvolutionDetailsResponse,
} from './admin-evolution-options';

interface AdminEvolutionPickerProps {
  currentPokedexId: number;
  gameVersionKey?: string | null;
  selectedPokedexId: number | null;
  onSelect: (pokedexId: number) => void;
  disabled?: boolean;
}

function detailsUrl(pokedexId: number, gameVersionKey?: string | null) {
  const query = gameVersionKey
    ? `?gameVersion=${encodeURIComponent(gameVersionKey)}`
    : '';
  return `/api/pokemon/${pokedexId}/details${query}`;
}

async function loadDetails(
  pokedexId: number,
  gameVersionKey: string | null | undefined,
  signal: AbortSignal,
): Promise<AdminEvolutionDetailsResponse> {
  const response = await fetch(detailsUrl(pokedexId, gameVersionKey), { signal });
  const payload = (await response.json().catch(() => null)) as
    | AdminEvolutionDetailsResponse
    | { error?: string }
    | null;

  if (!response.ok || !payload || !('evolution' in payload)) {
    const message = payload && 'error' in payload && payload.error
      ? payload.error
      : 'Entwicklungen konnten nicht geladen werden';
    throw new Error(message);
  }

  return payload;
}

export default function AdminEvolutionPicker({
  currentPokedexId,
  gameVersionKey,
  selectedPokedexId,
  onSelect,
  disabled = false,
}: AdminEvolutionPickerProps) {
  const { spriteMode } = useSpriteMode();
  const [retryKey, setRetryKey] = useState(0);
  const requestKey = `${currentPokedexId}:${gameVersionKey ?? ''}:${retryKey}`;
  const [result, setResult] = useState<{
    requestKey: string;
    status: 'pending' | 'success' | 'error';
    details: AdminEvolutionDetailsResponse | null;
    error: string | null;
  }>(() => ({ requestKey, status: 'pending', details: null, error: null }));

  useEffect(() => {
    const controller = new AbortController();

    void loadDetails(currentPokedexId, gameVersionKey, controller.signal)
      .then((details) => setResult({ requestKey, status: 'success', details, error: null }))
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          requestKey,
          status: 'error',
          details: null,
          error: loadError instanceof Error
            ? loadError.message
            : 'Entwicklungen konnten nicht geladen werden',
        });
      });

    return () => controller.abort();
  }, [currentPokedexId, gameVersionKey, requestKey]);

  const loading = result.requestKey !== requestKey || result.status === 'pending';
  const details = loading ? null : result.details;
  const error = loading ? null : result.error;

  const choices = useMemo(
    () => details ? getAdjacentEvolutionChoices(details, currentPokedexId) : [],
    [currentPokedexId, details],
  );
  const evolutionChoices = choices.filter((choice) => choice.direction === 'evolution');
  const preEvolutionChoices = choices.filter((choice) => choice.direction === 'pre-evolution');
  const retry = useCallback(() => setRetryKey((key) => key + 1), []);

  if (loading) {
    return (
      <div role="status" className="border border-[var(--border-default)] bg-[var(--background-secondary)] p-4 text-sm text-[var(--text-secondary)]">
        Entwicklungen werden geladen…
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 border border-red-500/40 bg-red-500/10 p-4">
        <p role="alert" className="text-sm text-red-700 dark:text-red-200">{error}</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-10 border border-red-500 px-3 py-2 text-sm font-bold text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] dark:text-red-200"
        >
          Erneut laden
        </button>
      </div>
    );
  }

  if (choices.length === 0) {
    return (
      <p className="border border-[var(--border-default)] bg-[var(--background-secondary)] p-4 text-sm text-[var(--text-secondary)]">
        Für dieses Pokémon ist keine direkte Vor- oder Weiterentwicklung verfügbar.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--text-secondary)]">
        Die Bedingungen dienen als Hinweis. Die Auswahl wird nicht gegen Level, Items oder andere Spielfortschritte geprüft.
      </p>
      {evolutionChoices.length > 0 ? (
        <EvolutionChoiceGroup
          title="Entwickeln zu"
          choices={evolutionChoices}
          selectedPokedexId={selectedPokedexId}
          onSelect={onSelect}
          disabled={disabled}
          spriteMode={spriteMode}
        />
      ) : null}
      {preEvolutionChoices.length > 0 ? (
        <EvolutionChoiceGroup
          title="Vorstufe wählen"
          choices={preEvolutionChoices}
          selectedPokedexId={selectedPokedexId}
          onSelect={onSelect}
          disabled={disabled}
          spriteMode={spriteMode}
        />
      ) : null}
    </div>
  );
}

function EvolutionChoiceGroup({
  title,
  choices,
  selectedPokedexId,
  onSelect,
  disabled,
  spriteMode,
}: {
  title: string;
  choices: AdminEvolutionChoice[];
  selectedPokedexId: number | null;
  onSelect: (pokedexId: number) => void;
  disabled: boolean;
  spriteMode: 'static' | 'animated';
}) {
  return (
    <div role="radiogroup" aria-label={title} className="space-y-2">
      <h3 className="mb-2 font-[var(--font-display)] text-sm font-black uppercase tracking-wide text-[var(--foreground)]">
        {title}
      </h3>
      {choices.map((choice) => {
        const selected = selectedPokedexId === choice.pokemon.pokedexId;
        const spriteUrl = getSpriteUrl(choice.pokemon, spriteMode);
        return (
          <button
            key={`${choice.direction}-${choice.pokemon.pokedexId}`}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onSelect(choice.pokemon.pokedexId)}
            className={`flex min-h-20 w-full items-center gap-3 border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] disabled:opacity-50 ${selected
              ? 'border-[var(--brand-blue)] bg-blue-500/10'
              : 'border-[var(--border-default)] bg-[var(--background-secondary)] hover:border-[var(--brand-blue)]'
            }`}
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center">
              {spriteUrl ? (
                <Image
                  src={spriteUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                  unoptimized={spriteMode === 'animated' && Boolean(choice.pokemon.spriteGifUrl)}
                />
              ) : (
                <span className="text-xs font-bold text-[var(--text-tertiary)]">
                  #{choice.pokemon.pokedexId}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm text-[var(--foreground)]">
                {choice.pokemon.displayName || choice.pokemon.nameGerman || choice.pokemon.name}
              </strong>
              <span className="text-xs text-[var(--text-tertiary)]">#{choice.pokemon.pokedexId}</span>
              {choice.conditions.length > 0 ? (
                <span className="mt-1.5 flex flex-wrap gap-1">
                  {choice.conditions.map((condition, index) => (
                    <span
                      key={`${condition.trigger}-${condition.label}-${index}`}
                      className="border border-[var(--border-default)] bg-[var(--card-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]"
                    >
                      {condition.label}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="mt-1 block text-xs text-[var(--text-secondary)]">Keine Bedingung angegeben</span>
              )}
            </span>
            <span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white' : 'border-[var(--border-default)]'}`}>
              {selected ? '✓' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
