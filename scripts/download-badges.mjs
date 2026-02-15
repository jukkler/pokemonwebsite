/**
 * Download Badge Images from Bulbapedia Archives
 *
 * Einmaliges Script zum Herunterladen aller Gym-Badge-PNGs.
 * Ausführen: node scripts/download-badges.mjs
 */

import { writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BADGES_DIR = join(__dirname, '..', 'public', 'icons', 'badges');
const BASE_URL = 'https://archives.bulbagarden.net/media/upload';

// Badge-Key → Bulbapedia Pfad (ohne BASE_URL)
const BADGE_URLS = {
  // Kanto
  boulder: 'd/dd/Boulder_Badge.png',
  cascade: '9/9c/Cascade_Badge.png',
  thunder: 'a/a6/Thunder_Badge.png',
  rainbow: 'b/b5/Rainbow_Badge.png',
  soul: '7/7d/Soul_Badge.png',
  marsh: '6/6b/Marsh_Badge.png',
  volcano: '1/12/Volcano_Badge.png',
  earth: '7/78/Earth_Badge.png',

  // Johto
  zephyr: '4/4a/Zephyr_Badge.png',
  hive: '0/08/Hive_Badge.png',
  plain: 'a/a7/Plain_Badge.png',
  fog: '4/48/Fog_Badge.png',
  storm: 'b/b9/Storm_Badge.png',
  mineral: '7/7b/Mineral_Badge.png',
  glacier: 'e/e6/Glacier_Badge.png',
  rising: '5/58/Rising_Badge.png',

  // Hoenn
  stone: '6/63/Stone_Badge.png',
  knuckle: '9/97/Knuckle_Badge.png',
  dynamo: '3/34/Dynamo_Badge.png',
  heat: 'c/c4/Heat_Badge.png',
  balance: '6/63/Balance_Badge.png',
  feather: '6/62/Feather_Badge.png',
  mind: 'c/cc/Mind_Badge.png',
  rain: '9/9b/Rain_Badge.png',

  // Sinnoh
  coal: '0/0b/Coal_Badge.png',
  forest: '8/8c/Forest_Badge.png',
  cobble: '2/27/Cobble_Badge.png',
  fen: '1/13/Fen_Badge.png',
  relic: '2/28/Relic_Badge.png',
  mine: 'f/fe/Mine_Badge.png',
  icicle: '0/09/Icicle_Badge.png',
  beacon: '0/0c/Beacon_Badge.png',

  // Unova
  trio: '7/74/Trio_Badge.png',
  basic: '8/85/Basic_Badge.png',
  insect: '8/8a/Insect_Badge.png',
  bolt: '5/5b/Bolt_Badge.png',
  quake: '2/29/Quake_Badge.png',
  jet: '9/9c/Jet_Badge.png',
  freeze: 'a/ac/Freeze_Badge.png',
  legend: 'c/c0/Legend_Badge.png',
  toxic: '3/3e/Toxic_Badge.png',
  wave: '0/00/Wave_Badge.png',

  // Kalos
  bug_badge: 'a/a5/Bug_Badge.png',
  cliff: '3/39/Cliff_Badge.png',
  rumble: 'd/d4/Rumble_Badge.png',
  plant: '7/7d/Plant_Badge.png',
  voltage: 'f/fc/Voltage_Badge.png',
  fairy_badge: 'd/d1/Fairy_Badge.png',
  psychic_badge: '1/13/Psychic_Badge.png',
  iceberg: '8/84/Iceberg_Badge.png',

  // Galar
  galar_grass: '0/00/Grass_Badge.png',
  galar_water: '7/7a/Water_Badge.png',
  galar_fire: 'c/cc/Fire_Badge.png',
  galar_fighting: '2/20/Fighting_Badge.png',
  galar_ghost: '3/30/Ghost_Badge.png',
  galar_fairy: 'e/e3/GalarFairy_Badge.png',
  galar_rock: '3/3e/Rock_Badge.png',
  galar_ice: '4/43/Ice_Badge.png',
  galar_dark: '4/4d/Dark_Badge.png',
  galar_dragon: '2/27/Dragon_Badge.png',

  // Paldea
  paldea_bug: '9/95/SVbadge_VictoryRoad_Bug.png',
  paldea_grass: 'a/ac/SVbadge_VictoryRoad_Grass.png',
  paldea_electric: 'f/ff/SVbadge_VictoryRoad_Electric.png',
  paldea_water: '4/4f/SVbadge_VictoryRoad_Water.png',
  paldea_normal: 'd/d6/SVbadge_VictoryRoad_Normal.png',
  paldea_ghost: '4/4c/SVbadge_VictoryRoad_Ghost.png',
  paldea_psychic: '2/2d/SVbadge_VictoryRoad_Psychic.png',
  paldea_ice: '4/46/SVbadge_VictoryRoad_Ice.png',
};

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadBadge(key, urlPath) {
  const outputPath = join(BADGES_DIR, `${key}.png`);

  if (await fileExists(outputPath)) {
    console.log(`  ✓ ${key}.png (bereits vorhanden)`);
    return true;
  }

  const url = `${BASE_URL}/${urlPath}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PokemonNuzlockeTracker/1.0 (badge-download-script)',
      },
    });

    if (!response.ok) {
      console.error(`  ✗ ${key}.png - HTTP ${response.status} (${url})`);
      return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(outputPath, buffer);
    console.log(`  ↓ ${key}.png (${(buffer.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (error) {
    console.error(`  ✗ ${key}.png - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Badge Download Script');
  console.log('====================\n');

  // Erstelle Verzeichnis
  await mkdir(BADGES_DIR, { recursive: true });
  console.log(`Zielverzeichnis: ${BADGES_DIR}\n`);

  const entries = Object.entries(BADGE_URLS);
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const [key, urlPath] of entries) {
    const outputPath = join(BADGES_DIR, `${key}.png`);
    if (await fileExists(outputPath)) {
      skipped++;
      console.log(`  ✓ ${key}.png (bereits vorhanden)`);
      continue;
    }

    const result = await downloadBadge(key, urlPath);
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Rate-Limiting: 500ms zwischen Requests
    await sleep(500);
  }

  console.log(`\n====================`);
  console.log(`Fertig: ${success} heruntergeladen, ${skipped} übersprungen, ${failed} fehlgeschlagen`);
  console.log(`Gesamt: ${entries.length} Badges`);
}

main().catch(console.error);
