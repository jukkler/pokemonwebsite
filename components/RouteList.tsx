/**
 * Routen-Liste Komponente
 * Zeigt alle Routen mit den Encounters der Spieler an
 */

'use client';

import { useState } from 'react';
import PokemonCard from './PokemonCard';
import PokemonStatsCard from './PokemonStatsCard';
import EvolutionMenu from './EvolutionMenu';
import { Button, Dialog, DialogActions, FormField, Select, Textarea } from './ui';
import { useEvolutionMenu } from '@/lib/hooks/useEvolutionMenu';
import { useOutsideClick } from '@/lib/hooks/useOutsideClick';
import { calculateAverageStats, filterPokemonBySearch } from '@/lib/team-utils';
import { parseTypes } from '@/lib/typeEffectiveness';
import { fetchJson } from '@/lib/fetchJson';
import { getErrorMessage } from '@/lib/component-utils';
import type { EncounterWithMeta, PlayerBase, PokemonListItem } from '@/lib/types';

// =============================================================================
// Types
// =============================================================================

interface Route {
  id: number;
  name: string;
  order: number;
  encounters: EncounterWithMeta[];
}

interface RouteListProps {
  routes: Route[];
  players: PlayerBase[];
  isAdmin?: boolean;
  onTeamUpdate?: () => void;
  pokemon?: PokemonListItem[];
}

// =============================================================================
// Sub-Komponenten
// =============================================================================

interface RouteHeaderProps {
  route: Route;
  isInactive: boolean;
  isKnockedOut: boolean;
  isNotCaught: boolean;
  koInfo: EncounterWithMeta | null;
  notCaughtInfo: EncounterWithMeta | null;
  currentSlot: number | null;
  routeAverage: { total: number } | null;
}

function RouteHeader({
  route,
  isInactive,
  isKnockedOut,
  isNotCaught,
  koInfo,
  notCaughtInfo,
  currentSlot,
  routeAverage,
}: RouteHeaderProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <h3 className={`text-2xl font-semibold ${isInactive ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
        {route.name}
      </h3>
      
      {isKnockedOut && koInfo && (
        <span className="text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-full font-medium border border-red-200">
          💀 K.O. durch {koInfo.koCausedBy}
        </span>
      )}
      
      {isNotCaught && notCaughtInfo && (
        <span className="text-sm bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full font-medium border border-yellow-200">
          ⚠️ Nicht gefangen durch {notCaughtInfo.notCaughtBy}
        </span>
      )}
      
      {currentSlot && !isInactive && (
        <span className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium border border-green-200">
          Im Team (Slot {currentSlot})
        </span>
      )}
      
      {routeAverage && !isInactive && (
        <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium border border-blue-200">
          ⌀ Gesamt-BP: {routeAverage.total}
        </span>
      )}
    </div>
  );
}

interface StatusInfoBoxProps {
  type: 'ko' | 'notCaught';
  info: EncounterWithMeta;
}

function StatusInfoBox({ type, info }: StatusInfoBoxProps) {
  const isKo = type === 'ko';
  const colors = isKo 
    ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-', icon: '💀' }
    : { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-', icon: '⚠️' };

  return (
    <div className={`mb-4 ${colors.bg} border ${colors.border} rounded-lg p-3 text-sm`}>
      <div className="flex items-start gap-2">
        <span className={`${colors.text}700 font-bold`}>{colors.icon}</span>
        <div className="flex-1">
          <p className={`${colors.text}900 font-bold`}>
            {isKo ? 'Diese Route ist K.O.' : 'Auf dieser Route wurde nicht gefangen'}
          </p>
          <p className={`${colors.text}700 mt-1`}>
            <strong>Verursacher:</strong> {isKo ? info.koCausedBy : info.notCaughtBy}
          </p>
          <p className={`${colors.text}700`}>
            <strong>Grund:</strong> {isKo ? info.koReason : info.notCaughtReason}
          </p>
          {(isKo ? info.koDate : info.notCaughtDate) && (
            <p className={`${colors.text}600 text-xs mt-1`}>
              {new Date((isKo ? info.koDate : info.notCaughtDate)!).toLocaleString('de-DE')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface PokemonSearchInputProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filteredPokemon: PokemonListItem[];
  onSelect: (pokemonId: number) => void;
  isAdding: boolean;
}

function PokemonSearchInput({
  searchValue,
  onSearchChange,
  filteredPokemon,
  onSelect,
  isAdding,
}: PokemonSearchInputProps) {
  return (
    <div className="relative min-w-[160px]">
      <input
        type="text"
        placeholder="Pokémon suchen..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        disabled={isAdding}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      
      {searchValue && filteredPokemon.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredPokemon.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              disabled={isAdding}
              className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition flex items-center gap-2 disabled:opacity-50"
            >
              <span className="text-gray-500">#{p.pokedexId}</span>
              <span className="font-medium">{p.nameGerman || p.name}</span>
            </button>
          ))}
        </div>
      )}
      
      {searchValue && filteredPokemon.length === 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-500">Kein Pokémon gefunden</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Haupt-Komponente
// =============================================================================

export default function RouteList({
  routes,
  players,
  isAdmin = false,
  onTeamUpdate,
  pokemon = [],
}: RouteListProps) {
  // State
  const [addingToTeam, setAddingToTeam] = useState<Record<number, boolean>>({});
  const [processing, setProcessing] = useState(false);
  const [addPokemonSearch, setAddPokemonSearch] = useState<Record<string, string>>({});
  const [addingPokemon, setAddingPokemon] = useState<Record<string, boolean>>({});
  
  // Dialog State
  const [koDialogOpen, setKoDialogOpen] = useState(false);
  const [notCaughtDialogOpen, setNotCaughtDialogOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [koCausedBy, setKoCausedBy] = useState('');
  const [koReason, setKoReason] = useState('');
  const [notCaughtBy, setNotCaughtBy] = useState('');
  const [notCaughtReason, setNotCaughtReason] = useState('');

  // Evolution-Hook
  const evolution = useEvolutionMenu(onTeamUpdate);
  useOutsideClick(evolution.menuRef, evolution.closeMenu, evolution.openEncounterId !== null);

  // Ermittle belegte Slots
  const usedSlots: Record<number, { routeId: number; routeName: string }> = {};
  routes.forEach((route) => {
    if (route.encounters.length > 0 && route.encounters[0].teamSlot) {
      usedSlots[route.encounters[0].teamSlot] = { routeId: route.id, routeName: route.name };
    }
  });

  // ==========================================================================
  // Handler
  // ==========================================================================

  const handleAddToTeam = async (routeId: number, slot: number) => {
    setAddingToTeam({ ...addingToTeam, [routeId]: true });
    try {
      await fetchJson(`/api/admin/routes/${routeId}/set-team-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlot: slot === 0 ? null : slot }),
      });
      onTeamUpdate?.();
    } catch (error) {
      alert(`Fehler beim Aktualisieren des Teams: ${getErrorMessage(error)}`);
    } finally {
      setAddingToTeam({ ...addingToTeam, [routeId]: false });
    }
  };

  const handleKnockout = async () => {
    if (!selectedRouteId || !koCausedBy.trim() || !koReason.trim()) {
      alert('Bitte Verursacher und Grund angeben');
      return;
    }
    setProcessing(true);
    try {
      await fetchJson(`/api/admin/routes/${selectedRouteId}/knockout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ causedBy: koCausedBy, reason: koReason }),
      });
      setKoDialogOpen(false);
      onTeamUpdate?.();
    } catch (error) {
      alert(`Fehler beim K.O.-Eintrag: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async (routeId: number, type: 'ko' | 'notCaught') => {
    if (!confirm('Möchtest du diese Route wirklich reaktivieren?')) return;
    setProcessing(true);
    try {
      const endpoint = type === 'ko' ? 'knockout' : 'notcaught';
      await fetchJson(`/api/admin/routes/${routeId}/${endpoint}`, { method: 'DELETE' });
      onTeamUpdate?.();
    } catch (error) {
      alert(`Fehler beim Reaktivieren: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleNotCaught = async () => {
    if (!selectedRouteId || !notCaughtBy.trim()) {
      alert('Bitte Verursacher angeben');
      return;
    }
    setProcessing(true);
    try {
      await fetchJson(`/api/admin/routes/${selectedRouteId}/notcaught`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ causedBy: notCaughtBy.trim(), reason: notCaughtReason.trim() || null }),
      });
      setNotCaughtDialogOpen(false);
      setNotCaughtBy('');
      setNotCaughtReason('');
      onTeamUpdate?.();
    } catch (error) {
      alert(`Fehler beim Nicht-gefangen-Eintrag: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddPokemon = async (routeId: number, playerId: number, pokemonId: number) => {
    const key = `${routeId}-${playerId}`;
    setAddingPokemon({ ...addingPokemon, [key]: true });
    try {
      await fetchJson('/api/admin/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId, playerId, pokemonId }),
      });
      setAddPokemonSearch({ ...addPokemonSearch, [key]: '' });
      onTeamUpdate?.();
    } catch (error) {
      alert(`Fehler beim Hinzufügen: ${getErrorMessage(error)}`);
    } finally {
      setAddingPokemon({ ...addingPokemon, [key]: false });
    }
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  if (routes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          Noch keine Routen vorhanden. Admin kann Routen im Admin-Panel hinzufügen.
        </p>
      </div>
    );
  }

  const playerOptions = players.map((p) => ({ value: p.name, label: p.name }));

  return (
    <>
      <div className="space-y-6">
        {routes.map((route) => {
          const currentSlot = route.encounters[0]?.teamSlot ?? null;
          const routeAverage = calculateAverageStats(route.encounters);
          const isKnockedOut = route.encounters[0]?.isKnockedOut ?? false;
          const isNotCaught = route.encounters[0]?.isNotCaught ?? false;
          const isInactive = isKnockedOut || isNotCaught;
          const koInfo = isKnockedOut ? route.encounters[0] : null;
          const notCaughtInfo = isNotCaught ? route.encounters[0] : null;

          // Für konsistente Höhe
          const maxTypesInRoute = route.encounters.length > 0
            ? Math.max(...route.encounters.map((e) => parseTypes(e.pokemon.types).length))
            : 1;
          const minHeight = maxTypesInRoute === 2 ? 'min-h-[240px]' : 'min-h-[220px]';

          return (
            <div
              key={route.id}
              className={`bg-white rounded-xl shadow-md p-6 border border-gray-200 ${isInactive ? 'opacity-60 bg-gray-50' : ''}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
                <RouteHeader
                  route={route}
                  isInactive={isInactive}
                  isKnockedOut={isKnockedOut}
                  isNotCaught={isNotCaught}
                  koInfo={koInfo}
                  notCaughtInfo={notCaughtInfo}
                  currentSlot={currentSlot}
                  routeAverage={routeAverage}
                />

                {/* Admin-Aktionen */}
                {isAdmin && route.encounters.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {isKnockedOut ? (
                      <button
                        onClick={() => handleReactivate(route.id, 'ko')}
                        disabled={processing}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition text-sm disabled:opacity-50"
                      >
                        🔄 Reaktivieren
                      </button>
                    ) : isNotCaught ? (
                      <button
                        onClick={() => handleReactivate(route.id, 'notCaught')}
                        disabled={processing}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition text-sm disabled:opacity-50"
                      >
                        🔄 Reaktivieren
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRouteId(route.id);
                            setKoCausedBy('');
                            setKoReason('');
                            setKoDialogOpen(true);
                          }}
                          disabled={processing}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition text-sm disabled:opacity-50"
                        >
                          💀 K.O.
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRouteId(route.id);
                            setNotCaughtBy('');
                            setNotCaughtReason('');
                            setNotCaughtDialogOpen(true);
                          }}
                          disabled={processing}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition text-sm disabled:opacity-50"
                        >
                          ⚠️ Nicht gefangen
                        </button>
                      </>
                    )}

                    {/* Team-Slots */}
                    {!isInactive && (
                      <>
                        {currentSlot ? (
                          <button
                            onClick={() => handleAddToTeam(route.id, 0)}
                            disabled={addingToTeam[route.id]}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition text-sm disabled:opacity-50"
                          >
                            {addingToTeam[route.id] ? '...' : 'Aus Team entfernen'}
                          </button>
                        ) : (
                          <>
                            <span className="text-sm text-gray-600">Ins Team:</span>
                            {[1, 2, 3, 4, 5, 6].map((slot) => {
                              const isUsedByOther = usedSlots[slot] && usedSlots[slot].routeId !== route.id;
                              return (
                                <button
                                  key={slot}
                                  onClick={() => handleAddToTeam(route.id, slot)}
                                  disabled={addingToTeam[route.id] || isUsedByOther}
                                  className={`px-3 py-1 rounded-md transition text-sm ${
                                    isUsedByOther
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                                  }`}
                                  title={isUsedByOther ? `Slot ${slot} belegt von "${usedSlots[slot].routeName}"` : `Zu Slot ${slot}`}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Status-Info */}
              {isKnockedOut && koInfo && <StatusInfoBox type="ko" info={koInfo} />}
              {isNotCaught && notCaughtInfo && <StatusInfoBox type="notCaught" info={notCaughtInfo} />}

              {/* Encounters */}
              <div className="flex flex-wrap items-start gap-6">
                {players.map((player) => {
                  const playerEncounters = route.encounters.filter((e) => e.player.id === player.id);
                  const hasEncounter = playerEncounters.length > 0;
                  const key = `${route.id}-${player.id}`;
                  const searchValue = addPokemonSearch[key] || '';
                  const filteredPokemon = filterPokemonBySearch(pokemon, searchValue);
                  const isAdding = addingPokemon[key] || false;

                  return (
                    <div key={player.id} className="flex-shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                        <h4 className="font-semibold text-lg">{player.name}</h4>
                      </div>

                      {hasEncounter ? (
                        <div className="flex flex-wrap items-start gap-3 md:gap-2">
                          {playerEncounters.map((encounter) => (
                            <div key={encounter.id} className="flex flex-col w-[140px] flex-shrink-0">
                              <div className={`relative group flex-1 ${minHeight}`}>
                                <div
                                  className={`h-full ${minHeight} ${isAdmin && !isInactive ? 'cursor-pointer' : ''}`}
                                  onClick={() => {
                                    if (isAdmin && !isInactive) {
                                      evolution.openMenu(encounter.id, encounter.pokemon.pokedexId);
                                    }
                                  }}
                                >
                                  <PokemonCard pokemon={encounter.pokemon} nickname={encounter.nickname} size="small" />
                                </div>

                                {/* Evolution-Menü */}
                                {isAdmin && evolution.openEncounterId === encounter.id && (
                                  <EvolutionMenu
                                    evolutionData={evolution.evolutionData}
                                    isLoading={evolution.isLoading}
                                    isEvolving={evolution.isEvolving}
                                    onEvolve={(targetId) => evolution.evolve(encounter.id, targetId)}
                                    menuRef={evolution.menuRef}
                                    className="absolute z-30 top-full left-0 mt-2"
                                  />
                                )}
                              </div>
                              
                              <PokemonStatsCard pokemon={encounter.pokemon} />
                            </div>
                          ))}
                        </div>
                      ) : isAdmin ? (
                        <PokemonSearchInput
                          searchValue={searchValue}
                          onSearchChange={(v) => setAddPokemonSearch({ ...addPokemonSearch, [key]: v })}
                          filteredPokemon={filteredPokemon}
                          onSelect={(pokemonId) => handleAddPokemon(route.id, player.id, pokemonId)}
                          isAdding={isAdding}
                        />
                      ) : (
                        <p className="text-gray-400 text-sm italic min-w-[160px]">Noch kein Pokémon</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* K.O.-Dialog */}
      <Dialog
        isOpen={koDialogOpen}
        onClose={() => setKoDialogOpen(false)}
        title="Route K.O. setzen"
        titleIcon="💀"
        titleColor="text-red-700"
        description="Alle Pokémon dieser Route werden K.O. gesetzt und aus dem Team entfernt."
        actions={
          <DialogActions
            onCancel={() => setKoDialogOpen(false)}
            onConfirm={handleKnockout}
            confirmText="💀 K.O. setzen"
            confirmVariant="danger"
            isLoading={processing}
            disabled={!koCausedBy.trim() || !koReason.trim()}
          />
        }
      >
        <FormField label="Verursacher (Spieler)" required>
          <Select
            value={koCausedBy}
            onChange={(e) => setKoCausedBy(e.target.value)}
            options={playerOptions}
            placeholder="-- Spieler auswählen --"
            focusColor="focus:ring-red-500"
            disabled={processing}
          />
        </FormField>
        <FormField label="Grund des Ausscheidens" required>
          <Textarea
            value={koReason}
            onChange={(e) => setKoReason(e.target.value)}
            placeholder="z.B. Verloren gegen Arena-Leiter Veit"
            rows={3}
            focusColor="focus:ring-red-500"
            disabled={processing}
          />
        </FormField>
      </Dialog>

      {/* Nicht-gefangen-Dialog */}
      <Dialog
        isOpen={notCaughtDialogOpen}
        onClose={() => setNotCaughtDialogOpen(false)}
        title="Route als Nicht gefangen markieren"
        titleIcon="⚠️"
        titleColor="text-yellow-700"
        description="Diese Route wird als Nicht gefangen markiert und aus dem Team entfernt."
        actions={
          <DialogActions
            onCancel={() => setNotCaughtDialogOpen(false)}
            onConfirm={handleNotCaught}
            confirmText="⚠️ Als Nicht gefangen markieren"
            confirmVariant="warning"
            isLoading={processing}
            disabled={!notCaughtBy.trim()}
          />
        }
      >
        <FormField label="Verursacher (Spieler)" required>
          <Select
            value={notCaughtBy}
            onChange={(e) => setNotCaughtBy(e.target.value)}
            options={playerOptions}
            placeholder="-- Spieler auswählen --"
            focusColor="focus:ring-yellow-500"
            disabled={processing}
          />
        </FormField>
        <FormField label="Grund (optional)">
          <Textarea
            value={notCaughtReason}
            onChange={(e) => setNotCaughtReason(e.target.value)}
            placeholder="z.B. Vergessen zu fangen, zu schwach, nur Tentacha"
            rows={3}
            focusColor="focus:ring-yellow-500"
            disabled={processing}
          />
        </FormField>
      </Dialog>
    </>
  );
}
