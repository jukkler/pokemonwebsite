/**
 * Team-Display Komponente
 * Zeigt das aktuelle Team eines Spielers an (6 Slots)
 */

'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import EvolutionMenu from './EvolutionMenu';
import TypeBadge from './ui/TypeBadge';
import PokemonStatPopover from './dashboard/PokemonStatPopover';
import EncounterActionMenu, {
  type EncounterActionMenuTarget,
} from './admin/EncounterActionMenu';
import RouteLinkActionMenu, {
  type RouteLinkActionMenuTarget,
} from './admin/RouteLinkActionMenu';
import { getEncounterRouteLinkState } from './admin/route-link-ui';
import { useEvolutionMenu } from '@/lib/hooks/useEvolutionMenu';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { calculateAverageStats, countPlayerStats, createTeamSlots } from '@/lib/team-utils';
import { parseTypes } from '@/lib/typeEffectiveness';
import { buildPokeradarHref } from '@/lib/pokeradar-team-data';
import { mutateEncounterLink } from '@/lib/encounter-link-admin';
import type { TeamEncounter, TooltipItem, PokemonListItem } from '@/lib/types';

function buildTeamComparisonHref(playerName: string, members: TeamEncounter[]) {
  return buildPokeradarHref(members.map((member) => ({
    pokedexId: member.pokemon.pokedexId,
    teamSlot: member.teamSlot,
    status: 'team',
  })), {
    source: 'team',
    sourceLabel: `Team von ${playerName}`,
  });
}

// =============================================================================
// Sub-Komponenten
// =============================================================================

interface TooltipProps {
  items: TooltipItem[];
  children: React.ReactNode;
}

function Tooltip({ items, children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2,
    });
  }, []);

  useEffect(() => {
    if (isOpen || isHovered) {
      updatePosition();
    }
  }, [isOpen, isHovered, updatePosition]);

  // Schließe bei Klick außerhalb
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  if (items.length === 0) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <div className="bg-[var(--card-bg-elevated)] text-[var(--foreground)] text-sm rounded-lg shadow-xl border border-[var(--border-default)] p-3 max-w-xs max-h-64 overflow-y-auto">
      {isOpen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="absolute top-2 right-2 text-[var(--foreground)] hover:text-[var(--text-secondary)] transition"
          aria-label="Tooltip schliessen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className={`space-y-2 ${isOpen ? 'pr-6' : ''}`}>
        {items.map((item, index) => (
          <div key={index}>
            <div className="font-semibold">{item.routeName}:</div>
            <div className="ml-2 text-[var(--text-secondary)]">{item.pokemonNames.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const canUsePortal = typeof document !== 'undefined';
  const showTooltip = (isOpen || isHovered) && canUsePortal && position;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsOpen(!isOpen)}
      className="cursor-help"
    >
      {children}
      {showTooltip && createPortal(
        <div
          className="absolute z-[9998]"
          style={{
            top: position.top,
            left: position.left,
            transform: 'translate(-50%, -100%) translateY(-8px)',
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        >
          {tooltipContent}
        </div>,
        document.body,
      )}
    </div>
  );
}

// =============================================================================
// Haupt-Komponente
// =============================================================================

interface TeamRouteEncounter extends Omit<EncounterActionMenuTarget, 'route'> {
  pokemon: EncounterActionMenuTarget['pokemon'] & {
    types: string;
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
}

interface Route {
  id: number;
  name: string;
  encounters: TeamRouteEncounter[];
}

interface TeamDisplayProps {
  playerId: number;
  playerName: string;
  playerColor: string;
  teamMembers: TeamEncounter[];
  routes: Route[];
  isAdmin?: boolean;
  onUpdated?: () => void | Promise<void>;
  pokemon?: PokemonListItem[];
}

export default function TeamDisplay({
  playerId,
  playerName,
  playerColor,
  teamMembers,
  routes,
  isAdmin = false,
  onUpdated,
  pokemon = [],
}: TeamDisplayProps) {
  // Evolution-Hook
  const evolution = useEvolutionMenu(onUpdated);
  const { spriteMode } = useSpriteMode();
  const [openEmptySlot, setOpenEmptySlot] = useState<number | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Berechnungen
  const slots = createTeamSlots(teamMembers);
  const filledMembers = slots.filter((slot): slot is TeamEncounter => slot !== null);
  const teamAverage = calculateAverageStats(filledMembers);
  const { koCount, notCaughtCount, knockedOutPokemon, notCaughtPokemon } = countPlayerStats(playerName, routes);
  const teamComparisonHref = buildTeamComparisonHref(playerName, filledMembers);
  const expectedPlayerCount = useMemo(
    () => new Set([
      playerId,
      ...routes.flatMap((route) => route.encounters.map((encounter) => encounter.player.id)),
    ]).size,
    [playerId, routes],
  );
  const routeLinks = useMemo<RouteLinkActionMenuTarget[]>(() => routes
    .filter((route) => route.encounters.length > 0)
    .map((route) => ({
      route: { id: route.id, name: route.name },
      expectedPlayerCount,
      encounters: route.encounters.map((encounter): EncounterActionMenuTarget => ({
        ...encounter,
        route: { id: route.id, name: route.name },
      })),
    })), [expectedPlayerCount, routes]);
  const encounterTargets = useMemo(
    () => routeLinks.flatMap((link) => link.encounters),
    [routeLinks],
  );
  const encounterTargetsById = useMemo(
    () => new Map(encounterTargets.map((encounter) => [encounter.id, encounter])),
    [encounterTargets],
  );
  const routeLinksByEncounterId = useMemo(() => {
    const linksByEncounterId = new Map<number, RouteLinkActionMenuTarget>();
    for (const link of routeLinks) {
      for (const encounter of link.encounters) {
        linksByEncounterId.set(encounter.id, link);
      }
    }
    return linksByEncounterId;
  }, [routeLinks]);
  const routeLinkOptions = useMemo(() => routeLinks
    .map((link) => {
      const state = getEncounterRouteLinkState(link);
      const playerEncounter = link.encounters.find(
        (encounter) => encounter.player.id === playerId,
      );
      const isAlreadyInTeam = playerEncounter?.teamSlot !== null && playerEncounter !== undefined;
      const canAssign = Boolean(playerEncounter) && state.canAssignToTeam;
      const disabledReason = !playerEncounter
        ? `${playerName} fehlt in diesem Link`
        : !state.isComplete
          ? `Unvollständig (${state.memberCount}/${state.expectedPlayerCount})`
          : !state.allActive
            ? 'Link muss zuerst reaktiviert werden'
            : null;

      return { link, state, canAssign, disabledReason, isAlreadyInTeam };
    })
    .filter((option) => !option.isAlreadyInTeam), [playerId, playerName, routeLinks]);

  const closeSlotPicker = () => {
    setOpenEmptySlot(null);
    setSelectedRouteId('');
    setAssignError(null);
  };

  const handleAssignToSlot = async (slot: number) => {
    const routeId = Number(selectedRouteId);
    if (!Number.isInteger(routeId) || routeId < 1) return;

    setIsAssigning(true);
    setAssignError(null);
    try {
      await mutateEncounterLink(routeId, { action: 'set-team-slot', teamSlot: slot });
      closeSlotPicker();
      await onUpdated?.();
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : 'Teamplatz konnte nicht gespeichert werden');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div
      className="overflow-visible"
      style={{ '--player-color': playerColor, '--player-accent': playerColor } as React.CSSProperties}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-wide">
          {teamAverage ? <span>{teamAverage.count}/6 im Team</span> : <span>0/6 im Team</span>}
          {teamAverage ? <span className="text-[var(--brand-blue)]">Ø Gesamt-BP {teamAverage.total}</span> : null}
          {koCount > 0 ? (
            <Tooltip items={knockedOutPokemon}>
              <span className="app-status border-red-500 text-red-600">{koCount} K.O.</span>
            </Tooltip>
          ) : null}
          {notCaughtCount > 0 ? (
            <Tooltip items={notCaughtPokemon}>
              <span className="app-status border-amber-500 text-amber-600">{notCaughtCount} nicht gefangen</span>
            </Tooltip>
          ) : null}
        </div>
        {filledMembers.length > 0 ? (
          <Link
            href={teamComparisonHref ?? '/pokeradar'}
            aria-label={`Team von ${playerName} im Vergleich öffnen`}
            className="app-action"
          >
            Im Vergleich öffnen <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 border-l border-t border-[var(--border-default)] sm:grid-cols-3 lg:grid-cols-6">
        {slots.map((member, index) => {
          const spriteUrl = member
            ? spriteMode === 'animated' && member.pokemon.spriteGifUrl
              ? member.pokemon.spriteGifUrl
              : member.pokemon.spriteUrl
            : null;
          const pokemonName = member
            ? member.pokemon.nameGerman || member.pokemon.name
            : null;

          return (
            <div key={index} className="team-display-slot group relative min-h-32 border-b border-r border-[var(--border-default)] p-2.5">
              <span className="absolute left-2 top-1.5 text-[10px] font-black tabular-nums text-[var(--text-tertiary)]">
                {index + 1}
              </span>
              {isAdmin && member && encounterTargetsById.has(member.id) ? (
                <div className="absolute right-1 top-1 z-20">
                  <EncounterActionMenu
                    encounter={encounterTargetsById.get(member.id)!}
                    pokemonOptions={pokemon}
                    compact
                    onUpdated={() => { void onUpdated?.(); }}
                    onDeleted={() => { void onUpdated?.(); }}
                  />
                </div>
              ) : null}

              {member ? (
                <>
                  <PokemonStatPopover
                    pokemon={{
                      ...member.pokemon,
                      nickname: member.nickname,
                      types: parseTypes(member.pokemon.types),
                    }}
                    slotNumber={index + 1}
                    teamAverage={teamAverage?.total ?? null}
                    renderTrigger={(statTriggerProps) => (
                      <button
                        {...statTriggerProps}
                        disabled={!isAdmin && statTriggerProps.disabled}
                        onClick={(event) => {
                          if (isAdmin) {
                            evolution.openMenu(member.id, member.pokemon.pokedexId);
                            return;
                          }
                          statTriggerProps.onClick?.(event);
                        }}
                        className="flex w-full min-w-0 flex-col items-center px-1 pt-2 text-center"
                        aria-label={isAdmin
                          ? `Basiswerte von ${member.nickname || pokemonName} anzeigen oder Entwicklung verwalten`
                          : statTriggerProps['aria-label']}
                      >
                        {spriteUrl ? (
                          <Image
                            src={spriteUrl}
                            alt=""
                            width={56}
                            height={56}
                            className="h-14 w-14 object-contain"
                            unoptimized={spriteMode === 'animated' && Boolean(member.pokemon.spriteGifUrl)}
                          />
                        ) : (
                          <span className="flex h-14 w-14 items-center justify-center text-xs font-bold text-[var(--text-tertiary)]">
                            #{member.pokemon.pokedexId}
                          </span>
                        )}
                        <strong className="mt-1 max-w-full truncate text-xs text-[var(--foreground)]">
                          {member.nickname || pokemonName}
                        </strong>
                        {member.nickname ? <span className="max-w-full truncate text-[10px] text-[var(--text-secondary)]">{pokemonName}</span> : null}
                        <span className="mt-1 flex flex-wrap justify-center gap-1">
                          {parseTypes(member.pokemon.types).map((type) => (
                            <TypeBadge key={type} type={type} size="sm" />
                          ))}
                        </span>
                      </button>
                    )}
                  />

                  {isAdmin && evolution.openEncounterId === member.id ? (
                    <EvolutionMenu
                      evolutionData={evolution.evolutionData}
                      isLoading={evolution.isLoading}
                      isEvolving={evolution.isEvolving}
                      onEvolve={(targetId) => evolution.evolve(member.id, targetId)}
                      onClose={evolution.closeMenu}
                      menuRef={evolution.menuRef}
                      className="absolute left-1/2 top-12 z-50 max-w-[280px] -translate-x-1/2"
                    />
                  ) : null}

                  {member.route.name ? (
                    <div className="mt-2 border-t border-[var(--border-default)] pt-1 text-center">
                      <p className="truncate text-[10px] font-medium text-[var(--text-secondary)]">{member.route.name}</p>
                      {isAdmin && routeLinksByEncounterId.has(member.id) ? (
                        <RouteLinkActionMenu
                          link={routeLinksByEncounterId.get(member.id)!}
                          triggerLabel="Link verwalten"
                          className="mt-1 w-full [&>button]:w-full [&>button]:justify-center"
                          onUpdated={() => { void onUpdated?.(); }}
                          onDeleted={() => { void onUpdated?.(); }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : isAdmin ? (
                openEmptySlot === index + 1 ? (
                  <div className="flex min-h-28 flex-col justify-center gap-2 pt-3">
                    <label htmlFor={`team-slot-${playerId}-${index + 1}`} className="text-[10px] font-bold uppercase tracking-wide">
                      Link für Platz {index + 1}
                    </label>
                    <select
                      id={`team-slot-${playerId}-${index + 1}`}
                      value={selectedRouteId}
                      onChange={(event) => setSelectedRouteId(event.target.value)}
                      disabled={isAssigning || routeLinkOptions.length === 0}
                      className="min-h-10 w-full border border-[var(--border-default)] bg-[var(--card-bg)] px-2 text-xs text-[var(--foreground)]"
                    >
                      <option value="">Link auswählen</option>
                      {routeLinkOptions.map(({ link, state, canAssign, disabledReason }) => (
                        <option key={link.route.id} value={link.route.id} disabled={!canAssign}>
                          {link.route.name} · {state.memberCount}/{state.expectedPlayerCount}
                          {disabledReason ? ` · ${disabledReason}` : state.isTeamSlotMixed ? ' · Plätze reparieren' : ''}
                        </option>
                      ))}
                    </select>
                    {assignError ? <p role="alert" className="text-[10px] text-red-600">{assignError}</p> : null}
                    <div className="grid min-w-0 grid-cols-1 gap-1 2xl:grid-cols-2">
                      <button type="button" onClick={() => void handleAssignToSlot(index + 1)} disabled={isAssigning || !selectedRouteId} className="app-action-primary min-h-9 min-w-0 w-full px-2 text-[10px]">
                        {isAssigning ? 'Speichert…' : 'Hinzufügen'}
                      </button>
                      <button type="button" onClick={closeSlotPicker} disabled={isAssigning} className="app-action min-h-9 min-w-0 w-full px-2 text-[10px]">
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenEmptySlot(index + 1);
                      setSelectedRouteId('');
                      setAssignError(null);
                    }}
                    className="flex min-h-28 w-full items-center justify-center text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--player-color)]"
                  >
                    + Link
                  </button>
                )
              ) : (
                <div className="flex min-h-28 items-center justify-center text-xs font-medium text-[var(--text-tertiary)]">Leer</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
