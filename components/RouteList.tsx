/**
 * Routen-Liste Komponente
 * Zeigt alle Routen mit den Encounters der Spieler an
 */

'use client';

import PokemonCard from './PokemonCard';
import { useState } from 'react';
import { parseTypes, calculateDefensiveEffectiveness } from '@/lib/typeEffectiveness';

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

interface RouteListProps {
  routes: Route[];
  players: Player[];
  isAdmin?: boolean;
  onTeamUpdate?: () => void;
}

export default function RouteList({ routes, players, isAdmin = false, onTeamUpdate }: RouteListProps) {
  const [addingToTeam, setAddingToTeam] = useState<{ [key: number]: boolean }>({});
  const [koDialogOpen, setKoDialogOpen] = useState(false);
  const [notCaughtDialogOpen, setNotCaughtDialogOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [koCausedBy, setKoCausedBy] = useState('');
  const [koReason, setKoReason] = useState('');
  const [notCaughtBy, setNotCaughtBy] = useState('');
  const [notCaughtReason, setNotCaughtReason] = useState('');
  const [processing, setProcessing] = useState(false);

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
      const res = await fetch(`/api/admin/routes/${routeId}/set-team-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlot: slot === 0 ? null : slot }),
      });

      const data = await res.json();

      if (res.ok) {
        if (onTeamUpdate) onTeamUpdate();
      } else {
        alert(`Fehler: ${data.error}`);
      }
    } catch (error) {
      alert('Netzwerkfehler');
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
      const res = await fetch(`/api/admin/routes/${selectedRouteId}/knockout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ causedBy: koCausedBy, reason: koReason }),
      });

      const data = await res.json();
      if (res.ok) {
        setKoDialogOpen(false);
        if (onTeamUpdate) onTeamUpdate();
      } else {
        alert(`Fehler: ${data.error}`);
      }
    } catch (error) {
      alert('Netzwerkfehler');
    } finally {
      setProcessing(false);
    }
  };

  // Reaktivieren
  const handleReactivate = async (routeId: number) => {
    if (!confirm('Möchtest du diese Route wirklich reaktivieren?')) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/routes/${routeId}/knockout`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        if (onTeamUpdate) onTeamUpdate();
      } else {
        alert(`Fehler: ${data.error}`);
      }
    } catch (error) {
      alert('Netzwerkfehler');
    } finally {
      setProcessing(false);
    }
  };

  // "Nicht gefangen"-Dialog öffnen
  const openNotCaughtDialog = (routeId: number) => {
    setSelectedRouteId(routeId);
    setNotCaughtBy('');
    setNotCaughtReason('');
    setNotCaughtDialogOpen(true);
  };

  // "Nicht gefangen" bestätigen
  const handleNotCaught = async () => {
    if (!selectedRouteId) return;
    if (!notCaughtBy.trim()) {
      alert('Bitte Verursacher angeben');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/routes/${selectedRouteId}/notcaught`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          causedBy: notCaughtBy.trim(), 
          reason: notCaughtReason.trim() || null 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotCaughtDialogOpen(false);
        setNotCaughtBy('');
        setNotCaughtReason('');
        if (onTeamUpdate) onTeamUpdate();
      } else {
        alert(`Fehler: ${data.error || 'Unbekannter Fehler'}`);
      }
    } catch (error: any) {
      console.error('Error setting not-caught status:', error);
      alert(`Netzwerkfehler: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setProcessing(false);
    }
  };

  // "Nicht gefangen" reaktivieren
  const handleReactivateNotCaught = async (routeId: number) => {
    if (!confirm('Möchtest du diese Route wirklich reaktivieren?')) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/routes/${routeId}/notcaught`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        if (onTeamUpdate) onTeamUpdate();
      } else {
        alert(`Fehler: ${data.error}`);
      }
    } catch (error) {
      alert('Netzwerkfehler');
    } finally {
      setProcessing(false);
    }
  };

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
            <div key={route.id} className={`bg-white rounded-lg shadow-lg p-6 ${isInactive ? 'opacity-60 bg-gray-50' : ''}`}>
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className={`text-2xl font-bold ${isInactive ? 'text-gray-500 line-through' : ''}`}>
                    {route.name}
                  </h3>
                  {isKnockedOut && koInfo && (
                    <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                      💀 K.O. durch {koInfo.koCausedBy}
                    </span>
                  )}
                  {isNotCaught && notCaughtInfo && (
                    <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">
                      ⚠️ Nicht gefangen durch {notCaughtInfo.notCaughtBy}
                    </span>
                  )}
                  {currentSlot && !isInactive && (
                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                      Im Team (Slot {currentSlot})
                    </span>
                  )}
                  {routeAverage && !isInactive && (
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
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
                        title="Route als 'Nicht gefangen' markieren"
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

          {route.encounters.length === 0 ? (
            <p className="text-gray-500 italic">
              Noch keine Pokémon auf dieser Route gefangen.
            </p>
          ) : (
            <div className="flex flex-wrap items-start gap-6">
              {/* Gruppiere Encounters nach Spieler und zeige horizontal */}
              {Array.from(
                new Set(route.encounters.map((e) => e.player.id))
              ).map((playerId) => {
                const playerEncounters = route.encounters.filter(
                  (e) => e.player.id === playerId
                );
                const player = playerEncounters[0].player;

                return (
                  <div key={playerId} className="flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <h4 className="font-semibold text-lg">{player.name}</h4>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {playerEncounters.map((encounter) => {
                        const p = encounter.pokemon;
                        const totalStats = p.hp + p.attack + p.defense + p.spAttack + p.spDefense + p.speed;
                        
                        return (
                          <div key={encounter.id} className="flex-shrink-0">
                            <PokemonCard
                              pokemon={encounter.pokemon}
                              nickname={encounter.nickname}
                              size="small"
                            />
                            {/* Basispunkte des Pokémon */}
                            <div className="mt-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                              <div className="text-xs font-bold text-gray-700 mb-1 text-center">
                                Basispunkte
                              </div>
                              <div className="grid grid-cols-3 gap-1 text-xs text-center">
                                <div>
                                  <div className="text-gray-500">KP</div>
                                  <div className="font-bold text-red-600">{p.hp}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Ang.</div>
                                  <div className="font-bold text-orange-600">{p.attack}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Vert.</div>
                                  <div className="font-bold text-yellow-600">{p.defense}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Sp.A</div>
                                  <div className="font-bold text-blue-600">{p.spAttack}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Sp.V</div>
                                  <div className="font-bold text-green-600">{p.spDefense}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Init.</div>
                                  <div className="font-bold text-pink-600">{p.speed}</div>
                                </div>
                              </div>
                              <div className="mt-1 pt-1 border-t border-gray-300 text-center">
                                <span className="text-xs text-gray-500">Gesamt:</span>
                                <span className="text-xs font-bold text-purple-700 ml-1">{totalStats}</span>
                              </div>
                            </div>

                            {/* Typ-Effektivität */}
                            {(() => {
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

                              if (relevantMultipliers.length === 0) return null;

                              return (
                                <div className="mt-2 bg-blue-50 rounded-lg p-2 border border-blue-200">
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
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        );
      })}
    </div>

    {/* K.O.-Dialog */}
    {koDialogOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-red-700">💀 Route K.O. setzen</h2>
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
            <button
              onClick={() => setKoDialogOpen(false)}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition"
              disabled={processing}
            >
              Abbrechen
            </button>
            <button
              onClick={handleKnockout}
              disabled={processing || !koCausedBy.trim() || !koReason.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition disabled:opacity-50"
            >
              {processing ? 'Wird gesetzt...' : '💀 K.O. setzen'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* "Nicht gefangen"-Dialog */}
    {notCaughtDialogOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-yellow-700">⚠️ Route als "Nicht gefangen" markieren</h2>
          <p className="text-gray-600 mb-4">
            Diese Route wird als "Nicht gefangen" markiert und aus dem Team entfernt.
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
            <button
              onClick={() => setNotCaughtDialogOpen(false)}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition"
              disabled={processing}
            >
              Abbrechen
            </button>
            <button
              onClick={handleNotCaught}
              disabled={processing || !notCaughtBy.trim()}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition disabled:opacity-50"
            >
              {processing ? 'Wird gesetzt...' : '⚠️ Als "Nicht gefangen" markieren'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

