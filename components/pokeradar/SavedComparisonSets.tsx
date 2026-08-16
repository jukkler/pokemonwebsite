'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  SavedComparisonSetV2,
  TeamComparisonSelection,
} from '@/components/pokeradar/team-comparison-types';
import {
  createSavedComparisonSet,
  LEGACY_TEAM_SNAPSHOTS_STORAGE_KEY,
  MAX_SAVED_COMPARISON_SETS,
  parseSavedComparisonSets,
  SAVED_COMPARISON_SETS_STORAGE_KEY,
  serializeSavedComparisonSets,
} from '@/lib/saved-comparison-sets';

export interface SavedComparisonSetsProps {
  currentSelection: TeamComparisonSelection;
  onLoad: (set: SavedComparisonSetV2) => void;
  storageKey?: string;
  legacyStorageKey?: string;
  className?: string;
}

function createSetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `comparison-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatSetDate(createdAt: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(createdAt));
}

export default function SavedComparisonSets({
  currentSelection,
  onLoad,
  storageKey = SAVED_COMPARISON_SETS_STORAGE_KEY,
  legacyStorageKey = LEGACY_TEAM_SNAPSHOTS_STORAGE_KEY,
  className = '',
}: SavedComparisonSetsProps) {
  const [sets, setSets] = useState<SavedComparisonSetV2[]>([]);
  const [label, setLabel] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      const parsed = parseSavedComparisonSets(
        window.localStorage.getItem(storageKey),
        window.localStorage.getItem(legacyStorageKey),
        new Date().toISOString(),
      );
      setSets(parsed.sets);
      if (parsed.migratedLegacy) {
        try {
          window.localStorage.setItem(
            storageKey,
            serializeSavedComparisonSets(parsed.sets),
          );
          window.localStorage.removeItem(legacyStorageKey);
        } catch {
          setStorageError(
            'Die bisherigen Teamstände wurden gelesen, konnten aber noch nicht dauerhaft migriert werden.',
          );
        }
      }
    } catch {
      setSets([]);
      setStorageError('Gespeicherte Vergleichssets konnten nicht gelesen werden.');
    } finally {
      setHydrated(true);
    }
  }, [legacyStorageKey, storageKey]);

  const suggestedLabel = useMemo(
    () => currentSelection.sourceLabel || `Vergleich ${sets.length + 1}`,
    [currentSelection.sourceLabel, sets.length],
  );

  const persist = (nextSets: SavedComparisonSetV2[]) => {
    try {
      window.localStorage.setItem(
        storageKey,
        serializeSavedComparisonSets(nextSets),
      );
      setStorageError('');
      return true;
    } catch {
      setStorageError('Vergleichssets konnten nicht lokal gespeichert werden.');
      return false;
    }
  };

  const saveCurrentSelection = () => {
    if (
      !hydrated ||
      sets.length >= MAX_SAVED_COMPARISON_SETS ||
      currentSelection.pokemonIds.length === 0
    ) {
      return;
    }

    const set = createSavedComparisonSet(
      currentSelection,
      label.trim() || suggestedLabel,
      createSetId(),
      new Date().toISOString(),
    );
    if (!set) return;

    const nextSets = [...sets, set];
    if (persist(nextSets)) {
      setSets(nextSets);
      setLabel('');
    }
  };

  const deleteSet = (setId: string) => {
    const nextSets = sets.filter((set) => set.id !== setId);
    if (persist(nextSets)) setSets(nextSets);
  };

  const canSave =
    hydrated &&
    currentSelection.pokemonIds.length > 0 &&
    sets.length < MAX_SAVED_COMPARISON_SETS;

  return (
    <section
      aria-labelledby="saved-comparisons-heading"
      className={`p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="saved-comparisons-heading" className="text-lg font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">
            Vergleichssets
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            Speichere bis zu acht beliebige Auswahlen lokal in diesem Browser.
          </p>
        </div>
        <span className="app-status shrink-0 tabular-nums">
          {sets.length}/{MAX_SAVED_COMPARISON_SETS}
        </span>
      </div>

      {sets.length > 0 ? (
        <ol className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
          {sets.map((set) => (
            <li
              key={set.id}
              className="border-b border-[var(--border-default)] bg-[var(--background-secondary)] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]" title={set.label}>
                    {set.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    {set.pokemonIds.length} Pokémon · {formatSetDate(set.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSet(set.id)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-bold text-red-600 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  aria-label={`${set.label} löschen`}
                  title="Löschen"
                >
                  ×
                </button>
              </div>
              <button
                type="button"
                onClick={() => onLoad(set)}
                className="app-action mt-2 min-h-11 w-full"
              >
                In Vergleich laden
              </button>
            </li>
          ))}
        </ol>
      ) : hydrated ? (
        <p className="mt-4 border border-dashed border-[var(--border-default)] bg-[var(--background-secondary)] p-3 text-sm text-[var(--text-secondary)]">
          Noch kein Vergleichsset gespeichert.
        </p>
      ) : (
        <div className="mt-4 h-20 animate-pulse bg-[var(--background-tertiary)]" aria-label="Vergleichssets werden geladen" />
      )}

      <div className="mt-4 border-t border-[var(--border-default)] pt-4">
        <label className="block text-sm font-semibold text-[var(--foreground)]">
          Name des Vergleichssets
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={suggestedLabel}
            maxLength={80}
            disabled={!hydrated || sets.length >= MAX_SAVED_COMPARISON_SETS}
            className="mt-1.5 min-h-11 w-full border border-[var(--border-default)] bg-[var(--background-secondary)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
        <button
          type="button"
          onClick={saveCurrentSelection}
          disabled={!canSave}
          className="app-action app-action-primary mt-2 min-h-11 w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          Aktuelle Auswahl speichern
        </button>
        {sets.length >= MAX_SAVED_COMPARISON_SETS ? (
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            Lösche ein Vergleichsset, um ein neues zu speichern.
          </p>
        ) : null}
        {storageError ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-300" role="alert">
            {storageError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
