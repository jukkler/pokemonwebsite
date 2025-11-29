/**
 * Pokedex-Liste Komponente
 * Zeigt eine durchsuchbare und filterbare Liste von Pokémon
 */

'use client';

import { useState, useMemo } from 'react';
import PokemonCard from './PokemonCard';
import Input from './ui/Input';
import Dropdown from './ui/Dropdown';
import { allPokemonTypes, getGermanTypeName } from '@/lib/typeEffectiveness';
import { getTypeColor, typeNamesGerman } from '@/lib/design-tokens';

interface Pokemon {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  types: string;
  spriteUrl: string | null;
}

interface PokedexListProps {
  pokemon: Pokemon[];
  favorites?: Set<number>;
  onFavoriteToggle?: (pokedexId: number) => void;
  onPokemonClick?: (pokemon: Pokemon) => void;
}

type SortOrder = 'lowest' | 'highest' | 'a-z' | 'z-a';

export default function PokedexList({
  pokemon,
  favorites = new Set(),
  onFavoriteToggle,
  onPokemonClick,
}: PokedexListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('lowest');

  // Filter- und Sortieroptionen
  const filteredAndSorted = useMemo(() => {
    let filtered = [...pokemon];

    // Suche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const name = (p.nameGerman || p.name).toLowerCase();
        const number = p.pokedexId.toString();
        return name.includes(query) || number.includes(query);
      });
    }

    // Typ-Filter
    if (selectedType !== 'all') {
      filtered = filtered.filter((p) => {
        const types = JSON.parse(p.types || '[]');
        return types.some((t: string) => t.toLowerCase() === selectedType.toLowerCase());
      });
    }

    // Sortierung
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'lowest':
          return a.pokedexId - b.pokedexId;
        case 'highest':
          return b.pokedexId - a.pokedexId;
        case 'a-z':
          return (a.nameGerman || a.name).localeCompare(b.nameGerman || b.name, 'de');
        case 'z-a':
          return (b.nameGerman || b.name).localeCompare(a.nameGerman || a.name, 'de');
        default:
          return 0;
      }
    });

    return filtered;
  }, [pokemon, searchQuery, selectedType, sortOrder]);

  // Typ-Optionen für Dropdown
  const typeOptions = [
    { value: 'all', label: 'Alle Typen' },
    ...allPokemonTypes.map((type) => ({
      value: type,
      label: getGermanTypeName(type),
      color: getTypeColor(type),
    })),
  ];

  // Sortier-Optionen
  const sortOptions = [
    { value: 'lowest', label: 'Niedrigste Nummer' },
    { value: 'highest', label: 'Höchste Nummer' },
    { value: 'a-z', label: 'A-Z' },
    { value: 'z-a', label: 'Z-A' },
  ];

  return (
    <div className="w-full">
      {/* Suchleiste und Filter */}
      <div className="mb-6 space-y-4">
        <Input
          type="text"
          placeholder="Suche Pokémon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Dropdown
            options={typeOptions}
            value={selectedType}
            onChange={(value) => setSelectedType(value)}
            placeholder="Alle Typen"
          />
          <Dropdown
            options={sortOptions}
            value={sortOrder}
            onChange={(value) => setSortOrder(value as SortOrder)}
            placeholder="Sortierung"
          />
        </div>
      </div>

      {/* Pokémon-Liste */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Keine Pokémon gefunden</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAndSorted.map((p) => (
            <PokemonCard
              key={p.pokedexId}
              pokemon={p}
              size="medium"
              isFavorite={favorites.has(p.pokedexId)}
              onFavoriteToggle={
                onFavoriteToggle ? () => onFavoriteToggle(p.pokedexId) : undefined
              }
              onClick={onPokemonClick ? () => onPokemonClick(p) : undefined}
            />
          ))}
        </div>
      )}

      {/* Ergebnis-Zähler */}
      <div className="mt-6 text-center text-sm text-gray-600">
        {filteredAndSorted.length} von {pokemon.length} Pokémon
      </div>
    </div>
  );
}

