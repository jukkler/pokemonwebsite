import { describe, expect, it } from 'vitest';
import {
  getAdjacentEvolutionChoices,
  type AdminEvolutionDetailsResponse,
} from '@/components/admin/admin-evolution-options';

const details: AdminEvolutionDetailsResponse = {
  evolution: {
    nodes: [
      { pokedexId: 172, name: 'pichu', nameGerman: 'Pichu', displayName: 'Pichu', spriteUrl: null, spriteGifUrl: null },
      { pokedexId: 25, name: 'pikachu', nameGerman: 'Pikachu', displayName: 'Pikachu', spriteUrl: null, spriteGifUrl: null },
      { pokedexId: 26, name: 'raichu', nameGerman: 'Raichu', displayName: 'Raichu', spriteUrl: null, spriteGifUrl: null },
      { pokedexId: 10091, name: 'raichu-alola', nameGerman: null, displayName: 'Alola-Raichu', spriteUrl: null, spriteGifUrl: null },
    ],
    edges: [
      {
        fromPokedexId: 172,
        toPokedexId: 25,
        conditions: [{ trigger: 'level-up', label: 'Hohe Freundschaft' }],
      },
      {
        fromPokedexId: 25,
        toPokedexId: 26,
        conditions: [{ trigger: 'use-item', label: 'Donnerstein einsetzen' }],
      },
      {
        fromPokedexId: 25,
        toPokedexId: 10091,
        conditions: [{ trigger: 'use-item', label: 'Donnerstein in Alola einsetzen' }],
      },
    ],
  },
};

describe('admin evolution picker choices', () => {
  it('returns only direct forward and backward neighbours with their conditions', () => {
    const choices = getAdjacentEvolutionChoices(details, 25);

    expect(choices.map((choice) => [choice.direction, choice.pokemon.pokedexId])).toEqual([
      ['evolution', 26],
      ['evolution', 10091],
      ['pre-evolution', 172],
    ]);
    expect(choices[0].conditions[0].label).toBe('Donnerstein einsetzen');
    expect(choices[2].conditions[0].label).toBe('Hohe Freundschaft');
  });

  it('does not offer non-adjacent chain members', () => {
    const choices = getAdjacentEvolutionChoices(details, 172);

    expect(choices.map((choice) => choice.pokemon.pokedexId)).toEqual([25]);
    expect(choices.some((choice) => choice.pokemon.pokedexId === 26)).toBe(false);
  });

  it('ignores malformed edges whose target node is missing', () => {
    const malformed: AdminEvolutionDetailsResponse = {
      evolution: {
        nodes: details.evolution.nodes,
        edges: [{ fromPokedexId: 25, toPokedexId: 999999, conditions: [] }],
      },
    };

    expect(getAdjacentEvolutionChoices(malformed, 25)).toEqual([]);
  });
});

