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
    <article className="relative h-full w-full overflow-hidden border border-white/20 bg-black">
      {/* Player-Label */}
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 border-r border-b border-white/30 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white"
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
    </article>
  );
}
