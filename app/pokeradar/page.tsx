'use client';

/**
 * Pokeradar Page
 * Vergleichstool für Pokémon mit Radar Chart und Tabelle
 */

import { useState, useEffect } from 'react';
import PokemonRadarChart from '@/components/PokemonRadarChart';
import PokemonCard from '@/components/PokemonCard';
import { fetchJson } from '@/lib/fetchJson';
import { BentoGrid, BentoCard } from '@/components/layout/BentoGrid';

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
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Theme Detection
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    // Observer für Theme-Änderungen
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Farben für Radar Chart - angepasst an Dark/Light Mode
  const colors = isDarkMode
    ? ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'] // Dark Mode: Hellere Farben
    : ['#DC2626', '#2563EB', '#059669', '#D97706', '#DB2777', '#0891B2']; // Light Mode: Dunklere Farben

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
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-screen-2xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--foreground)] mb-2">
          Pokémon Vergleichstool
        </h1>
        <p className="text-[var(--text-secondary)]">
          Wähle bis zu 6 Pokémon aus, um ihre Stats im Radar Chart zu vergleichen
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-[var(--text-secondary)] text-lg">Lade Pokémon-Daten...</p>
        </div>
      ) : allPokemon.length === 0 ? (
        <BentoCard>
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="w-16 h-16 text-[var(--text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-[var(--text-secondary)] text-lg mb-2">
              Noch keine Pokémon in der Datenbank.
            </p>
            <p className="text-[var(--text-tertiary)]">
              Admin kann im Admin-Panel Pokémon von der PokeAPI synchronisieren.
            </p>
          </div>
        </BentoCard>
      ) : (
        <BentoGrid>
          {/* Radar Chart (2 Spalten) */}
          <BentoCard
            span={{ sm: 1, md: 2, lg: 2 }}
            className="order-1 animate-[scale-in_0.3s_ease-out]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">Stats Vergleich</h2>
              <button
                onClick={() => setSelectedPokemon([])}
                disabled={selectedPokemon.length === 0}
                className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                  selectedPokemon.length > 0
                    ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                }`}
                title={selectedPokemon.length > 0 ? 'Alle Auswahlen zurücksetzen' : 'Keine Pokémon ausgewählt'}
              >
                🔄 Zurücksetzen
              </button>
            </div>
            <PokemonRadarChart pokemon={selectedPokemon} colors={colors} onRemove={removePokemon} />
          </BentoCard>

          {/* Pokémon Auswahl (1 Spalte, rechts auf Desktop) */}
          <BentoCard
            span={{ sm: 1, md: 1, lg: 1 }}
            variant="elevated"
            className="order-2 lg:order-2 animate-[scale-in_0.3s_ease-out] stagger-1"
          >
            <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
              Pokémon auswählen ({selectedPokemon.length}/6)
            </h2>
            <input
              type="text"
              placeholder="Suche nach Name oder Nummer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-[var(--border-default)] bg-[var(--background-secondary)] text-[var(--foreground)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 mb-4"
            />

            <div className="grid grid-cols-2 gap-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 no-scrollbar">
              {filteredPokemon.map((pokemon, index) => (
                <div
                  key={pokemon.id}
                  onClick={() => togglePokemon(pokemon)}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    isSelected(pokemon)
                      ? 'ring-4 ring-red-500 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                      : ''
                  } stagger-${(index % 6) + 1} animate-[scale-in_0.3s_ease-out]`}
                >
                  <PokemonCard
                    pokemon={pokemon}
                    size="small"
                    priority={index < 6}
                  />
                </div>
              ))}
            </div>

            {filteredPokemon.length === 0 && (
              <p className="text-center text-[var(--text-secondary)] py-8">
                Keine Pokémon gefunden
              </p>
            )}
          </BentoCard>

          {/* Stats Tabelle (volle Breite, permanent) */}
          <BentoCard
            span={{ sm: 1, md: 3, lg: 3 }}
            className="order-3 animate-[scale-in_0.3s_ease-out] stagger-2"
          >
            <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Detaillierte Stats</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    <th className="py-3 px-4 font-semibold text-[var(--text-secondary)]">Pokémon</th>
                    <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)]">HP</th>
                    <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)]">Angriff</th>
                    <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)]">Vert.</th>
                    <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)]">Sp. Ang.</th>
                    <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)]">Sp. Vert.</th>
                    <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)]">Init.</th>
                    <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)]">Gesamt</th>
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
                      <tr key={p.id} className="border-b border-[var(--border-default)] hover:bg-[var(--background-tertiary)] transition-colors duration-300">
                        <td className="py-3 px-4 font-semibold text-[var(--foreground)]">
                          #{p.pokedexId} {p.nameGerman || p.name}
                        </td>
                        <td className="py-3 px-4 text-center text-[var(--foreground)]">{p.hp}</td>
                        <td className="py-3 px-4 text-center text-[var(--foreground)]">{p.attack}</td>
                        <td className="py-3 px-4 text-center text-[var(--foreground)]">{p.defense}</td>
                        <td className="py-3 px-4 text-center text-[var(--foreground)]">{p.spAttack}</td>
                        <td className="py-3 px-4 text-center text-[var(--foreground)]">{p.spDefense}</td>
                        <td className="py-3 px-4 text-center text-[var(--foreground)]">{p.speed}</td>
                        <td className="py-3 px-4 text-center font-bold text-[var(--foreground)]">
                          {total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </BentoGrid>
      )}
    </div>
  );
}

