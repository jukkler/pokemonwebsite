/**
 * Routen-Liste Komponente
 * Zeigt alle Routen mit den Encounters der Spieler an
 */

'use client';

import PokemonCard from './PokemonCard';
import TypeBadge from './ui/TypeBadge';
import Button from './ui/Button';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import {
  parseTypes,
  calculateDefensiveEffectiveness,
} from '@/lib/typeEffectiveness';
import { fetchJson } from '@/lib/fetchJson';
import { getErrorMessage } from '@/lib/component-utils';

// Evolution-Typen
interface EvolutionOption {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  spriteUrl: string | null;
}

interface EvolutionChainResult {
  preEvolutions: EvolutionOption[];
  evolutions: EvolutionOption[];
}

interface Encounter {
  id: number;
  nickname: string | null;
  teamSlot: number | null;
  isKnockedOut: boolean;
  koCausedBy: string | null;
  koReason: string | null;
  koDate: string | null;
  isNotCaught: boolean;
  notCaughtBy: string | null;
  notCaughtReason: string | null;
  notCaughtDate: string | null;
  player: {
    id: number;
    name: string;
    color: string;
  };
  pokemon: {
    pokedexId: number;
    name: string;
    nameGerman: string | null;
    types: string;
    spriteUrl: string | null;
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
  order: number;
  encounters: Encounter[];
}

interface Player {
  id: number;
  name: string;
  color: string;
}

interface Pokemon {
  id: number;
  pokedexId: number;
  name: string;
  nameGerman: string | null;
}

interface RouteListProps {
  routes: Route[];
  players: Player[];
  isAdmin?: boolean;
  onTeamUpdate?: () => void;
  pokemon?: Pokemon[];
}

export default function RouteList({
  routes,
  players,
  isAdmin = false,
  onTeamUpdate,
  pokemon = [],
}: RouteListProps) {
  const [addingToTeam, setAddingToTeam] = useState<{ [key: number]: boolean }>({});
  const [koDialogOpen, setKoDialogOpen] = useState(false);
  const [notCaughtDialogOpen, setNotCaughtDialogOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [koCausedBy, setKoCausedBy] = useState('');
  const [koReason, setKoReason] = useState('');
  const [notCaughtBy, setNotCaughtBy] = useState('');
  const [notCaughtReason, setNotCaughtReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // State für Pokémon-Hinzufügen
  const [addPokemonSearch, setAddPokemonSearch] = useState<{ [key: string]: string }>({});
  const [addingPokemon, setAddingPokemon] = useState<{ [key: string]: boolean }>({});
  
  // State für Evolution-Menü
  const [evolutionMenuOpen, setEvolutionMenuOpen] = useState<number | null>(null); // encounterId
  const [evolutionData, setEvolutionData] = useState<EvolutionChainResult | null>(null);
  const [loadingEvolutions, setLoadingEvolutions] = useState(false);
  const [evolvingPokemon, setEvolvingPokemon] = useState(false);
  const evolutionMenuRef = useRef<HTMLDivElement>(null);

  // Ermittle, welche Slots bereits belegt sind (Map: Slot -> Route)
  const usedSlots: { [slot: number]: { routeId: number; routeName: string } } = {};
  routes.forEach((route) => {
    if (route.encounters.length > 0 && route.encounters[0].teamSlot) {
      const slot = route.encounters[0].teamSlot;
      usedSlots[slot] = { routeId: route.id, routeName: route.name };
    }
  });

  // Berechne Durchschnitt der Basispunkte für eine Route
  const calculateRouteAverage = (route: Route) => {
    if (route.encounters.length === 0) return null;
    
    let totalHP = 0;
    let totalAttack = 0;
    let totalDefense = 0;
    let totalSpAttack = 0;
    let totalSpDefense = 0;
    let totalSpeed = 0;
    let totalBase = 0;

    route.encounters.forEach((encounter) => {
      const p = encounter.pokemon;
      totalHP += p.hp;
      totalAttack += p.attack;
      totalDefense += p.defense;
      totalSpAttack += p.spAttack;
      totalSpDefense += p.spDefense;
      totalSpeed += p.speed;
      totalBase += p.hp + p.attack + p.defense + p.spAttack + p.spDefense + p.speed;
    });

    const count = route.encounters.length;
    return {
      hp: Math.round(totalHP / count),
      attack: Math.round(totalAttack / count),
      defense: Math.round(totalDefense / count),
      spAttack: Math.round(totalSpAttack / count),
      spDefense: Math.round(totalSpDefense / count),
      speed: Math.round(totalSpeed / count),
      total: Math.round(totalBase / count),
    };
  };

  // Route ins Team hinzufügen/entfernen
  const handleAddToTeam = async (routeId: number, slot: number) => {
    setAddingToTeam({ ...addingToTeam, [routeId]: true });

    try {
      await fetchJson(`/api/admin/routes/${routeId}/set-team-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlot: slot === 0 ? null : slot }),
      });

      if (onTeamUpdate) onTeamUpdate();
    } catch (error: unknown) {
      alert(
        `Fehler beim Aktualisieren des Teams: ${getErrorMessage(error)}`
      );
    } finally {
      setAddingToTeam({ ...addingToTeam, [routeId]: false });
    }
  };

  // K.O.-Dialog öffnen
  const openKoDialog = (routeId: number) => {
    setSelectedRouteId(routeId);
    setKoCausedBy('');
    setKoReason('');
    setKoDialogOpen(true);
  };

  // K.O. bestätigen
  const handleKnockout = async () => {
    if (!selectedRouteId) return;
    if (!koCausedBy.trim() || !koReason.trim()) {
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
      if (onTeamUpdate) onTeamUpdate();
    } catch (error: unknown) {
      alert(`Fehler beim K.O.-Eintrag: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  // Reaktivieren
  const handleReactivate = async (routeId: number) => {
    if (!confirm('Möchtest du diese Route wirklich reaktivieren?')) return;

    setProcessing(true);
    try {
      await fetchJson(`/api/admin/routes/${routeId}/knockout`, {
        method: 'DELETE',
      });
      if (onTeamUpdate) onTeamUpdate();
    } catch (error: unknown) {
      alert(`Fehler beim Reaktivieren: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  // Nicht-gefangen-Dialog öffnen
  const openNotCaughtDialog = (routeId: number) => {
    setSelectedRouteId(routeId);
    setNotCaughtBy('');
    setNotCaughtReason('');
    setNotCaughtDialogOpen(true);
  };

  // Nicht-gefangen bestätigen
  const handleNotCaught = async () => {
    if (!selectedRouteId) return;
    if (!notCaughtBy.trim()) {
      alert('Bitte Verursacher angeben');
      return;
    }

    setProcessing(true);
    try {
      await fetchJson(`/api/admin/routes/${selectedRouteId}/notcaught`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          causedBy: notCaughtBy.trim(),
          reason: notCaughtReason.trim() || null,
        }),
      });

      setNotCaughtDialogOpen(false);
      setNotCaughtBy('');
      setNotCaughtReason('');
      if (onTeamUpdate) onTeamUpdate();
    } catch (error: unknown) {
      console.error('Error setting not-caught status:', error);
      alert(
        `Fehler beim Nicht-gefangen-Eintrag: ${getErrorMessage(error)}`
      );
    } finally {
      setProcessing(false);
    }
  };

  // Nicht-gefangen reaktivieren
  const handleReactivateNotCaught = async (routeId: number) => {
    if (!confirm('Möchtest du diese Route wirklich reaktivieren?')) return;

    setProcessing(true);
    try {
      await fetchJson(`/api/admin/routes/${routeId}/notcaught`, {
        method: 'DELETE',
      });
      if (onTeamUpdate) onTeamUpdate();
    } catch (error: unknown) {
      alert(`Fehler beim Reaktivieren: ${getErrorMessage(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  // Pokémon zu einer Route hinzufügen
  const handleAddPokemon = async (routeId: number, playerId: number, pokemonId: number) => {
    const key = `${routeId}-${playerId}`;
    setAddingPokemon({ ...addingPokemon, [key]: true });

    try {
      await fetchJson('/api/admin/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId,
          playerId,
          pokemonId,
        }),
      });
      setAddPokemonSearch({ ...addPokemonSearch, [key]: '' });
      if (onTeamUpdate) onTeamUpdate();
    } catch (error: unknown) {
      alert(`Fehler beim Hinzufügen: ${getErrorMessage(error)}`);
    } finally {
      setAddingPokemon({ ...addingPokemon, [key]: false });
    }
  };

  // Pokémon nach Suchbegriff filtern
  const filterPokemon = (search: string) => {
    if (!search.trim()) return [];
    const searchLower = search.toLowerCase();
    return pokemon
      .filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.nameGerman?.toLowerCase().includes(searchLower) ||
        p.pokedexId.toString().includes(search)
      )
      .slice(0, 8); // Maximal 8 Ergebnisse anzeigen
  };

  // Evolution-Menü öffnen und Daten laden
  const openEvolutionMenu = async (encounterId: number, pokedexId: number) => {
    if (evolutionMenuOpen === encounterId) {
      // Menü schließen wenn bereits offen
      setEvolutionMenuOpen(null);
      setEvolutionData(null);
      return;
    }

    setEvolutionMenuOpen(encounterId);
    setLoadingEvolutions(true);
    setEvolutionData(null);

    try {
      const data = await fetchJson<EvolutionChainResult>(`/api/pokemon/${pokedexId}/evolutions`);
      setEvolutionData(data);
    } catch (error) {
      console.error('Error loading evolutions:', error);
      setEvolutionData({ preEvolutions: [], evolutions: [] });
    } finally {
      setLoadingEvolutions(false);
    }
  };

  // Pokémon entwickeln
  const handleEvolve = async (encounterId: number, targetPokedexId: number) => {
    setEvolvingPokemon(true);
    try {
      await fetchJson(`/api/admin/encounters/${encounterId}/evolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPokedexId }),
      });
      setEvolutionMenuOpen(null);
      setEvolutionData(null);
      if (onTeamUpdate) onTeamUpdate();
    } catch (error) {
      alert(`Fehler beim Entwickeln: ${getErrorMessage(error)}`);
    } finally {
      setEvolvingPokemon(false);
    }
  };

  // Klick außerhalb des Menüs schließt es
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (evolutionMenuRef.current && !evolutionMenuRef.current.contains(event.target as Node)) {
        setEvolutionMenuOpen(null);
        setEvolutionData(null);
      }
    };

    if (evolutionMenuOpen !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [evolutionMenuOpen]);

  if (routes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          Noch keine Routen vorhanden. Admin kann Routen im Admin-Panel hinzufügen.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {routes.map((route) => {
          // Prüfe ob Route bereits im Team ist
          const currentSlot = route.encounters.length > 0 
            ? route.encounters[0].teamSlot 
            : null;
          
          // Berechne Durchschnittswerte
          const routeAverage = calculateRouteAverage(route);
          
          // Prüfe K.O.-Status
          const isKnockedOut = route.encounters.length > 0 && route.encounters[0].isKnockedOut;
          const koInfo = isKnockedOut ? route.encounters[0] : null;
          
          // Prüfe "Nicht gefangen"-Status
          const isNotCaught = route.encounters.length > 0 && route.encounters[0].isNotCaught;
          const notCaughtInfo = isNotCaught ? route.encounters[0] : null;
          
          const isInactive = isKnockedOut || isNotCaught;
          
          return (
            <div key={route.id} className={`bg-white rounded-xl shadow-md p-6 border border-gray-200 ${isInactive ? 'opacity-60 bg-gray-50' : ''}`}>
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
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

              {/* Admin: Aktionen */}
              {isAdmin && route.encounters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* K.O./Reaktivierungs-Buttons */}
                  {isKnockedOut ? (
                    <button
                      onClick={() => handleReactivate(route.id)}
                      disabled={processing}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition text-sm disabled:opacity-50"
                      title="Route reaktivieren (K.O.)"
                    >
                      🔄 Reaktivieren
                    </button>
                  ) : isNotCaught ? (
                    <button
                      onClick={() => handleReactivateNotCaught(route.id)}
                      disabled={processing}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition text-sm disabled:opacity-50"
                      title="Route reaktivieren (Nicht gefangen)"
                    >
                      🔄 Reaktivieren
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => openKoDialog(route.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition text-sm disabled:opacity-50"
                        title="Route K.O. setzen"
                      >
                        💀 K.O.
                      </button>
                      <button
                        onClick={() => openNotCaughtDialog(route.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition text-sm disabled:opacity-50"
                        title="Route als Nicht gefangen markieren"
                      >
                        ⚠️ Nicht gefangen
                      </button>
                    </>
                  )}

                  {/* Team-Management nur wenn nicht inaktiv */}
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
                            const isSlotUsed = usedSlots[slot] !== undefined;
                            const isUsedByOtherRoute = isSlotUsed && usedSlots[slot].routeId !== route.id;
                            
                            return (
                              <button
                                key={slot}
                                onClick={() => handleAddToTeam(route.id, slot)}
                                disabled={addingToTeam[route.id] || isUsedByOtherRoute}
                                className={`px-3 py-1 rounded-md transition text-sm ${
                                  isUsedByOtherRoute
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                } ${addingToTeam[route.id] ? 'opacity-50' : ''}`}
                                title={
                                  isUsedByOtherRoute
                                    ? `Slot ${slot} bereits belegt von "${usedSlots[slot].routeName}"`
                                    : `Zu Slot ${slot} hinzufügen`
                                }
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

            {/* K.O.-Info anzeigen */}
            {isKnockedOut && koInfo && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-red-700 font-bold">💀</span>
                  <div className="flex-1">
                    <p className="text-red-900 font-bold">Diese Route ist K.O.</p>
                    <p className="text-red-700 mt-1">
                      <strong>Verursacher:</strong> {koInfo.koCausedBy}
                    </p>
                    <p className="text-red-700">
                      <strong>Grund:</strong> {koInfo.koReason}
                    </p>
                    {koInfo.koDate && (
                      <p className="text-red-600 text-xs mt-1">
                        {new Date(koInfo.koDate).toLocaleString('de-DE')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* "Nicht gefangen"-Info anzeigen */}
            {isNotCaught && notCaughtInfo && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-700 font-bold">⚠️</span>
                  <div className="flex-1">
                    <p className="text-yellow-900 font-bold">Auf dieser Route wurde nicht gefangen</p>
                    <p className="text-yellow-700 mt-1">
                      <strong>Verursacher:</strong> {notCaughtInfo.notCaughtBy}
                    </p>
                    <p className="text-yellow-700">
                      <strong>Grund:</strong> {notCaughtInfo.notCaughtReason}
                    </p>
                    {notCaughtInfo.notCaughtDate && (
                      <p className="text-yellow-600 text-xs mt-1">
                        {new Date(notCaughtInfo.notCaughtDate).toLocaleString('de-DE')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

          <div className="flex flex-wrap items-start gap-6">
            {(() => {
              // Finde die maximale Anzahl von Typen für ALLE Encounters in dieser Route
              const maxTypesInRoute = route.encounters.length > 0 
                ? Math.max(...route.encounters.map(e => parseTypes(e.pokemon.types).length))
                : 1;
              // Bestimme die Mindesthöhe basierend auf der maximalen Anzahl der Typen in der Route
              const minHeight = maxTypesInRoute === 2 ? 'min-h-[240px]' : 'min-h-[220px]';
              
              // Zeige alle Spieler, auch die ohne Encounters
              return players.map((player) => {
                const playerEncounters = route.encounters.filter(
                  (e) => e.player.id === player.id
                );
                const hasEncounter = playerEncounters.length > 0;
                const key = `${route.id}-${player.id}`;
                const searchValue = addPokemonSearch[key] || '';
                const filteredPokemon = filterPokemon(searchValue);
                const isAdding = addingPokemon[key] || false;

                return (
                  <div key={player.id} className="flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <h4 className="font-semibold text-lg">{player.name}</h4>
                    </div>

                    {hasEncounter ? (
                      <div className="flex flex-wrap items-start gap-3 md:gap-2">
                        {playerEncounters.map((encounter) => {
                              const p = encounter.pokemon;
                              const totalStats = p.hp + p.attack + p.defense + p.spAttack + p.spDefense + p.speed;
                              const types = parseTypes(p.types);
                              const effectiveness = calculateDefensiveEffectiveness(types);
                              const sortedMultipliers = Object.keys(effectiveness).sort((a, b) => {
                                const aVal = parseFloat(a.replace('x', '')) || 0;
                                const bVal = parseFloat(b.replace('x', '')) || 0;
                                return aVal - bVal;
                              });
                              const relevantMultipliers = sortedMultipliers.filter(
                                mult => mult !== '1x' && effectiveness[mult] && effectiveness[mult].length > 0
                              );
                              const hasTypeEffectiveness = relevantMultipliers.length > 0;
                              
                              return (
                                <div key={encounter.id} className="flex flex-col w-[140px] flex-shrink-0">
                                  <div className={`relative group flex-1 ${minHeight}`}>
                                    <div 
                                      className={`h-full ${minHeight} ${isAdmin && !isInactive ? 'cursor-pointer' : ''}`}
                                      onClick={() => {
                                        if (isAdmin && !isInactive) {
                                          openEvolutionMenu(encounter.id, p.pokedexId);
                                        }
                                      }}
                                    >
                                      <PokemonCard
                                        pokemon={encounter.pokemon}
                                        nickname={encounter.nickname}
                                        size="small"
                                      />
                                    </div>
                                    
                                    {/* Evolution-Menü */}
                                    {isAdmin && evolutionMenuOpen === encounter.id && (
                                      <div 
                                        ref={evolutionMenuRef}
                                        className="absolute z-30 top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[200px] overflow-hidden"
                                      >
                                        {loadingEvolutions ? (
                                          <div className="p-4 text-center text-gray-500 text-sm">
                                            Lade Evolutionen...
                                          </div>
                                        ) : evolutionData ? (
                                          <div>
                                            {/* Entwickeln */}
                                            {evolutionData.evolutions.length > 0 && (
                                              <div className="border-b border-gray-100">
                                                <div className="px-3 py-2 bg-green-50 text-green-800 text-xs font-semibold flex items-center gap-1">
                                                  <span>⬆️</span> Entwickeln zu
                                                </div>
                                                {evolutionData.evolutions.map((evo) => (
                                                  <button
                                                    key={evo.pokedexId}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleEvolve(encounter.id, evo.pokedexId);
                                                    }}
                                                    disabled={evolvingPokemon}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 transition flex items-center gap-2 disabled:opacity-50"
                                                  >
                                                    {evo.spriteUrl && (
                                                      <Image
                                                        src={evo.spriteUrl}
                                                        alt={evo.nameGerman || evo.name}
                                                        width={32}
                                                        height={32}
                                                        className="object-contain"
                                                        unoptimized
                                                      />
                                                    )}
                                                    <div>
                                                      <span className="font-medium">{evo.nameGerman || evo.name}</span>
                                                      <span className="text-gray-400 text-xs ml-1">#{evo.pokedexId}</span>
                                                    </div>
                                                  </button>
                                                ))}
                                              </div>
                                            )}
                                            
                                            {/* Zurückentwickeln */}
                                            {evolutionData.preEvolutions.length > 0 && (
                                              <div>
                                                <div className="px-3 py-2 bg-orange-50 text-orange-800 text-xs font-semibold flex items-center gap-1">
                                                  <span>⬇️</span> Zurückentwickeln zu
                                                </div>
                                                {evolutionData.preEvolutions.map((evo) => (
                                                  <button
                                                    key={evo.pokedexId}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleEvolve(encounter.id, evo.pokedexId);
                                                    }}
                                                    disabled={evolvingPokemon}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50 transition flex items-center gap-2 disabled:opacity-50"
                                                  >
                                                    {evo.spriteUrl && (
                                                      <Image
                                                        src={evo.spriteUrl}
                                                        alt={evo.nameGerman || evo.name}
                                                        width={32}
                                                        height={32}
                                                        className="object-contain"
                                                        unoptimized
                                                      />
                                                    )}
                                                    <div>
                                                      <span className="font-medium">{evo.nameGerman || evo.name}</span>
                                                      <span className="text-gray-400 text-xs ml-1">#{evo.pokedexId}</span>
                                                    </div>
                                                  </button>
                                                ))}
                                              </div>
                                            )}
                                            
                                            {/* Keine Evolutionen */}
                                            {evolutionData.evolutions.length === 0 && evolutionData.preEvolutions.length === 0 && (
                                              <div className="p-4 text-center text-gray-500 text-sm">
                                                Keine Evolutionen verfügbar
                                              </div>
                                            )}
                                          </div>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                  {/* Basispunkte des Pokémon */}
                                  <div className="mt-2 bg-gray-50 rounded-lg p-2 border border-gray-200 w-full">
                                    <div className="text-xs font-bold text-gray-700 mb-1.5 text-center">
                                      Basispunkte
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                                      <div className="text-center">
                                        <div className="text-gray-500 mb-0.5">KP</div>
                                        <div className="font-bold text-red-600">{p.hp}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-gray-500 mb-0.5">Ang.</div>
                                        <div className="font-bold text-orange-600">{p.attack}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-gray-500 mb-0.5">Vert.</div>
                                        <div className="font-bold text-yellow-600">{p.defense}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-gray-500 mb-0.5">Sp.A</div>
                                        <div className="font-bold text-blue-600">{p.spAttack}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-gray-500 mb-0.5">Sp.V</div>
                                        <div className="font-bold text-green-600">{p.spDefense}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-gray-500 mb-0.5">Init.</div>
                                        <div className="font-bold text-pink-600">{p.speed}</div>
                                      </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-300 text-center">
                                      <span className="text-xs text-gray-500">Gesamt:</span>
                                      <span className="text-xs font-bold text-purple-700 ml-1">{totalStats}</span>
                                    </div>
                                  </div>

                                  {/* Typ-Effektivität */}
                                  {hasTypeEffectiveness ? (
                                    <div className="mt-2 bg-blue-50 rounded-lg p-2 border border-blue-200 w-full">
                                      <div className="text-xs font-bold text-blue-900 mb-1">
                                        Typ-Effektivität
                                      </div>
                                      <div className="space-y-1">
                                        {relevantMultipliers.map(mult => {
                                          let colorClass = 'text-gray-700';
                                          
                                          if (mult === '0x') colorClass = 'text-purple-700';
                                          else if (mult === '0.25x') colorClass = 'text-green-700';
                                          else if (mult === '0.5x') colorClass = 'text-blue-700';
                                          else if (mult === '2x') colorClass = 'text-orange-700';
                                          else if (mult === '4x') colorClass = 'text-red-700';

                                          return (
                                            <div key={mult} className="text-xs">
                                              <span className={`font-bold ${colorClass}`}>{mult}:</span>{' '}
                                              <span className="text-gray-700">{effectiveness[mult].join(', ')}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-2 bg-blue-50 rounded-lg p-2 border border-blue-200 w-full min-h-[60px]">
                                      {/* Platzhalter für konsistente Höhe */}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                      </div>
                    ) : isAdmin ? (
                      <div className="relative min-w-[160px]">
                        <input
                          type="text"
                          placeholder="Pokémon suchen..."
                          value={searchValue}
                          onChange={(e) => setAddPokemonSearch({ ...addPokemonSearch, [key]: e.target.value })}
                          disabled={isAdding}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchValue && filteredPokemon.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredPokemon.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => handleAddPokemon(route.id, player.id, p.id)}
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
                    ) : (
                      <p className="text-gray-400 text-sm italic min-w-[160px]">Noch kein Pokémon</p>
                    )}
                  </div>
                );
              });
            })()}
          </div>
          </div>
        );
      })}
    </div>

    {/* K.O.-Dialog */}
    {koDialogOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-red-700">💀 Route K.O. setzen</h2>
          <p className="text-gray-600 mb-4">
            Alle Pokémon dieser Route werden K.O. gesetzt und aus dem Team entfernt.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verursacher (Spieler) *
              </label>
              <select
                value={koCausedBy}
                onChange={(e) => setKoCausedBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={processing}
              >
                <option value="">-- Spieler auswählen --</option>
                {players.map((player) => (
                  <option key={player.id} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grund des Ausscheidens *
              </label>
              <textarea
                value={koReason}
                onChange={(e) => setKoReason(e.target.value)}
                placeholder="z.B. Verloren gegen Arena-Leiter Veit"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={processing}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="secondary"
              onClick={() => setKoDialogOpen(false)}
              disabled={processing}
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleKnockout}
              disabled={processing || !koCausedBy.trim() || !koReason.trim()}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {processing ? 'Wird gesetzt...' : '💀 K.O. setzen'}
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Nicht-gefangen-Dialog */}
    {notCaughtDialogOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-700">⚠️ Route als Nicht gefangen markieren</h2>
          <p className="text-gray-600 mb-4">
            Diese Route wird als Nicht gefangen markiert und aus dem Team entfernt.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verursacher (Spieler) *
              </label>
              <select
                value={notCaughtBy}
                onChange={(e) => setNotCaughtBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={processing}
              >
                <option value="">-- Spieler auswählen --</option>
                {players.map((player) => (
                  <option key={player.id} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grund (optional)
              </label>
              <textarea
                value={notCaughtReason}
                onChange={(e) => setNotCaughtReason(e.target.value)}
                placeholder="z.B. Vergessen zu fangen, zu schwach, nur Tentacha"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={processing}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="secondary"
              onClick={() => setNotCaughtDialogOpen(false)}
              disabled={processing}
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleNotCaught}
              disabled={processing || !notCaughtBy.trim()}
              className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
            >
              {processing ? 'Wird gesetzt...' : '⚠️ Als Nicht gefangen markieren'}
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

