'use client';

/**
 * Pokeradar Page
 * Vergleichstool für Pokémon mit Radar Chart und Tabelle
 */

import { useState, useEffect } from 'react';
import PokemonRadarChart from '@/components/PokemonRadarChart';
import PokemonCard from '@/components/PokemonCard';
import { fetchJson } from '@/lib/fetchJson';

interface Pokemon {
  id: number;
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  types: string;
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  spriteUrl: string | null;
  spriteGifUrl: string | null;
}

export default function PokeradarPage() {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Farben für Radar Chart
  const colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF'];

  // Pokémon laden
  useEffect(() => {
    fetchJson<{ pokemon: Pokemon[] }>('/api/pokemon')
      .then((data) => {
        setAllPokemon(data.pokemon || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading pokemon:', err);
        setLoading(false);
      });
  }, []);

  // Filtern nach Suchbegriff
  const filteredPokemon = allPokemon.filter((p) => {
    const search = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(search) ||
      p.nameGerman?.toLowerCase().includes(search) ||
      p.pokedexId.toString().includes(search)
    );
  });

  // Pokémon auswählen/abwählen
  const togglePokemon = (pokemon: Pokemon) => {
    if (selectedPokemon.find((p) => p.id === pokemon.id)) {
      setSelectedPokemon(selectedPokemon.filter((p) => p.id !== pokemon.id));
    } else {
      if (selectedPokemon.length < 6) {
        setSelectedPokemon([...selectedPokemon, pokemon]);
      }
    }
  };

  // Pokémon aus der Auswahl entfernen
  const removePokemon = (pokedexId: number) => {
    setSelectedPokemon(selectedPokemon.filter((p) => p.pokedexId !== pokedexId));
  };

  const isSelected = (pokemon: Pokemon) =>
    selectedPokemon.some((p) => p.id === pokemon.id);

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
          Pokémon Vergleichstool
        </h1>
        <p className="text-gray-600">
          Wähle bis zu 6 Pokémon aus, um ihre Stats im Radar Chart zu vergleichen
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Lade Pokémon-Daten...</p>
        </div>
      ) : allPokemon.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
          <p className="text-gray-500 text-lg mb-4">
            Noch keine Pokémon in der Datenbank.
          </p>
          <p className="text-gray-600">
            Admin kann im Admin-Panel Pokémon von der PokeAPI synchronisieren.
          </p>
        </div>
      ) : (
        <>
          {/* Radar Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 md:mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Stats Vergleich</h2>
              {selectedPokemon.length > 0 && (
                <button
                  onClick={() => setSelectedPokemon([])}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
                  title="Alle Auswahlen zurücksetzen"
                >
                  🔄 Zurücksetzen
                </button>
              )}
            </div>
            <PokemonRadarChart pokemon={selectedPokemon} colors={colors} onRemove={removePokemon} />
          </div>

          {/* Stats Tabelle */}
          {selectedPokemon.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 md:mb-8 overflow-x-auto border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Detaillierte Stats</h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4">Pokémon</th>
                    <th className="py-2 px-4 text-center">HP</th>
                    <th className="py-2 px-4 text-center">Angriff</th>
                    <th className="py-2 px-4 text-center">Vert.</th>
                    <th className="py-2 px-4 text-center">Sp. Ang.</th>
                    <th className="py-2 px-4 text-center">Sp. Vert.</th>
                    <th className="py-2 px-4 text-center">Init.</th>
                    <th className="py-2 px-4 text-center">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPokemon.map((p) => {
                    const total =
                      p.hp +
                      p.attack +
                      p.defense +
                      p.spAttack +
                      p.spDefense +
                      p.speed;
                    return (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4 font-semibold">
                          #{p.pokedexId} {p.nameGerman || p.name}
                        </td>
                        <td className="py-2 px-4 text-center">{p.hp}</td>
                        <td className="py-2 px-4 text-center">{p.attack}</td>
                        <td className="py-2 px-4 text-center">{p.defense}</td>
                        <td className="py-2 px-4 text-center">{p.spAttack}</td>
                        <td className="py-2 px-4 text-center">{p.spDefense}</td>
                        <td className="py-2 px-4 text-center">{p.speed}</td>
                        <td className="py-2 px-4 text-center font-bold">
                          {total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pokémon Auswahl */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                Pokémon auswählen ({selectedPokemon.length}/6)
              </h2>
              <input
                type="text"
                placeholder="Suche nach Name oder Nummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
              {filteredPokemon.map((pokemon) => (
                <div
                  key={pokemon.id}
                  onClick={() => togglePokemon(pokemon)}
                  className={`cursor-pointer transition transform hover:scale-105 ${
                    isSelected(pokemon)
                      ? 'ring-4 ring-red-500 rounded-lg'
                      : ''
                  }`}
                >
                  <PokemonCard pokemon={pokemon} size="small" />
                </div>
              ))}
            </div>

            {filteredPokemon.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Keine Pokémon gefunden
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

