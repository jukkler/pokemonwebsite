'use client';

/**
 * StreamGrid - Auto-Layout Grid für Stream-Kacheln
 * Berechnet das optimale Layout basierend auf Viewport-Größe und 16:9 Seitenverhältnis
 */

import { useState, useEffect, useRef } from 'react';
import StreamTile from './StreamTile';

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

interface StreamGridProps {
  streams: StreamData[];
}

/**
 * Findet das Layout (Spalten × Zeilen) das die maximale Videofläche ergibt.
 * Probiert alle möglichen Spaltenanzahlen und berechnet wie viel eines 16:9
 * Videos in jede resultierende Zelle passt.
 */
function getOptimalLayout(count: number, viewportW: number, viewportH: number): { cols: number; rows: number } {
  if (count <= 0) return { cols: 0, rows: 0 };
  if (count === 1) return { cols: 1, rows: 1 };

  const ASPECT = 16 / 9;
  let bestCols = 1;
  let bestArea = 0;

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const cellW = viewportW / cols;
    const cellH = viewportH / rows;
    const cellAspect = cellW / cellH;

    let videoW: number, videoH: number;
    if (cellAspect > ASPECT) {
      // Zelle breiter als 16:9 → Höhe limitiert
      videoH = cellH;
      videoW = cellH * ASPECT;
    } else {
      // Zelle schmaler/gleich 16:9 → Breite limitiert
      videoW = cellW;
      videoH = cellW / ASPECT;
    }

    const totalArea = count * videoW * videoH;
    if (totalArea > bestArea) {
      bestArea = totalArea;
      bestCols = cols;
    }
  }

  return { cols: bestCols, rows: Math.ceil(count / bestCols) };
}

export default function StreamGrid({ streams }: StreamGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };

    update();

    const observer = new ResizeObserver(update);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  if (streams.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-lg">Keine Streams aktiv</p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Ein Admin kann Streams über das Zahnrad-Icon hinzufügen
          </p>
        </div>
      </div>
    );
  }

  const { cols, rows } = dimensions.w > 0
    ? getOptimalLayout(streams.length, dimensions.w, dimensions.h)
    : { cols: Math.ceil(Math.sqrt(streams.length)), rows: Math.ceil(streams.length / Math.ceil(Math.sqrt(streams.length))) };

  // Sonderfall 3 Streams: 2 oben, 1 unten zentriert
  const isThreeStreams = streams.length === 3 && cols === 2 && rows === 2;

  return (
    <div
      ref={containerRef}
      className="flex-1 grid gap-1 p-1 min-h-0"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {streams.map((stream, index) => (
        <div
          key={stream.id}
          style={isThreeStreams && index === 2 ? {
            gridColumn: '1 / -1',
            justifySelf: 'center',
            width: `${100 / cols}%`,
          } : undefined}
          className="min-h-0"
        >
          <StreamTile stream={stream} />
        </div>
      ))}
    </div>
  );
}
