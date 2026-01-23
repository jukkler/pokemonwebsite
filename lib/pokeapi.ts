/**
 * PokeAPI Service Layer
 * Holt Pokémon-Daten von PokeAPI und cached sie in der Datenbank
 */

import prisma from './prisma';

// PokeAPI Base URL
const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

// Typen für PokeAPI Responses
interface PokeAPIType {
  type: {
    name: string;
  };
}

interface PokeAPIStat {
  base_stat: number;
  stat: {
    name: string;
  };
}

interface PokeAPIPokemon {
  id: number;
  name: string;
  types: PokeAPIType[];
  stats: PokeAPIStat[];
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: {
        front_default?: string | null;
      };
    };
  };
}

interface PokeAPISpecies {
  names: {
    language: {
      name: string;
    };
    name: string;
  }[];
  evolution_chain?: {
    url: string;
  };
}

// Evolution Chain Typen
interface PokeAPIEvolutionChainLink {
  species: {
    name: string;
    url: string;
  };
  evolves_to: PokeAPIEvolutionChainLink[];
}

interface PokeAPIEvolutionChain {
  chain: PokeAPIEvolutionChainLink;
}

// Export-Typen für Evolution
export interface EvolutionOption {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  spriteUrl: string | null;
}

export interface EvolutionChainResult {
  preEvolutions: EvolutionOption[];
  evolutions: EvolutionOption[];
}

class PokeAPIRequestError extends Error {
  status: number;
  isNotFound: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'PokeAPIRequestError';
    this.status = status;
    this.isNotFound = status === 404;
  }
}

const isNotFoundError = (error: unknown): boolean => {
  if (error instanceof PokeAPIRequestError) {
    return error.isNotFound;
  }
  if (error && typeof error === 'object') {
    const maybeError = error as { status?: number; isNotFound?: boolean; message?: string };
    if (maybeError.isNotFound) return true;
    if (maybeError.status === 404) return true;
    if (maybeError.message && maybeError.message.includes('404')) return true;
    if (maybeError.message && maybeError.message.includes('Not Found')) return true;
  }
  return false;
};

/**
 * Holt ein einzelnes Pokémon von PokeAPI
 */
async function fetchPokemonFromAPI(id: number): Promise<PokeAPIPokemon> {
  const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${id}`);
  if (!response.ok) {
    throw new PokeAPIRequestError(
      `Failed to fetch Pokemon ${id}: ${response.status} ${response.statusText}`,
      response.status
    );
  }
  return response.json();
}

/**
 * Holt den deutschen Namen eines Pokémon von PokeAPI Species Endpoint
 */
async function fetchPokemonSpecies(id: number): Promise<string | null> {
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon-species/${id}`);
    if (!response.ok) return null;
    
    const data: PokeAPISpecies = await response.json();
    const germanName = data.names.find(n => n.language.name === 'de');
    return germanName?.name || null;
  } catch (error) {
    console.error(`Failed to fetch German name for Pokemon ${id}:`, error);
    return null;
  }
}

/**
 * Holt und cached ein einzelnes Pokémon
 */
export async function fetchPokemonById(id: number) {
  try {
    // Prüfe ob bereits gecacht
    const existing = await prisma.pokemon.findUnique({
      where: { pokedexId: id },
    });

    if (existing) {
      return existing;
    }

    // Von PokeAPI holen
    console.log(`Fetching Pokemon #${id} from PokeAPI...`);
    const pokemonData = await fetchPokemonFromAPI(id);
    const germanName = await fetchPokemonSpecies(id);

    // Stats extrahieren
    const stats = {
      hp: pokemonData.stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
      attack: pokemonData.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
      defense: pokemonData.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
      spAttack: pokemonData.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
      spDefense: pokemonData.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
      speed: pokemonData.stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
    };

    // Typen extrahieren
    const types = pokemonData.types.map(t => t.type.name);

    // Sprite URL (bevorzuge Official Artwork, sonst Default Sprite)
    const spriteUrl = 
      pokemonData.sprites.other?.['official-artwork']?.front_default ||
      pokemonData.sprites.front_default ||
      null;

    // In Datenbank speichern
    const pokemon = await prisma.pokemon.upsert({
      where: { pokedexId: id },
      update: {
        name: pokemonData.name,
        nameGerman: germanName,
        types: JSON.stringify(types),
        hp: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        spAttack: stats.spAttack,
        spDefense: stats.spDefense,
        speed: stats.speed,
        spriteUrl: spriteUrl,
      },
      create: {
        pokedexId: id,
        name: pokemonData.name,
        nameGerman: germanName,
        types: JSON.stringify(types),
        hp: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        spAttack: stats.spAttack,
        spDefense: stats.spDefense,
        speed: stats.speed,
        spriteUrl: spriteUrl,
      },
    });

    return pokemon;
  } catch (error) {
    console.error(`Error fetching Pokemon ${id}:`, error);
    throw error;
  }
}

/**
 * Holt und cached mehrere Pokémon
 */
export async function fetchPokemonByIds(ids: number[]) {
  const results = [];
  
  for (const id of ids) {
    try {
      const pokemon = await fetchPokemonById(id);
      results.push(pokemon);
    } catch (error) {
      console.error(`Skipping Pokemon ${id} due to error:`, error);
    }
  }
  
  return results;
}

/**
 * Synced alle Pokémon von Gen 1-4 (1-493 für Platin)
 * Dies kann lange dauern! Sollte nur im Admin-Panel getriggert werden.
 */
export async function syncAllPlatinumPokemon(
  onProgress?: (current: number, total: number) => void
) {
  const PLATINUM_DEX_MAX = 493;
  const results = [];
  
  for (let i = 1; i <= PLATINUM_DEX_MAX; i++) {
    try {
      const pokemon = await fetchPokemonById(i);
      results.push(pokemon);
      
      // Progress Callback
      if (onProgress) {
        onProgress(i, PLATINUM_DEX_MAX);
      }
      
      // Rate Limiting: 100ms Pause zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to sync Pokemon ${i}:`, error);
    }
  }
  
  return results;
}

/**
 * Synced alle verfügbaren Pokémon (aktuell bis Gen 9, ~1025+)
 * Versucht alle Pokémon bis zu einem Maximum zu synchronisieren
 * Dies kann sehr lange dauern! Sollte nur im Admin-Panel getriggert werden.
 */
export async function syncAllAvailablePokemon(
  onProgress?: (current: number, total: number) => void
) {
  // Aktuell sind bis Gen 9 über 1025 Pokémon verfügbar
  // Wir versuchen bis 1050, um auch eventuelle neue hinzuzufügen
  const MAX_POKEMON = 1050;
  const results = [];
  
  for (let i = 1; i <= MAX_POKEMON; i++) {
    try {
      const pokemon = await fetchPokemonById(i);
      results.push(pokemon);
      
      // Progress Callback
      if (onProgress) {
        onProgress(i, MAX_POKEMON);
      }
      
      // Rate Limiting: 100ms Pause zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      if (isNotFoundError(error)) {
        console.warn(`Pokémon #${i} nicht gefunden, wird übersprungen.`);
      } else {
        // Bei anderen Fehlern (Netzwerk, etc.) loggen aber weitermachen
        console.error(`Failed to sync Pokemon ${i}:`, error);
      }
      
      // Rate Limiting auch bei Fehlern
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Holt alle gecachten Pokémon aus der Datenbank
 */
export async function getAllCachedPokemon() {
  return prisma.pokemon.findMany({
    orderBy: { pokedexId: 'asc' },
  });
}

/**
 * Zählt gecachte Pokémon
 */
export async function getCachedPokemonCount() {
  return prisma.pokemon.count();
}

/**
 * Extrahiert die Pokedex-ID aus einer PokeAPI Species-URL
 * z.B. "https://pokeapi.co/api/v2/pokemon-species/25/" -> 25
 */
function extractPokedexIdFromUrl(url: string): number {
  const match = url.match(/\/pokemon-species\/(\d+)\/?$/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Sammelt alle Pokémon in einer Evolution-Chain rekursiv
 * und gibt sie als flache Liste mit ihrer Position zurück
 */
function collectEvolutionChain(
  chain: PokeAPIEvolutionChainLink,
  depth: number = 0
): Array<{ pokedexId: number; depth: number }> {
  const result: Array<{ pokedexId: number; depth: number }> = [];
  
  const pokedexId = extractPokedexIdFromUrl(chain.species.url);
  if (pokedexId > 0) {
    result.push({ pokedexId, depth });
  }
  
  // Rekursiv alle Entwicklungen sammeln
  for (const evolution of chain.evolves_to) {
    result.push(...collectEvolutionChain(evolution, depth + 1));
  }
  
  return result;
}

/**
 * Holt die Evolution-Chain für ein Pokémon von PokeAPI
 * Gibt alle Vor- und Nachentwicklungen zurück
 */
export async function fetchEvolutionChain(pokedexId: number): Promise<EvolutionChainResult> {
  try {
    // 1. Species-Daten holen um die Evolution-Chain-URL zu bekommen
    const speciesResponse = await fetch(`${POKEAPI_BASE_URL}/pokemon-species/${pokedexId}`);
    if (!speciesResponse.ok) {
      throw new PokeAPIRequestError(
        `Failed to fetch species for Pokemon ${pokedexId}`,
        speciesResponse.status
      );
    }
    
    const speciesData: PokeAPISpecies = await speciesResponse.json();
    
    if (!speciesData.evolution_chain?.url) {
      // Keine Evolution-Chain (z.B. bei legendären Pokémon)
      return { preEvolutions: [], evolutions: [] };
    }
    
    // 2. Evolution-Chain holen
    const chainResponse = await fetch(speciesData.evolution_chain.url);
    if (!chainResponse.ok) {
      throw new PokeAPIRequestError(
        `Failed to fetch evolution chain`,
        chainResponse.status
      );
    }
    
    const chainData: PokeAPIEvolutionChain = await chainResponse.json();
    
    // 3. Alle Pokémon in der Chain sammeln
    const allInChain = collectEvolutionChain(chainData.chain);
    
    // 4. Finde die Position des aktuellen Pokémon
    const currentEntry = allInChain.find(p => p.pokedexId === pokedexId);
    const currentDepth = currentEntry?.depth ?? 0;
    
    // 5. Vor- und Nachentwicklungen trennen
    const preEvolutionIds = allInChain
      .filter(p => p.depth < currentDepth && p.pokedexId !== pokedexId)
      .map(p => p.pokedexId);
    
    const evolutionIds = allInChain
      .filter(p => p.depth > currentDepth && p.pokedexId !== pokedexId)
      .map(p => p.pokedexId);
    
    // 6. Pokémon-Daten aus der Datenbank holen (oder von API fetchen)
    const preEvolutions: EvolutionOption[] = [];
    const evolutions: EvolutionOption[] = [];
    
    for (const id of preEvolutionIds) {
      try {
        const pokemon = await fetchPokemonById(id);
        preEvolutions.push({
          pokedexId: pokemon.pokedexId,
          name: pokemon.name,
          nameGerman: pokemon.nameGerman,
          spriteUrl: pokemon.spriteUrl,
        });
      } catch (error) {
        console.error(`Failed to fetch pre-evolution ${id}:`, error);
      }
    }
    
    for (const id of evolutionIds) {
      try {
        const pokemon = await fetchPokemonById(id);
        evolutions.push({
          pokedexId: pokemon.pokedexId,
          name: pokemon.name,
          nameGerman: pokemon.nameGerman,
          spriteUrl: pokemon.spriteUrl,
        });
      } catch (error) {
        console.error(`Failed to fetch evolution ${id}:`, error);
      }
    }
    
    return { preEvolutions, evolutions };
  } catch (error) {
    console.error(`Error fetching evolution chain for Pokemon ${pokedexId}:`, error);
    return { preEvolutions: [], evolutions: [] };
  }
}

/**
 * Prüft, ob ein Ziel-Pokémon in der Evolution-Chain eines Quell-Pokémons ist
 */
export async function isInEvolutionChain(
  sourcePokedexId: number,
  targetPokedexId: number
): Promise<boolean> {
  const chain = await fetchEvolutionChain(sourcePokedexId);
  const allEvolutions = [...chain.preEvolutions, ...chain.evolutions];
  return allEvolutions.some(p => p.pokedexId === targetPokedexId);
}
