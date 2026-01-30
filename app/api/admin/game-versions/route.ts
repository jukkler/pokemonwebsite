/**
 * Admin API: Game Versions
 * GET /api/admin/game-versions - Liste aller Spielversionen
 */

import { withAdminAuthAndErrorHandling, success } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export async function GET() {
  return withAdminAuthAndErrorHandling(async () => {
    // Prüfe ob Versionen existieren, falls nicht: seede sie
    const count = await prisma.gameVersion.count();
    
    if (count === 0) {
      // Seede die Spielversionen inline
      const gameVersions = [
        // Generation 1
        { key: 'red', name: 'Pokémon Rot', generation: 1 },
        { key: 'blue', name: 'Pokémon Blau', generation: 1 },
        { key: 'yellow', name: 'Pokémon Gelb', generation: 1 },
        
        // Generation 2
        { key: 'gold', name: 'Pokémon Gold', generation: 2 },
        { key: 'silver', name: 'Pokémon Silber', generation: 2 },
        { key: 'crystal', name: 'Pokémon Kristall', generation: 2 },
        
        // Generation 3
        { key: 'ruby', name: 'Pokémon Rubin', generation: 3 },
        { key: 'sapphire', name: 'Pokémon Saphir', generation: 3 },
        { key: 'emerald', name: 'Pokémon Smaragd', generation: 3 },
        { key: 'firered', name: 'Pokémon Feuerrot', generation: 3 },
        { key: 'leafgreen', name: 'Pokémon Blattgrün', generation: 3 },
        
        // Generation 4
        { key: 'diamond', name: 'Pokémon Diamant', generation: 4 },
        { key: 'pearl', name: 'Pokémon Perl', generation: 4 },
        { key: 'platinum', name: 'Pokémon Platin', generation: 4 },
        { key: 'heartgold', name: 'Pokémon HeartGold', generation: 4 },
        { key: 'soulsilver', name: 'Pokémon SoulSilver', generation: 4 },
        
        // Generation 5
        { key: 'black', name: 'Pokémon Schwarz', generation: 5 },
        { key: 'white', name: 'Pokémon Weiß', generation: 5 },
        { key: 'black2', name: 'Pokémon Schwarz 2', generation: 5 },
        { key: 'white2', name: 'Pokémon Weiß 2', generation: 5 },
        
        // Generation 6
        { key: 'x', name: 'Pokémon X', generation: 6 },
        { key: 'y', name: 'Pokémon Y', generation: 6 },
        { key: 'omegaruby', name: 'Pokémon Omega Rubin', generation: 6 },
        { key: 'alphasapphire', name: 'Pokémon Alpha Saphir', generation: 6 },
        
        // Generation 7
        { key: 'sun', name: 'Pokémon Sonne', generation: 7 },
        { key: 'moon', name: 'Pokémon Mond', generation: 7 },
        { key: 'ultrasun', name: 'Pokémon Ultrasonne', generation: 7 },
        { key: 'ultramoon', name: 'Pokémon Ultramond', generation: 7 },
        { key: 'letsgopikachu', name: "Pokémon Let's Go, Pikachu!", generation: 7 },
        { key: 'letsgoeevee', name: "Pokémon Let's Go, Evoli!", generation: 7 },
        
        // Generation 8
        { key: 'sword', name: 'Pokémon Schwert', generation: 8 },
        { key: 'shield', name: 'Pokémon Schild', generation: 8 },
        { key: 'brilliantdiamond', name: 'Pokémon Strahlender Diamant', generation: 8 },
        { key: 'shiningpearl', name: 'Pokémon Leuchtende Perle', generation: 8 },
        { key: 'legendsarceus', name: 'Pokémon-Legenden: Arceus', generation: 8 },
        
        // Generation 9
        { key: 'scarlet', name: 'Pokémon Karmesin', generation: 9 },
        { key: 'violet', name: 'Pokémon Purpur', generation: 9 },
      ];
      
      await prisma.gameVersion.createMany({
        data: gameVersions,
        skipDuplicates: true,
      });
    }
    
    const versions = await prisma.gameVersion.findMany({
      orderBy: [
        { generation: 'asc' },
        { name: 'asc' },
      ],
    });

    return success(versions);
  }, 'fetching game versions');
}
