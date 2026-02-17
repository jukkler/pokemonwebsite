/**
 * Badge Data - Gym-Orden Definitionen, Level-Caps und Spielversions-Mappings
 * Zentrale Datenquelle für den Badge Progress Tracker
 */

export interface BadgeInfo {
  /** Interner Schlüssel, z.B. "boulder" */
  key: string;
  /** Englischer Name, z.B. "Boulder Badge" */
  nameEn: string;
  /** Deutscher Name, z.B. "Felsorden" */
  nameDe: string;
  /** Arenaleiter (Deutsch) */
  leaderDe: string;
  /** Pfad zum lokalen Bild */
  imagePath: string;
  /** Gym-Nummer (1-basiert) */
  gymNumber: number;
}

// =============================================================================
// Badge-Sets pro Region
// =============================================================================

const KANTO_BADGES: BadgeInfo[] = [
  { key: 'boulder', nameEn: 'Boulder Badge', nameDe: 'Felsorden', leaderDe: 'Rocko', imagePath: '/icons/badges/boulder.png', gymNumber: 1 },
  { key: 'cascade', nameEn: 'Cascade Badge', nameDe: 'Quellorden', leaderDe: 'Misty', imagePath: '/icons/badges/cascade.png', gymNumber: 2 },
  { key: 'thunder', nameEn: 'Thunder Badge', nameDe: 'Donnerorden', leaderDe: 'Major Bob', imagePath: '/icons/badges/thunder.png', gymNumber: 3 },
  { key: 'rainbow', nameEn: 'Rainbow Badge', nameDe: 'Farborden', leaderDe: 'Erika', imagePath: '/icons/badges/rainbow.png', gymNumber: 4 },
  { key: 'soul', nameEn: 'Soul Badge', nameDe: 'Seelenorden', leaderDe: 'Koga', imagePath: '/icons/badges/soul.png', gymNumber: 5 },
  { key: 'marsh', nameEn: 'Marsh Badge', nameDe: 'Sumpforden', leaderDe: 'Sabrina', imagePath: '/icons/badges/marsh.png', gymNumber: 6 },
  { key: 'volcano', nameEn: 'Volcano Badge', nameDe: 'Vulkanorden', leaderDe: 'Pyro', imagePath: '/icons/badges/volcano.png', gymNumber: 7 },
  { key: 'earth', nameEn: 'Earth Badge', nameDe: 'Erdorden', leaderDe: 'Giovanni', imagePath: '/icons/badges/earth.png', gymNumber: 8 },
];

const JOHTO_BADGES: BadgeInfo[] = [
  { key: 'zephyr', nameEn: 'Zephyr Badge', nameDe: 'Flügelorden', leaderDe: 'Falk', imagePath: '/icons/badges/zephyr.png', gymNumber: 1 },
  { key: 'hive', nameEn: 'Hive Badge', nameDe: 'Insektorden', leaderDe: 'Kai', imagePath: '/icons/badges/hive.png', gymNumber: 2 },
  { key: 'plain', nameEn: 'Plain Badge', nameDe: 'Basisorden', leaderDe: 'Bianka', imagePath: '/icons/badges/plain.png', gymNumber: 3 },
  { key: 'fog', nameEn: 'Fog Badge', nameDe: 'Phantomorden', leaderDe: 'Jens', imagePath: '/icons/badges/fog.png', gymNumber: 4 },
  { key: 'storm', nameEn: 'Storm Badge', nameDe: 'Faustorden', leaderDe: 'Hartwig', imagePath: '/icons/badges/storm.png', gymNumber: 5 },
  { key: 'mineral', nameEn: 'Mineral Badge', nameDe: 'Stahlorden', leaderDe: 'Jasmin', imagePath: '/icons/badges/mineral.png', gymNumber: 6 },
  { key: 'glacier', nameEn: 'Glacier Badge', nameDe: 'Eisorden', leaderDe: 'Norbert', imagePath: '/icons/badges/glacier.png', gymNumber: 7 },
  { key: 'rising', nameEn: 'Rising Badge', nameDe: 'Drachenorden', leaderDe: 'Sandra', imagePath: '/icons/badges/rising.png', gymNumber: 8 },
];

const HOENN_BADGES: BadgeInfo[] = [
  { key: 'stone', nameEn: 'Stone Badge', nameDe: 'Steinorden', leaderDe: 'Felizia', imagePath: '/icons/badges/stone.png', gymNumber: 1 },
  { key: 'knuckle', nameEn: 'Knuckle Badge', nameDe: 'Knöchelorden', leaderDe: 'Kamillo', imagePath: '/icons/badges/knuckle.png', gymNumber: 2 },
  { key: 'dynamo', nameEn: 'Dynamo Badge', nameDe: 'Dynamo-Orden', leaderDe: 'Walter', imagePath: '/icons/badges/dynamo.png', gymNumber: 3 },
  { key: 'heat', nameEn: 'Heat Badge', nameDe: 'Hitzeorden', leaderDe: 'Flavia', imagePath: '/icons/badges/heat.png', gymNumber: 4 },
  { key: 'balance', nameEn: 'Balance Badge', nameDe: 'Balanceorden', leaderDe: 'Norman', imagePath: '/icons/badges/balance.png', gymNumber: 5 },
  { key: 'feather', nameEn: 'Feather Badge', nameDe: 'Federorden', leaderDe: 'Wibke', imagePath: '/icons/badges/feather.png', gymNumber: 6 },
  { key: 'mind', nameEn: 'Mind Badge', nameDe: 'Mentalorden', leaderDe: 'Ben & Svenja', imagePath: '/icons/badges/mind.png', gymNumber: 7 },
  { key: 'rain', nameEn: 'Rain Badge', nameDe: 'Schauerorden', leaderDe: 'Wassili', imagePath: '/icons/badges/rain.png', gymNumber: 8 },
];

const SINNOH_BADGES: BadgeInfo[] = [
  { key: 'coal', nameEn: 'Coal Badge', nameDe: 'Kohleorden', leaderDe: 'Veit', imagePath: '/icons/badges/coal.png', gymNumber: 1 },
  { key: 'forest', nameEn: 'Forest Badge', nameDe: 'Waldorden', leaderDe: 'Silvana', imagePath: '/icons/badges/forest.png', gymNumber: 2 },
  { key: 'cobble', nameEn: 'Cobble Badge', nameDe: 'Bergorden', leaderDe: 'Hilda', imagePath: '/icons/badges/cobble.png', gymNumber: 3 },
  { key: 'fen', nameEn: 'Fen Badge', nameDe: 'Fennorden', leaderDe: 'Marinus', imagePath: '/icons/badges/fen.png', gymNumber: 4 },
  { key: 'relic', nameEn: 'Relic Badge', nameDe: 'Reliktorden', leaderDe: 'Lamina', imagePath: '/icons/badges/relic.png', gymNumber: 5 },
  { key: 'mine', nameEn: 'Mine Badge', nameDe: 'Minenorden', leaderDe: 'Adam', imagePath: '/icons/badges/mine.png', gymNumber: 6 },
  { key: 'icicle', nameEn: 'Icicle Badge', nameDe: 'Firnorden', leaderDe: 'Frida', imagePath: '/icons/badges/icicle.png', gymNumber: 7 },
  { key: 'beacon', nameEn: 'Beacon Badge', nameDe: 'Lichtorden', leaderDe: 'Volkner', imagePath: '/icons/badges/beacon.png', gymNumber: 8 },
];

const UNOVA_BW_BADGES: BadgeInfo[] = [
  { key: 'trio', nameEn: 'Trio Badge', nameDe: 'Triorden', leaderDe: 'Benny/Maik/Colin', imagePath: '/icons/badges/trio.png', gymNumber: 1 },
  { key: 'basic', nameEn: 'Basic Badge', nameDe: 'Grundorden', leaderDe: 'Aloe', imagePath: '/icons/badges/basic.png', gymNumber: 2 },
  { key: 'insect', nameEn: 'Insect Badge', nameDe: 'Käferorden', leaderDe: 'Artie', imagePath: '/icons/badges/insect.png', gymNumber: 3 },
  { key: 'bolt', nameEn: 'Bolt Badge', nameDe: 'Voltorden', leaderDe: 'Kamilla', imagePath: '/icons/badges/bolt.png', gymNumber: 4 },
  { key: 'quake', nameEn: 'Quake Badge', nameDe: 'Seismo-Orden', leaderDe: 'Turner', imagePath: '/icons/badges/quake.png', gymNumber: 5 },
  { key: 'jet', nameEn: 'Jet Badge', nameDe: 'Jetorden', leaderDe: 'Géraldine', imagePath: '/icons/badges/jet.png', gymNumber: 6 },
  { key: 'freeze', nameEn: 'Freeze Badge', nameDe: 'Eiszapforden', leaderDe: 'Sandro', imagePath: '/icons/badges/freeze.png', gymNumber: 7 },
  { key: 'legend', nameEn: 'Legend Badge', nameDe: 'Legendenorden', leaderDe: 'Lilia', imagePath: '/icons/badges/legend.png', gymNumber: 8 },
];

const UNOVA_B2W2_BADGES: BadgeInfo[] = [
  { key: 'basic', nameEn: 'Basic Badge', nameDe: 'Grundorden', leaderDe: 'Cheren', imagePath: '/icons/badges/basic.png', gymNumber: 1 },
  { key: 'toxic', nameEn: 'Toxic Badge', nameDe: 'Giftorden', leaderDe: 'Mica', imagePath: '/icons/badges/toxic.png', gymNumber: 2 },
  { key: 'insect', nameEn: 'Insect Badge', nameDe: 'Käferorden', leaderDe: 'Artie', imagePath: '/icons/badges/insect.png', gymNumber: 3 },
  { key: 'bolt', nameEn: 'Bolt Badge', nameDe: 'Voltorden', leaderDe: 'Kamilla', imagePath: '/icons/badges/bolt.png', gymNumber: 4 },
  { key: 'quake', nameEn: 'Quake Badge', nameDe: 'Seismo-Orden', leaderDe: 'Turner', imagePath: '/icons/badges/quake.png', gymNumber: 5 },
  { key: 'jet', nameEn: 'Jet Badge', nameDe: 'Jetorden', leaderDe: 'Géraldine', imagePath: '/icons/badges/jet.png', gymNumber: 6 },
  { key: 'legend', nameEn: 'Legend Badge', nameDe: 'Legendenorden', leaderDe: 'Lilia', imagePath: '/icons/badges/legend.png', gymNumber: 7 },
  { key: 'wave', nameEn: 'Wave Badge', nameDe: 'Wellenorden', leaderDe: 'Benson', imagePath: '/icons/badges/wave.png', gymNumber: 8 },
];

const KALOS_BADGES: BadgeInfo[] = [
  { key: 'bug_badge', nameEn: 'Bug Badge', nameDe: 'Krabbelorden', leaderDe: 'Viola', imagePath: '/icons/badges/bug_badge.png', gymNumber: 1 },
  { key: 'cliff', nameEn: 'Cliff Badge', nameDe: 'Wallorden', leaderDe: 'Lino', imagePath: '/icons/badges/cliff.png', gymNumber: 2 },
  { key: 'rumble', nameEn: 'Rumble Badge', nameDe: 'Rauforden', leaderDe: 'Connie', imagePath: '/icons/badges/rumble.png', gymNumber: 3 },
  { key: 'plant', nameEn: 'Plant Badge', nameDe: 'Blattorden', leaderDe: 'Amaro', imagePath: '/icons/badges/plant.png', gymNumber: 4 },
  { key: 'voltage', nameEn: 'Voltage Badge', nameDe: 'Ampere-Orden', leaderDe: 'Citro', imagePath: '/icons/badges/voltage.png', gymNumber: 5 },
  { key: 'fairy_badge', nameEn: 'Fairy Badge', nameDe: 'Feenorden', leaderDe: 'Valerie', imagePath: '/icons/badges/fairy_badge.png', gymNumber: 6 },
  { key: 'psychic_badge', nameEn: 'Psychic Badge', nameDe: 'Psi-Orden', leaderDe: 'Astrid', imagePath: '/icons/badges/psychic_badge.png', gymNumber: 7 },
  { key: 'iceberg', nameEn: 'Iceberg Badge', nameDe: 'Eisbergorden', leaderDe: 'Galantho', imagePath: '/icons/badges/iceberg.png', gymNumber: 8 },
];

const GALAR_SWORD_BADGES: BadgeInfo[] = [
  { key: 'galar_grass', nameEn: 'Grass Badge', nameDe: 'Pflanzen-Orden', leaderDe: 'Yarro', imagePath: '/icons/badges/galar_grass.png', gymNumber: 1 },
  { key: 'galar_water', nameEn: 'Water Badge', nameDe: 'Wasser-Orden', leaderDe: 'Kate', imagePath: '/icons/badges/galar_water.png', gymNumber: 2 },
  { key: 'galar_fire', nameEn: 'Fire Badge', nameDe: 'Feuer-Orden', leaderDe: 'Kabu', imagePath: '/icons/badges/galar_fire.png', gymNumber: 3 },
  { key: 'galar_fighting', nameEn: 'Fighting Badge', nameDe: 'Kampf-Orden', leaderDe: 'Saida', imagePath: '/icons/badges/galar_fighting.png', gymNumber: 4 },
  { key: 'galar_fairy', nameEn: 'Fairy Badge', nameDe: 'Feen-Orden', leaderDe: 'Papella', imagePath: '/icons/badges/galar_fairy.png', gymNumber: 5 },
  { key: 'galar_rock', nameEn: 'Rock Badge', nameDe: 'Gesteins-Orden', leaderDe: 'Mac', imagePath: '/icons/badges/galar_rock.png', gymNumber: 6 },
  { key: 'galar_dark', nameEn: 'Dark Badge', nameDe: 'Unlicht-Orden', leaderDe: 'Nezz', imagePath: '/icons/badges/galar_dark.png', gymNumber: 7 },
  { key: 'galar_dragon', nameEn: 'Dragon Badge', nameDe: 'Drachen-Orden', leaderDe: 'Roy', imagePath: '/icons/badges/galar_dragon.png', gymNumber: 8 },
];

const GALAR_SHIELD_BADGES: BadgeInfo[] = [
  { key: 'galar_grass', nameEn: 'Grass Badge', nameDe: 'Pflanzen-Orden', leaderDe: 'Yarro', imagePath: '/icons/badges/galar_grass.png', gymNumber: 1 },
  { key: 'galar_water', nameEn: 'Water Badge', nameDe: 'Wasser-Orden', leaderDe: 'Kate', imagePath: '/icons/badges/galar_water.png', gymNumber: 2 },
  { key: 'galar_fire', nameEn: 'Fire Badge', nameDe: 'Feuer-Orden', leaderDe: 'Kabu', imagePath: '/icons/badges/galar_fire.png', gymNumber: 3 },
  { key: 'galar_ghost', nameEn: 'Ghost Badge', nameDe: 'Geister-Orden', leaderDe: 'Nio', imagePath: '/icons/badges/galar_ghost.png', gymNumber: 4 },
  { key: 'galar_fairy', nameEn: 'Fairy Badge', nameDe: 'Feen-Orden', leaderDe: 'Papella', imagePath: '/icons/badges/galar_fairy.png', gymNumber: 5 },
  { key: 'galar_ice', nameEn: 'Ice Badge', nameDe: 'Eis-Orden', leaderDe: 'Mel', imagePath: '/icons/badges/galar_ice.png', gymNumber: 6 },
  { key: 'galar_dark', nameEn: 'Dark Badge', nameDe: 'Unlicht-Orden', leaderDe: 'Nezz', imagePath: '/icons/badges/galar_dark.png', gymNumber: 7 },
  { key: 'galar_dragon', nameEn: 'Dragon Badge', nameDe: 'Drachen-Orden', leaderDe: 'Roy', imagePath: '/icons/badges/galar_dragon.png', gymNumber: 8 },
];

const PALDEA_BADGES: BadgeInfo[] = [
  { key: 'paldea_bug', nameEn: 'Bug Badge', nameDe: 'Käfer-Arenaorden', leaderDe: 'Ronah', imagePath: '/icons/badges/paldea_bug.png', gymNumber: 1 },
  { key: 'paldea_grass', nameEn: 'Grass Badge', nameDe: 'Pflanzen-Arenaorden', leaderDe: 'Colzo', imagePath: '/icons/badges/paldea_grass.png', gymNumber: 2 },
  { key: 'paldea_electric', nameEn: 'Electric Badge', nameDe: 'Elektro-Arenaorden', leaderDe: 'Enigmara', imagePath: '/icons/badges/paldea_electric.png', gymNumber: 3 },
  { key: 'paldea_water', nameEn: 'Water Badge', nameDe: 'Wasser-Arenaorden', leaderDe: 'Kofu', imagePath: '/icons/badges/paldea_water.png', gymNumber: 4 },
  { key: 'paldea_normal', nameEn: 'Normal Badge', nameDe: 'Normal-Arenaorden', leaderDe: 'Aoki', imagePath: '/icons/badges/paldea_normal.png', gymNumber: 5 },
  { key: 'paldea_ghost', nameEn: 'Ghost Badge', nameDe: 'Geister-Arenaorden', leaderDe: 'Etta', imagePath: '/icons/badges/paldea_ghost.png', gymNumber: 6 },
  { key: 'paldea_psychic', nameEn: 'Psychic Badge', nameDe: 'Psycho-Arenaorden', leaderDe: 'Tulipa', imagePath: '/icons/badges/paldea_psychic.png', gymNumber: 7 },
  { key: 'paldea_ice', nameEn: 'Ice Badge', nameDe: 'Eis-Arenaorden', leaderDe: 'Grusha', imagePath: '/icons/badges/paldea_ice.png', gymNumber: 8 },
];

// =============================================================================
// Badge-Set Registry
// =============================================================================

const BADGE_SETS: Record<string, BadgeInfo[]> = {
  kanto: KANTO_BADGES,
  johto: JOHTO_BADGES,
  hoenn: HOENN_BADGES,
  sinnoh: SINNOH_BADGES,
  unovaBW: UNOVA_BW_BADGES,
  unovaB2W2: UNOVA_B2W2_BADGES,
  kalos: KALOS_BADGES,
  galarSword: GALAR_SWORD_BADGES,
  galarShield: GALAR_SHIELD_BADGES,
  paldea: PALDEA_BADGES,
};

// =============================================================================
// Game Version → Badge-Set Mapping
// =============================================================================

const GAME_VERSION_TO_BADGES: Record<string, string | null> = {
  // Gen 1
  red: 'kanto',
  blue: 'kanto',
  yellow: 'kanto',
  // Gen 2
  gold: 'johto',
  silver: 'johto',
  crystal: 'johto',
  // Gen 3
  ruby: 'hoenn',
  sapphire: 'hoenn',
  emerald: 'hoenn',
  firered: 'kanto',
  leafgreen: 'kanto',
  // Gen 4
  diamond: 'sinnoh',
  pearl: 'sinnoh',
  platinum: 'sinnoh',
  heartgold: 'johto',
  soulsilver: 'johto',
  // Gen 5
  black: 'unovaBW',
  white: 'unovaBW',
  black2: 'unovaB2W2',
  white2: 'unovaB2W2',
  // Gen 6
  x: 'kalos',
  y: 'kalos',
  omegaruby: 'hoenn',
  alphasapphire: 'hoenn',
  // Gen 7 - Trial system, keine traditionellen Orden
  sun: null,
  moon: null,
  ultrasun: null,
  ultramoon: null,
  // Gen 8
  sword: 'galarSword',
  shield: 'galarShield',
  brilliantdiamond: 'sinnoh',
  shiningpearl: 'sinnoh',
  legendsarceus: null,
  // Gen 8 - Let's Go
  letsgopikachu: 'kanto',
  letsgoeevee: 'kanto',
  // Gen 9
  scarlet: 'paldea',
  violet: 'paldea',
};

// =============================================================================
// Level-Cap Daten (aus levelcap.txt)
// =============================================================================

const LEVEL_CAPS: Record<string, number[]> = {
  // Gen 1
  red: [14, 21, 24, 29, 43, 43, 47, 50],
  blue: [14, 21, 24, 29, 43, 43, 47, 50],
  yellow: [12, 21, 28, 32, 50, 50, 54, 55],
  // Gen 2
  gold: [9, 16, 20, 25, 30, 35, 31, 40],
  silver: [9, 16, 20, 25, 30, 35, 31, 40],
  crystal: [9, 16, 20, 25, 30, 35, 31, 40],
  // Gen 3
  ruby: [15, 18, 23, 28, 31, 33, 42, 43],
  sapphire: [15, 18, 23, 28, 31, 33, 42, 43],
  emerald: [15, 19, 24, 29, 31, 33, 42, 46],
  firered: [14, 21, 24, 29, 43, 43, 47, 50],
  leafgreen: [14, 21, 24, 29, 43, 43, 47, 50],
  // Gen 4
  diamond: [14, 22, 30, 30, 36, 39, 42, 49],
  pearl: [14, 22, 30, 30, 36, 39, 42, 49],
  platinum: [14, 22, 26, 32, 37, 41, 44, 50],
  heartgold: [13, 17, 19, 25, 31, 35, 34, 41],
  soulsilver: [13, 17, 19, 25, 31, 35, 34, 41],
  brilliantdiamond: [14, 22, 30, 30, 36, 39, 42, 49],
  shiningpearl: [14, 22, 30, 30, 36, 39, 42, 49],
  // Gen 5
  black: [14, 20, 23, 27, 31, 35, 39, 43],
  white: [14, 20, 23, 27, 31, 35, 39, 43],
  black2: [13, 18, 24, 30, 33, 39, 48, 51],
  white2: [13, 18, 24, 30, 33, 39, 48, 51],
  // Gen 6
  x: [12, 25, 32, 34, 37, 42, 48, 59],
  y: [12, 25, 32, 34, 37, 42, 48, 59],
  omegaruby: [14, 16, 21, 28, 30, 35, 45, 46],
  alphasapphire: [14, 16, 21, 28, 30, 35, 45, 46],
  // Gen 7 - Let's Go (Kanto-Badges, Yellow-Caps als Referenz)
  letsgopikachu: [12, 21, 28, 32, 50, 50, 54, 55],
  letsgoeevee: [12, 21, 28, 32, 50, 50, 54, 55],
  // Gen 8
  sword: [20, 24, 27, 36, 38, 42, 46, 48],
  shield: [20, 24, 27, 36, 38, 42, 46, 48],
  // Gen 9
  scarlet: [15, 17, 24, 30, 36, 42, 45, 48],
  violet: [15, 17, 24, 30, 36, 42, 45, 48],
};

// =============================================================================
// Helper-Funktionen
// =============================================================================

/**
 * Gibt die Badge-Infos für eine Spielversion zurück.
 * Null wenn keine traditionellen Orden vorhanden (z.B. Sun/Moon).
 */
export function getBadgesForGame(gameVersionKey: string): BadgeInfo[] | null {
  const regionKey = GAME_VERSION_TO_BADGES[gameVersionKey];
  if (!regionKey) return null;
  return BADGE_SETS[regionKey] ?? null;
}

/**
 * Gibt die Level-Caps (nur Gym-Orden) für eine Spielversion zurück.
 * Null wenn keine Level-Cap-Daten vorhanden.
 */
export function getLevelCapsForGame(gameVersionKey: string): number[] | null {
  return LEVEL_CAPS[gameVersionKey] ?? null;
}
