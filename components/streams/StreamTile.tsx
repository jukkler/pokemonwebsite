'use client';

/**
 * StreamTile - Einzelne Stream-Kachel mit YouTube-Embed und Team-Overlay
 */

import TeamOverlay from './TeamOverlay';
import { extractYouTubeId } from '@/lib/youtube-utils';

interface TeamPokemon {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  spriteUrl: string | null;
  spriteGifUrl: string | null;
}

interface TeamEncounter {
  teamSlot: number | null;
  pokemon: TeamPokemon;
}

interface StreamPlayer {
  name: string;
  color: string;
  encounters: TeamEncounter[];
}

interface StreamData {
  id: number;
  url: string;
  player: StreamPlayer;
}

interface StreamTileProps {
  stream: StreamData;
}

export default function StreamTile({ stream }: StreamTileProps) {
  const videoId = extractYouTubeId(stream.url);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Player-Label */}
      <div
        className="absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs font-bold text-white pointer-events-none"
        style={{ backgroundColor: stream.player.color }}
      >
        {stream.player.name}
      </div>

      {/* YouTube iframe */}
      {videoId ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 0 }}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          Ungültige YouTube-URL
        </div>
      )}

      {/* Team-Overlay */}
      <TeamOverlay encounters={stream.player.encounters} />
    </div>
  );
}
