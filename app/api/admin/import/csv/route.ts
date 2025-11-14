/**
 * Admin API: CSV Import
 * POST /api/admin/import/csv - Importiert Routen und Encounters aus CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface CSVRow {
  route: string;
  player: string;
  pokemon: string; // Name oder Pokédex-ID
  nickname?: string;
}

interface SpeciesNameEntry {
  language: {
    name: string;
  };
  name: string;
}

interface PokeAPISpeciesResponse {
  names: SpeciesNameEntry[];
}

interface PokeAPIStatEntry {
  base_stat: number;
  stat: {
    name: string;
  };
}

interface PokeAPIPokemonResponse {
  id: number;
  name: string;
  species: {
    url: string;
  };
  stats: PokeAPIStatEntry[];
  types: {
    type: {
      name: string;
    };
  }[];
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: {
        front_default: string | null;
      };
    };
  };
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unbekannter Fehler';

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }

    // CSV-Datei einlesen
    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV-Datei ist leer oder hat keine Daten' }, { status: 400 });
    }

    // Erkenne Trennzeichen (Semikolon oder Komma)
    const delimiter = lines[0].includes(';') ? ';' : ',';

    // Header parsen
    const header = lines[0].split(delimiter).map(h => h.trim());
    
    // Format-Erkennung: Pivot-Format (Route;Spieler1;Spieler2;...) oder Standard-Format (Route,Spieler,Pokemon,...)
    const isPivotFormat = header.length > 2 && header[0].toLowerCase().match(/route/i);
    
    const rows: CSVRow[] = [];

    if (isPivotFormat) {
      // PIVOT-FORMAT: Route;Thorben;Lukas;Timo
      const playerNames = header.slice(1); // Alle Spalten außer der ersten sind Spieler

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const cells = line.split(delimiter).map(c => c.trim());
        const route = cells[0];

        if (!route) {
          return NextResponse.json(
            { error: `Zeile ${i + 1}: Route ist erforderlich` },
            { status: 400 }
          );
        }

        // Jede Zelle = Pokémon für entsprechenden Spieler
        for (let j = 1; j < cells.length && j < header.length; j++) {
          const pokemon = cells[j];
          if (!pokemon) continue; // Leere Zelle überspringen

          const player = playerNames[j - 1];
          rows.push({ route, player, pokemon });
        }
      }
    } else {
      // STANDARD-FORMAT: Route,Spieler,Pokemon,Nickname
      const routeIdx = header.findIndex(h => h.toLowerCase().match(/route/i));
      const playerIdx = header.findIndex(h => h.toLowerCase().match(/spieler|player/i));
      const pokemonIdx = header.findIndex(h => h.toLowerCase().match(/pokemon|pokémon/i));
      const nicknameIdx = header.findIndex(h => h.toLowerCase().match(/nickname|spitzname/i));

      if (routeIdx === -1 || playerIdx === -1 || pokemonIdx === -1) {
        return NextResponse.json(
          { error: 'CSV muss die Spalten "Route", "Spieler" und "Pokemon" enthalten' },
          { status: 400 }
        );
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const cells = line.split(delimiter).map(c => c.trim());
        
        const route = cells[routeIdx];
        const player = cells[playerIdx];
        const pokemon = cells[pokemonIdx];
        const nickname = nicknameIdx !== -1 ? cells[nicknameIdx] : undefined;

        if (!route || !player || !pokemon) {
          return NextResponse.json(
            { error: `Zeile ${i + 1}: Route, Spieler und Pokemon sind erforderlich` },
            { status: 400 }
          );
        }

        rows.push({ route, player, pokemon, nickname });
      }
    }

    // Importieren
    const results = {
      routesCreated: 0,
      pokemonSynced: 0,
      encountersCreated: 0,
      errors: [] as string[],
    };

    // Alle Spieler laden (müssen bereits existieren)
    const allPlayers = await prisma.player.findMany();
    const playerMap = new Map(allPlayers.map(p => [p.name.toLowerCase(), p]));

    // Alle vorhandenen Pokémon laden
    const allPokemon = await prisma.pokemon.findMany();
    const pokemonByNameMap = new Map(allPokemon.map(p => [p.name.toLowerCase(), p]));
    const pokemonByIdMap = new Map(allPokemon.map(p => [p.pokedexId, p]));

    // Routen gruppieren und Order bestimmen
    const existingRoutes = await prisma.route.findMany();
    const routeMap = new Map(existingRoutes.map(r => [r.name.toLowerCase(), r]));
    let maxOrder = existingRoutes.length > 0 ? Math.max(...existingRoutes.map(r => r.order)) : 0;

    for (const row of rows) {
      try {
        // 1. Spieler prüfen
        const player = playerMap.get(row.player.toLowerCase());
        if (!player) {
          results.errors.push(`Spieler "${row.player}" nicht gefunden (erstelle Spieler zuerst)`);
          continue;
        }

        // 2. Route erstellen/laden
        let route = routeMap.get(row.route.toLowerCase());
        if (!route) {
          route = await prisma.route.create({
            data: {
              name: row.route,
              order: ++maxOrder,
            },
          });
          routeMap.set(row.route.toLowerCase(), route);
          results.routesCreated++;
        }

        // 3. Pokémon prüfen/synchronisieren
        let pokemon = pokemonByNameMap.get(row.pokemon.toLowerCase());
        
        // Falls nicht per Name gefunden, versuche als Pokédex-ID
        if (!pokemon && !isNaN(parseInt(row.pokemon))) {
          const pokedexId = parseInt(row.pokemon);
          pokemon = pokemonByIdMap.get(pokedexId);
        }

        // Falls immer noch nicht gefunden, suche nach deutschem Namen in DB
        if (!pokemon) {
          pokemon = allPokemon.find(p => 
            p.nameGerman && p.nameGerman.toLowerCase() === row.pokemon.toLowerCase()
          );
        }

        // Falls immer noch nicht gefunden, von PokeAPI laden
        if (!pokemon) {
          try {
            let pokeData: PokeAPIPokemonResponse | null = null;
            let speciesData: PokeAPISpeciesResponse | null = null;

            // Versuch 1: Direkter Name/ID-Lookup
            if (!isNaN(parseInt(row.pokemon))) {
              // Pokédex-ID
                  const pokeRes = await fetch(
                    `https://pokeapi.co/api/v2/pokemon/${parseInt(row.pokemon)}`
                  );
              if (pokeRes.ok) {
                    pokeData = (await pokeRes.json()) as PokeAPIPokemonResponse;
              }
            } else {
              // Englischer Name
                  const pokeRes = await fetch(
                    `https://pokeapi.co/api/v2/pokemon/${row.pokemon.toLowerCase()}`
                  );
              if (pokeRes.ok) {
                    pokeData = (await pokeRes.json()) as PokeAPIPokemonResponse;
              }
            }

            // Versuch 2: Wenn nicht gefunden, könnte es ein deutscher Name sein
            // Suche durch Pokémon-Species nach deutschem Namen
            if (!pokeData) {
              console.log(`Suche nach deutschem Namen: "${row.pokemon}"...`);
              let foundId = null;
              
              // Optimierte Suche: Erst Gen 1-4 (Platin), dann Rest
              const searchRanges = [
                { start: 1, end: 493 },    // Gen 1-4 (Pokémon Platin)
                { start: 494, end: 1010 }, // Gen 5+
              ];
              
              for (const range of searchRanges) {
                if (foundId) break;
                
                for (let searchId = range.start; searchId <= range.end; searchId++) {
                  try {
                    const speciesRes = await fetch(
                      `https://pokeapi.co/api/v2/pokemon-species/${searchId}`
                    );
                    if (!speciesRes.ok) continue;
                    
                    const speciesTemp = (await speciesRes.json()) as PokeAPISpeciesResponse;
                    const germanName = speciesTemp.names.find(
                      (n) => n.language.name === 'de'
                    )?.name;
                    
                    if (germanName && germanName.toLowerCase() === row.pokemon.toLowerCase()) {
                      foundId = searchId;
                      speciesData = speciesTemp;
                      const displayName =
                        speciesTemp.names.find((n) => n.language.name === 'en')?.name ||
                        speciesTemp.names[0]?.name ||
                        'Unbekannt';
                      console.log(`✓ Gefunden: ${row.pokemon} = ID ${foundId} (${displayName})`);
                      break;
                    }
                  } catch {
                    // Überspringe Fehler bei einzelnen IDs
                    continue;
                  }
                }
              }

              if (foundId) {
                const pokeRes = await fetch(
                  `https://pokeapi.co/api/v2/pokemon/${foundId}`
                );
                if (pokeRes.ok) {
                  pokeData = (await pokeRes.json()) as PokeAPIPokemonResponse;
                }
              }
            }

            // Wenn immer noch nicht gefunden, Fehler
            if (!pokeData) {
              results.errors.push(`Pokémon "${row.pokemon}" nicht gefunden (weder als englischer Name, deutscher Name noch als ID)`);
              continue;
            }

            // Species-Daten laden (falls noch nicht geladen)
            if (!speciesData) {
              const speciesRes = await fetch(pokeData.species.url);
              if (!speciesRes.ok) {
                results.errors.push(
                  `Pokémon "${row.pokemon}" gefunden, aber Species-Daten konnten nicht geladen werden`
                );
                continue;
              }
              speciesData = (await speciesRes.json()) as PokeAPISpeciesResponse;
            }

            if (!speciesData) {
              results.errors.push(
                `Pokémon "${row.pokemon}" gefunden, aber Species-Daten fehlten`
              );
              continue;
            }

            // Deutscher Name
            const germanName =
              speciesData.names.find((n) => n.language.name === 'de')?.name ||
              pokeData.name;

            // Stats extrahieren
            const stats = pokeData.stats.reduce<Record<string, number>>((acc, stat) => {
              acc[stat.stat.name.replace('-', '_')] = stat.base_stat;
              return acc;
            }, {});

            // Typen extrahieren
            const types = pokeData.types.map((t) => t.type.name).join(',');

            // Sprite URL
            const spriteUrl =
              pokeData.sprites.other?.['official-artwork']?.front_default ||
              pokeData.sprites.front_default;

            // Pokémon in DB speichern
            pokemon = await prisma.pokemon.create({
              data: {
                pokedexId: pokeData.id,
                name: pokeData.name,
                nameGerman: germanName,
                types: types,
                spriteUrl: spriteUrl,
                hp: stats.hp || 0,
                attack: stats.attack || 0,
                defense: stats.defense || 0,
                spAttack: stats.special_attack || 0,
                spDefense: stats.special_defense || 0,
                speed: stats.speed || 0,
              },
            });

            pokemonByNameMap.set(pokemon.name.toLowerCase(), pokemon);
            pokemonByIdMap.set(pokemon.pokedexId, pokemon);
            results.pokemonSynced++;
          } catch (syncError) {
            results.errors.push(
              `Fehler beim Synchronisieren von "${row.pokemon}": ${getErrorMessage(
                syncError
              )}`
            );
            continue;
          }
        }

        // 4. Encounter erstellen (prüfe ob bereits vorhanden)
        const existingEncounter = await prisma.encounter.findFirst({
          where: {
            playerId: player.id,
            routeId: route.id,
          },
        });

        if (existingEncounter) {
          results.errors.push(`${player.name} hat bereits ein Pokémon auf ${route.name} (wird übersprungen)`);
          continue;
        }

        await prisma.encounter.create({
          data: {
            playerId: player.id,
            routeId: route.id,
            pokemonId: pokemon.id,
            nickname: row.nickname || null,
          },
        });

        results.encountersCreated++;
      } catch (rowError) {
        results.errors.push(
          `Fehler bei "${row.route} / ${row.player} / ${row.pokemon}": ${getErrorMessage(
            rowError
          )}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import abgeschlossen: ${results.encountersCreated} Encounters erstellt, ${results.routesCreated} Routen erstellt, ${results.pokemonSynced} Pokémon synchronisiert`,
      details: results,
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      {
        error: 'Fehler beim Importieren der CSV-Datei',
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

