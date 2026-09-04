import type {
  EvolutionCondition,
  EvolutionNode,
  PokemonDetailsResponse,
} from '@/lib/pokemon-details';

export type AdminEvolutionDetailsResponse = Pick<PokemonDetailsResponse, 'evolution'>;

export interface AdminEvolutionChoice {
  direction: 'evolution' | 'pre-evolution';
  pokemon: EvolutionNode;
  conditions: EvolutionCondition[];
}

/**
 * Returns only direct neighbours of the current Pokemon. The admin endpoint
 * accepts every member of the chain, but keeping this picker to one evolution
 * step makes accidental skips much less likely.
 */
export function getAdjacentEvolutionChoices(
  details: AdminEvolutionDetailsResponse,
  currentPokedexId: number,
): AdminEvolutionChoice[] {
  const nodesByPokedexId = new Map(
    details.evolution.nodes.map((node) => [node.pokedexId, node]),
  );
  const seen = new Set<string>();
  const choices: AdminEvolutionChoice[] = [];

  for (const edge of details.evolution.edges) {
    let direction: AdminEvolutionChoice['direction'] | null = null;
    let targetPokedexId: number | null = null;

    if (edge.fromPokedexId === currentPokedexId) {
      direction = 'evolution';
      targetPokedexId = edge.toPokedexId;
    } else if (edge.toPokedexId === currentPokedexId) {
      direction = 'pre-evolution';
      targetPokedexId = edge.fromPokedexId;
    }

    if (!direction || targetPokedexId === null) continue;
    const pokemon = nodesByPokedexId.get(targetPokedexId);
    if (!pokemon) continue;

    const key = `${direction}:${targetPokedexId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    choices.push({ direction, pokemon, conditions: edge.conditions ?? [] });
  }

  return choices.sort((left, right) => {
    if (left.direction !== right.direction) {
      return left.direction === 'evolution' ? -1 : 1;
    }
    return left.pokemon.pokedexId - right.pokemon.pokedexId;
  });
}
