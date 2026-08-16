'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import TypeBadge from '@/components/ui/TypeBadge';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { getSpriteUrl } from '@/lib/sprite-utils';
import { allPokemonTypes, getGermanTypeName, parseTypes } from '@/lib/typeEffectiveness';
import type { Pokemon } from '@/lib/types';

const PAGE_SIZE = 40;
const MOBILE_PICKER_QUERY = '(max-width: 1279px)';

export interface PokemonPickerProps {
  pokemon: Pokemon[];
  selected: Pokemon[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (pokemon: Pokemon) => void;
  onRemove: (pokedexId: number) => void;
  onApplyMobile: (pokemon: Pokemon[]) => void;
  maxCount?: number;
}

interface PickerContentProps {
  pokemon: Pokemon[];
  selected: Pokemon[];
  onToggle: (pokemon: Pokemon) => void;
  maxCount: number;
  headingId?: string;
  compactHeader?: boolean;
}

function PickerContent({
  pokemon,
  selected,
  onToggle,
  maxCount,
  headingId,
  compactHeader = false,
}: PickerContentProps) {
  const { spriteMode } = useSpriteMode();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pageStart, setPageStart] = useState(0);
  const searchId = useId();
  const typeId = useId();
  const statusId = useId();
  const selectedIds = useMemo(() => new Set(selected.map((item) => item.pokedexId)), [selected]);
  const selectedPositions = useMemo(
    () => new Map(selected.map((item, index) => [item.pokedexId, index + 1])),
    [selected],
  );

  const filteredPokemon = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('de');

    return pokemon.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLocaleLowerCase('de').includes(normalizedSearch) ||
        item.nameGerman?.toLocaleLowerCase('de').includes(normalizedSearch) ||
        item.pokedexId.toString().includes(normalizedSearch.replace(/^#/, ''));
      const matchesType = typeFilter === 'all' || parseTypes(item.types).includes(typeFilter);

      return matchesSearch && matchesType;
    });
  }, [pokemon, search, typeFilter]);

  const safePageStart = pageStart >= filteredPokemon.length ? 0 : pageStart;
  const visiblePokemon = filteredPokemon.slice(safePageStart, safePageStart + PAGE_SIZE);
  const rangeEnd = Math.min(safePageStart + PAGE_SIZE, filteredPokemon.length);

  const resetPage = () => setPageStart(0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!compactHeader && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id={headingId} className="text-lg font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">
              Pokémon auswählen
            </h2>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              {selected.length} von {maxCount} gewählt
            </p>
          </div>
          <span className="app-status bg-red-600 text-white tabular-nums">
            {selected.length}/{maxCount}
          </span>
        </div>
      )}

      <div className="grid gap-3">
        <div>
          <label htmlFor={searchId} className="sr-only">
            Nach Name oder Pokédex-Nummer suchen
          </label>
          <div className="relative">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m16 16 4 4" />
            </svg>
            <input
              id={searchId}
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPage();
              }}
              placeholder="Name oder #Nummer"
              autoComplete="off"
              className="h-12 w-full border border-[var(--border-default)] bg-[var(--background-secondary)] pl-10 pr-3 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor={typeId} className="sr-only">
            Nach Pokémon-Typ filtern
          </label>
          <select
            id={typeId}
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              resetPage();
            }}
            className="h-11 w-full border border-[var(--border-default)] bg-[var(--background-secondary)] px-3 text-sm font-bold text-[var(--foreground)] outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
          >
            <option value="all">Alle Typen</option>
            {allPokemonTypes.map((type) => (
              <option key={type} value={type}>
                {getGermanTypeName(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p id={statusId} className="my-3 text-xs text-[var(--text-secondary)]" aria-live="polite">
        {filteredPokemon.length === 0
          ? 'Keine Treffer'
          : `${safePageStart + 1}–${rangeEnd} von ${filteredPokemon.length} Treffern`}
      </p>

      <div className="no-scrollbar min-h-0 flex-1 divide-y divide-[var(--border-default)] overflow-y-auto border-y border-[var(--border-default)]" aria-describedby={statusId}>
        {visiblePokemon.map((item) => {
          const displayName = item.nameGerman || item.name;
          const isSelected = selectedIds.has(item.pokedexId);
          const selectionPosition = selectedPositions.get(item.pokedexId);
          const isDisabled = !isSelected && selected.length >= maxCount;
          const spriteUrl = getSpriteUrl(item, spriteMode);
          const types = parseTypes(item.types).slice(0, 2);

          return (
            <button
              key={item.pokedexId}
              type="button"
              onClick={() => onToggle(item)}
              aria-pressed={isSelected}
              aria-label={`${displayName} ${isSelected ? 'aus der Auswahl entfernen' : 'zur Auswahl hinzufügen'}`}
              disabled={isDisabled}
              className={`flex min-h-16 w-full items-center gap-3 border-x px-2.5 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-45 ${
                isSelected
                  ? 'border-red-600 bg-red-500/10'
                  : 'border-[var(--border-default)] bg-[var(--card-bg)] hover:border-red-600/60 hover:bg-[var(--background-secondary)]'
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--background-tertiary)]">
                {spriteUrl ? (
                  <Image
                    src={spriteUrl}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized={spriteMode === 'animated'}
                    className="h-11 w-11 object-contain [image-rendering:pixelated]"
                  />
                ) : (
                  <span aria-hidden="true" className="text-xl text-[var(--text-tertiary)]">◓</span>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="truncate text-sm font-semibold text-[var(--foreground)]">{displayName}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--text-tertiary)]">#{item.pokedexId}</span>
                </span>
                <span
                  className="mt-1 flex gap-1 overflow-hidden"
                  aria-label={`Typen: ${types.map(getGermanTypeName).join(', ')}`}
                >
                  {types.map((type) => (
                    <TypeBadge
                      key={type}
                      type={type}
                      size="sm"
                      showIcon={false}
                      className="!px-1.5 !py-0.5 !text-[10px] hover:!scale-100"
                    />
                  ))}
                </span>
              </span>

              <span
                aria-hidden="true"
                className={`flex h-11 w-11 shrink-0 items-center justify-center border text-sm font-black ${
                  isSelected
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-[var(--border-default)] bg-[var(--background-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                {isSelected ? selectionPosition : '+'}
              </span>
            </button>
          );
        })}

        {visiblePokemon.length === 0 && (
          <div className="border border-dashed border-[var(--border-default)] px-4 py-10 text-center">
            <p className="font-medium text-[var(--foreground)]">Kein Pokémon gefunden</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Versuche einen anderen Namen oder Typ.</p>
          </div>
        )}
      </div>

      {filteredPokemon.length > PAGE_SIZE && (
        <nav className="mt-3 grid grid-cols-2 gap-2" aria-label="Ergebnisse durchblättern">
          <button
            type="button"
            onClick={() => setPageStart(Math.max(0, safePageStart - PAGE_SIZE))}
            disabled={safePageStart === 0}
            className="app-action min-h-11 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Zurück
          </button>
          <button
            type="button"
            onClick={() => setPageStart(safePageStart + PAGE_SIZE)}
            disabled={rangeEnd >= filteredPokemon.length}
            className="app-action app-action-primary min-h-11 disabled:cursor-not-allowed disabled:border-[var(--border-default)] disabled:bg-[var(--background-tertiary)] disabled:text-[var(--text-tertiary)]"
          >
            Mehr laden
          </button>
        </nav>
      )}

      {selected.length >= maxCount && (
        <p className="mt-2 text-center text-xs font-medium text-[var(--text-secondary)]" aria-live="polite">
          Alle {maxCount} Plätze sind belegt. Entferne ein Pokémon, um ein anderes zu wählen.
        </p>
      )}
    </div>
  );
}

interface MobilePickerSheetProps {
  pokemon: Pokemon[];
  selected: Pokemon[];
  maxCount: number;
  onApply: (pokemon: Pokemon[]) => void;
  onClose: () => void;
}

function MobilePickerSheet({ pokemon, selected, maxCount, onApply, onClose }: MobilePickerSheetProps) {
  const [draftIds, setDraftIds] = useState(() => selected.map((item) => item.pokedexId));
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const draftPokemon = useMemo(() => {
    const byId = new Map(pokemon.map((item) => [item.pokedexId, item]));
    return draftIds.map((id) => byId.get(id)).filter((item): item is Pokemon => Boolean(item));
  }, [draftIds, pokemon]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const searchField = dialogRef.current?.querySelector<HTMLInputElement>('input[type="search"]');
    (searchField ?? closeButtonRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const toggleDraft = (item: Pokemon) => {
    setDraftIds((current) => {
      if (current.includes(item.pokedexId)) {
        return current.filter((id) => id !== item.pokedexId);
      }
      return current.length < maxCount ? [...current, item.pokedexId] : current;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end bg-black/55 p-0 backdrop-blur-[2px] xl:hidden"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90dvh] w-full flex-col border border-b-0 border-[var(--border-default)] bg-[var(--card-bg)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-2 h-1 w-11 rounded-full bg-[var(--text-tertiary)]" aria-hidden="true" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">
              Pokémon hinzufügen
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">{draftPokemon.length} von {maxCount} vorgemerkt</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center text-[var(--text-secondary)] transition hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            aria-label="Auswahl schließen und Änderungen verwerfen"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="m7 7 10 10M17 7 7 17" />
            </svg>
          </button>
        </div>

        <PickerContent
          pokemon={pokemon}
          selected={draftPokemon}
          onToggle={toggleDraft}
          maxCount={maxCount}
          compactHeader
        />

        <div className="mt-3 grid grid-cols-[auto_1fr] gap-2 border-t border-[var(--border-default)] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="app-action min-h-12"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => onApply(draftPokemon)}
            className="app-action app-action-primary min-h-12"
          >
            Übernehmen ({draftPokemon.length})
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PokemonPicker({
  pokemon,
  selected,
  isOpen,
  onOpenChange,
  onAdd,
  onRemove,
  onApplyMobile,
  maxCount = 6,
}: PokemonPickerProps) {
  const desktopHeadingId = useId();
  const [isMobileSheetViewport, setIsMobileSheetViewport] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_PICKER_QUERY);
    const updateViewport = () => setIsMobileSheetViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (isOpen && isMobileSheetViewport === false) {
      onOpenChange(false);
    }
  }, [isMobileSheetViewport, isOpen, onOpenChange]);

  const closeMobilePicker = useCallback(() => onOpenChange(false), [onOpenChange]);

  const toggleDesktop = (item: Pokemon) => {
    if (selected.some((candidate) => candidate.pokedexId === item.pokedexId)) {
      onRemove(item.pokedexId);
    } else {
      onAdd(item);
    }
  };

  return (
    <>
      <aside
        aria-labelledby={desktopHeadingId}
        className="app-section sticky top-24 hidden max-h-[calc(100dvh-7rem)] min-h-[34rem] flex-col p-4 xl:flex"
      >
        <PickerContent
          pokemon={pokemon}
          selected={selected}
          onToggle={toggleDesktop}
          maxCount={maxCount}
          headingId={desktopHeadingId}
        />
      </aside>

      {isOpen && isMobileSheetViewport === true && (
        <MobilePickerSheet
          pokemon={pokemon}
          selected={selected}
          maxCount={maxCount}
          onApply={(nextPokemon) => {
            onApplyMobile(nextPokemon);
            onOpenChange(false);
          }}
          onClose={closeMobilePicker}
        />
      )}
    </>
  );
}
