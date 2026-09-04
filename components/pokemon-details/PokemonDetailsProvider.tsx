'use client';

import dynamic from 'next/dynamic';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import type { PokemonDetailsResponse } from '@/lib/pokemon-details';

const PokemonDetailsDialog = dynamic(() => import('./PokemonDetailsDialog'), {
  ssr: false,
  loading: () => null,
});

export interface PokemonDetailsTarget {
  pokedexId: number;
  displayName?: string | null;
  name?: string | null;
  nameGerman?: string | null;
  spriteUrl?: string | null;
  spriteGifUrl?: string | null;
  types?: string[];
}

interface PokemonDetailsContextValue {
  openPokemonDetails: (
    pokemon: PokemonDetailsTarget,
    trigger?: HTMLElement | null,
  ) => void;
  closePokemonDetails: () => void;
}

interface PokemonDetailsProviderProps {
  children: ReactNode;
  /** Schlüssel der Edition des aktuellen Runs, z. B. `black2`. */
  gameVersionKey?: string | null;
  /** Lesbarer Name für den Ladezustand; die API bleibt die Datenquelle. */
  gameVersionName?: string | null;
}

const PokemonDetailsContext = createContext<PokemonDetailsContextValue | null>(null);
const responseCache = new Map<string, PokemonDetailsResponse>();

function getRequestUrl(pokedexId: number, gameVersionKey?: string | null) {
  const query = gameVersionKey
    ? `?gameVersion=${encodeURIComponent(gameVersionKey)}`
    : '';
  return `/api/pokemon/${pokedexId}/details${query}`;
}

function getTargetName(target: PokemonDetailsTarget) {
  return target.displayName || target.nameGerman || target.name || `Pokémon #${target.pokedexId}`;
}

export function PokemonDetailsProvider({
  children,
  gameVersionKey,
  gameVersionName,
}: PokemonDetailsProviderProps) {
  const [target, setTarget] = useState<PokemonDetailsTarget | null>(null);
  const [details, setDetails] = useState<PokemonDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const triggerRef = useRef<HTMLElement | null>(null);

  const closePokemonDetails = useCallback(() => {
    const trigger = triggerRef.current;
    setTarget(null);
    setDetails(null);
    setLoading(false);
    setError(null);
    triggerRef.current = null;
    window.requestAnimationFrame(() => trigger?.focus());
  }, []);

  const openPokemonDetails = useCallback((
    pokemon: PokemonDetailsTarget,
    trigger?: HTMLElement | null,
  ) => {
    const cached = responseCache.get(getRequestUrl(pokemon.pokedexId, gameVersionKey));
    triggerRef.current = trigger ?? (document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null);
    setTarget(pokemon);
    setDetails(cached ?? null);
    setLoading(!cached);
    setError(null);
  }, [gameVersionKey]);

  useEffect(() => {
    if (!target) return;

    const requestUrl = getRequestUrl(target.pokedexId, gameVersionKey);
    const cached = responseCache.get(requestUrl);
    if (cached) return;

    const controller = new AbortController();

    fetch(requestUrl, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(body || `Die Pokémon-Daten konnten nicht geladen werden (${response.status}).`);
        }
        return response.json() as Promise<PokemonDetailsResponse>;
      })
      .then(response => {
        responseCache.set(requestUrl, response);
        setDetails(response);
        setError(null);
      })
      .catch(reason => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : 'Die Pokémon-Daten konnten nicht geladen werden.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [gameVersionKey, requestVersion, target]);

  const contextValue = useMemo<PokemonDetailsContextValue>(() => ({
    openPokemonDetails,
    closePokemonDetails,
  }), [closePokemonDetails, openPokemonDetails]);

  return (
    <PokemonDetailsContext.Provider value={contextValue}>
      {children}
      {target ? (
        <PokemonDetailsDialog
          target={target}
          targetName={getTargetName(target)}
          details={details}
          loading={loading}
          error={error}
          gameVersionName={gameVersionName}
          onClose={closePokemonDetails}
          onRetry={() => {
            setDetails(null);
            setLoading(true);
            setError(null);
            setRequestVersion(version => version + 1);
          }}
        />
      ) : null}
    </PokemonDetailsContext.Provider>
  );
}

export function usePokemonDetails(): PokemonDetailsContextValue {
  const context = useContext(PokemonDetailsContext);
  if (!context) {
    throw new Error('usePokemonDetails muss innerhalb eines PokemonDetailsProvider verwendet werden.');
  }
  return context;
}

interface PokemonDetailsTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  pokemon: PokemonDetailsTarget;
  children: ReactNode;
}

export function PokemonDetailsTrigger({
  pokemon,
  children,
  onClick,
  type = 'button',
  ...buttonProps
}: PokemonDetailsTriggerProps) {
  const { openPokemonDetails } = usePokemonDetails();
  const label = getTargetName(pokemon);

  return (
    <button
      {...buttonProps}
      type={type}
      aria-haspopup="dialog"
      aria-label={buttonProps['aria-label'] ?? `${label}: Details öffnen`}
      onClick={event => {
        onClick?.(event);
        if (!event.defaultPrevented) openPokemonDetails(pokemon, event.currentTarget);
      }}
    >
      {children}
    </button>
  );
}
