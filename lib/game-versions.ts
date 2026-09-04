import type { PokemonEditionInfo } from './pokemon-details';

export interface KnownGameVersion extends PokemonEditionInfo {
  generation: number;
}

export const GAME_VERSIONS: readonly KnownGameVersion[] = [
  { key: 'red', name: 'Pokémon Rot', generation: 1, versionSlug: 'red', versionGroupSlug: 'red-blue' },
  { key: 'blue', name: 'Pokémon Blau', generation: 1, versionSlug: 'blue', versionGroupSlug: 'red-blue' },
  { key: 'yellow', name: 'Pokémon Gelb', generation: 1, versionSlug: 'yellow', versionGroupSlug: 'yellow' },
  { key: 'gold', name: 'Pokémon Gold', generation: 2, versionSlug: 'gold', versionGroupSlug: 'gold-silver' },
  { key: 'silver', name: 'Pokémon Silber', generation: 2, versionSlug: 'silver', versionGroupSlug: 'gold-silver' },
  { key: 'crystal', name: 'Pokémon Kristall', generation: 2, versionSlug: 'crystal', versionGroupSlug: 'crystal' },
  { key: 'ruby', name: 'Pokémon Rubin', generation: 3, versionSlug: 'ruby', versionGroupSlug: 'ruby-sapphire' },
  { key: 'sapphire', name: 'Pokémon Saphir', generation: 3, versionSlug: 'sapphire', versionGroupSlug: 'ruby-sapphire' },
  { key: 'emerald', name: 'Pokémon Smaragd', generation: 3, versionSlug: 'emerald', versionGroupSlug: 'emerald' },
  { key: 'firered', name: 'Pokémon Feuerrot', generation: 3, versionSlug: 'firered', versionGroupSlug: 'firered-leafgreen' },
  { key: 'leafgreen', name: 'Pokémon Blattgrün', generation: 3, versionSlug: 'leafgreen', versionGroupSlug: 'firered-leafgreen' },
  { key: 'diamond', name: 'Pokémon Diamant', generation: 4, versionSlug: 'diamond', versionGroupSlug: 'diamond-pearl' },
  { key: 'pearl', name: 'Pokémon Perl', generation: 4, versionSlug: 'pearl', versionGroupSlug: 'diamond-pearl' },
  { key: 'platinum', name: 'Pokémon Platin', generation: 4, versionSlug: 'platinum', versionGroupSlug: 'platinum' },
  { key: 'heartgold', name: 'Pokémon HeartGold', generation: 4, versionSlug: 'heartgold', versionGroupSlug: 'heartgold-soulsilver' },
  { key: 'soulsilver', name: 'Pokémon SoulSilver', generation: 4, versionSlug: 'soulsilver', versionGroupSlug: 'heartgold-soulsilver' },
  { key: 'black', name: 'Pokémon Schwarz', generation: 5, versionSlug: 'black', versionGroupSlug: 'black-white' },
  { key: 'white', name: 'Pokémon Weiß', generation: 5, versionSlug: 'white', versionGroupSlug: 'black-white' },
  { key: 'black2', name: 'Pokémon Schwarz 2', generation: 5, versionSlug: 'black-2', versionGroupSlug: 'black-2-white-2' },
  { key: 'white2', name: 'Pokémon Weiß 2', generation: 5, versionSlug: 'white-2', versionGroupSlug: 'black-2-white-2' },
  { key: 'x', name: 'Pokémon X', generation: 6, versionSlug: 'x', versionGroupSlug: 'x-y' },
  { key: 'y', name: 'Pokémon Y', generation: 6, versionSlug: 'y', versionGroupSlug: 'x-y' },
  { key: 'omegaruby', name: 'Pokémon Omega Rubin', generation: 6, versionSlug: 'omega-ruby', versionGroupSlug: 'omega-ruby-alpha-sapphire' },
  { key: 'alphasapphire', name: 'Pokémon Alpha Saphir', generation: 6, versionSlug: 'alpha-sapphire', versionGroupSlug: 'omega-ruby-alpha-sapphire' },
  { key: 'sun', name: 'Pokémon Sonne', generation: 7, versionSlug: 'sun', versionGroupSlug: 'sun-moon' },
  { key: 'moon', name: 'Pokémon Mond', generation: 7, versionSlug: 'moon', versionGroupSlug: 'sun-moon' },
  { key: 'ultrasun', name: 'Pokémon Ultrasonne', generation: 7, versionSlug: 'ultra-sun', versionGroupSlug: 'ultra-sun-ultra-moon' },
  { key: 'ultramoon', name: 'Pokémon Ultramond', generation: 7, versionSlug: 'ultra-moon', versionGroupSlug: 'ultra-sun-ultra-moon' },
  { key: 'letsgopikachu', name: "Pokémon Let's Go, Pikachu!", generation: 7, versionSlug: 'lets-go-pikachu', versionGroupSlug: 'lets-go-pikachu-lets-go-eevee' },
  { key: 'letsgoeevee', name: "Pokémon Let's Go, Evoli!", generation: 7, versionSlug: 'lets-go-eevee', versionGroupSlug: 'lets-go-pikachu-lets-go-eevee' },
  { key: 'sword', name: 'Pokémon Schwert', generation: 8, versionSlug: 'sword', versionGroupSlug: 'sword-shield' },
  { key: 'shield', name: 'Pokémon Schild', generation: 8, versionSlug: 'shield', versionGroupSlug: 'sword-shield' },
  { key: 'brilliantdiamond', name: 'Pokémon Strahlender Diamant', generation: 8, versionSlug: 'brilliant-diamond', versionGroupSlug: 'brilliant-diamond-and-shining-pearl' },
  { key: 'shiningpearl', name: 'Pokémon Leuchtende Perle', generation: 8, versionSlug: 'shining-pearl', versionGroupSlug: 'brilliant-diamond-and-shining-pearl' },
  { key: 'legendsarceus', name: 'Pokémon-Legenden: Arceus', generation: 8, versionSlug: 'legends-arceus', versionGroupSlug: 'legends-arceus' },
  { key: 'scarlet', name: 'Pokémon Karmesin', generation: 9, versionSlug: 'scarlet', versionGroupSlug: 'scarlet-violet' },
  { key: 'violet', name: 'Pokémon Purpur', generation: 9, versionSlug: 'violet', versionGroupSlug: 'scarlet-violet' },
] as const;

const GAME_VERSION_BY_KEY = new Map(GAME_VERSIONS.map((version) => [version.key, version]));

export function getKnownGameVersion(key: string | null | undefined): KnownGameVersion | null {
  if (!key) return null;
  return GAME_VERSION_BY_KEY.get(key.trim().toLowerCase()) ?? null;
}
