/**
 * Pokémon-Detailseite Komponente
 * Zeigt detaillierte Informationen über ein Pokémon
 */

'use client';

import Image from 'next/image';
import { parseTypes, calculateDefensiveEffectiveness } from '@/lib/typeEffectiveness';
import { getTypeColor } from '@/lib/design-tokens';
import TypeBadge from './ui/TypeBadge';

interface PokemonDetailProps {
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
  description?: string;
  weight?: number; // in kg
  height?: number; // in m
  category?: string;
  ability?: string;
  genderRatio?: {
    male: number; // 0-100
    female: number; // 0-100
  };
  evolutions?: Array<{
    id: number;
    name: string;
    nameGerman: string | null;
    level?: number;
    spriteUrl: string | null;
    types: string;
  }>;
  onBack?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export default function PokemonDetail({
  pokemon,
  description,
  weight,
  height,
  category,
  ability,
  genderRatio,
  evolutions,
  onBack,
  isFavorite = false,
  onFavoriteToggle,
}: PokemonDetailProps) {
  const types = parseTypes(pokemon.types);
  const primaryType = types[0] || 'normal';
  const typeColor = getTypeColor(primaryType);
  
  // Berechne Schwächen
  const defensiveEffectiveness = calculateDefensiveEffectiveness(types);
  const weaknesses = defensiveEffectiveness['2x'] || [];
  const resistances = defensiveEffectiveness['0.5x'] || [];
  const immunities = defensiveEffectiveness['0x'] || [];

  const totalStats = pokemon.hp + pokemon.attack + pokemon.defense + 
                     pokemon.spAttack + pokemon.spDefense + pokemon.speed;

  return (
    <div className="min-h-screen bg-white">
      {/* Header mit Pokémon-Bild */}
      <div
        className="relative pt-16 pb-8 px-4"
        style={{ backgroundColor: `${typeColor}20` }}
      >
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
              aria-label="Zurück"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          {onFavoriteToggle && (
            <button
              onClick={onFavoriteToggle}
              className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
              aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
            >
              <svg
                className={`w-6 h-6 ${
                  isFavorite ? 'text-red-600 fill-current' : 'text-gray-400'
                }`}
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Pokémon-Bild */}
        <div className="relative w-48 h-48 mx-auto mb-4">
          {pokemon.spriteUrl ? (
            <Image
              src={pokemon.spriteUrl}
              alt={pokemon.nameGerman || pokemon.name}
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
              <span className="text-gray-400">Kein Bild</span>
            </div>
          )}
        </div>

        {/* Name und Nummer */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {pokemon.nameGerman || pokemon.name}
          </h1>
          <p className="text-lg font-semibold text-gray-600">
            N°{String(pokemon.pokedexId).padStart(3, '0')}
          </p>
        </div>

        {/* Typ-Badges */}
        <div className="flex justify-center gap-2 mb-4">
          {types.map((type) => (
            <TypeBadge key={type} type={type} size="lg" />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-20 md:pb-4">
        {/* Beschreibung */}
        {description && (
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Stats: Gewicht und Höhe */}
        {(weight || height) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {weight && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">GEWICHT</p>
                <p className="text-xl font-bold text-gray-900">{weight.toFixed(1)} kg</p>
              </div>
            )}
            {height && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">HÖHE</p>
                <p className="text-xl font-bold text-gray-900">{height.toFixed(1)} m</p>
              </div>
            )}
          </div>
        )}

        {/* Kategorie und Fähigkeit */}
        {(category || ability) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {category && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">KATEGORIE</p>
                <p className="text-lg font-semibold text-gray-900">{category}</p>
              </div>
            )}
            {ability && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">FÄHIGKEIT</p>
                <p className="text-lg font-semibold text-gray-900">{ability}</p>
              </div>
            )}
          </div>
        )}

        {/* Geschlecht-Verteilung */}
        {genderRatio && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-600 mb-2">GESCHLECHT</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 font-semibold">♂</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${genderRatio.male}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">{genderRatio.male}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pink-600 font-semibold">♀</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-600 h-2 rounded-full"
                    style={{ width: `${genderRatio.female}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">{genderRatio.female}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Schwächen */}
        {weaknesses.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-600 mb-3">SCHWÄCHEN</p>
            <div className="flex flex-wrap gap-2">
              {weaknesses.map((weakness) => (
                <TypeBadge key={weakness} type={weakness.toLowerCase()} size="md" />
              ))}
            </div>
          </div>
        )}

        {/* Stats-Grid */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-600 mb-3">STATS</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">KP</p>
                <p className="text-xl font-bold text-gray-900">{pokemon.hp}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Angriff</p>
                <p className="text-xl font-bold text-gray-900">{pokemon.attack}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Verteidigung</p>
                <p className="text-xl font-bold text-gray-900">{pokemon.defense}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Sp. Angriff</p>
                <p className="text-xl font-bold text-gray-900">{pokemon.spAttack}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Sp. Verteidigung</p>
                <p className="text-xl font-bold text-gray-900">{pokemon.spDefense}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Initiative</p>
                <p className="text-xl font-bold text-gray-900">{pokemon.speed}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Gesamt</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats}</p>
            </div>
          </div>
        </div>

        {/* Evolutionen */}
        {evolutions && evolutions.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-600 mb-3">EVOLUTIONEN</p>
            <div className="space-y-4">
              {evolutions.map((evo, index) => {
                const evoTypes = parseTypes(evo.types);
                return (
                  <div key={evo.id} className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                      <div className="relative w-16 h-16">
                        {evo.spriteUrl ? (
                          <Image
                            src={evo.spriteUrl}
                            alt={evo.nameGerman || evo.name}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {evo.nameGerman || evo.name}
                        </p>
                        <p className="text-xs text-gray-600">N°{String(evo.id).padStart(3, '0')}</p>
                        <div className="flex gap-1 mt-1">
                          {evoTypes.map((type) => (
                            <TypeBadge key={type} type={type} size="sm" />
                          ))}
                        </div>
                      </div>
                    </div>
                    {index < evolutions.length - 1 && evo.level && (
                      <div className="text-center">
                        <svg
                          className="w-6 h-6 text-gray-400 mx-auto mb-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                        <p className="text-xs font-semibold text-gray-600">Level {evo.level}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

