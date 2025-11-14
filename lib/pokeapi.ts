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
}

/**
 * Holt ein einzelnes Pokémon von PokeAPI
 */
async function fetchPokemonFromAPI(id: number): Promise<PokeAPIPokemon> {
  const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${id}`);
  if (!response.ok) {
    const error = new Error(`Failed to fetch Pokemon ${id}: ${response.status} ${response.statusText}`) as any;
    error.status = response.status;
    error.isNotFound = response.status === 404;
    throw error;
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
  let consecutiveNotFound = 0;
  const MAX_CONSECUTIVE_NOT_FOUND = 20; // Stoppe nach 20 aufeinanderfolgenden "nicht gefunden" Fehlern
  
  for (let i = 1; i <= MAX_POKEMON; i++) {
    try {
      const pokemon = await fetchPokemonById(i);
      results.push(pokemon);
      consecutiveNotFound = 0; // Reset counter on success
      
      // Progress Callback
      if (onProgress) {
        onProgress(i, MAX_POKEMON);
      }
      
      // Rate Limiting: 100ms Pause zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      // Prüfe ob es ein "nicht gefunden" Fehler ist (404)
      const isNotFound = error.isNotFound || 
                        error.status === 404 ||
                        error.message?.includes('404') || 
                        error.message?.includes('Not Found');
      
      if (isNotFound) {
        consecutiveNotFound++;
        // Bei "nicht gefunden" Fehlern einfach weitermachen
        if (consecutiveNotFound >= MAX_CONSECUTIVE_NOT_FOUND) {
          console.log(`Stopping sync after ${consecutiveNotFound} consecutive "not found" errors at Pokemon #${i}`);
          break;
        }
      } else {
        // Bei anderen Fehlern (Netzwerk, etc.) loggen aber weitermachen
        console.error(`Failed to sync Pokemon ${i}:`, error);
        consecutiveNotFound = 0; // Reset bei anderen Fehlern
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

