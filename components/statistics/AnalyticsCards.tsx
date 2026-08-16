'use client';

import Image from 'next/image';
import type { AnalyticsResponse } from './types';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';

interface AnalyticsCardsProps {
  analytics: AnalyticsResponse;
}

function spriteUrl(pokedexId: number, animated: boolean, fallback: string | null): string {
  if (animated) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokedexId}.gif`;
  }
  return fallback || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexId}.png`;
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = value <= 0 ? 0 : Math.max(5, (value / Math.max(max, 1)) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-bold tabular-nums text-[var(--foreground)]">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden bg-[var(--background-tertiary)]">
        <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  const { spriteMode } = useSpriteMode();
  const playerMax = Math.max(
    1,
    ...analytics.playerStats.flatMap((player) => [player.totalKnockedOut, player.totalNotCaught, player.runsLost]),
  );
  const pokemonMax = Math.max(1, ...analytics.mostCaught.map((pokemon) => pokemon.count));

  return (
    <div className="grid grid-cols-1 gap-0 xl:grid-cols-2">
      <section className="border-b border-[var(--border-default)] p-5 xl:border-b-0 xl:border-r md:p-6" aria-labelledby="player-comparison-title">
        <div className="app-section-title">
          <h2 id="player-comparison-title" className="text-xl font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">Direkter Vergleich</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Ereignisse aus allen Runs im gewählten Bereich.</p>
        </div>
        {analytics.playerStats.length > 0 ? (
          <div className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
            {analytics.playerStats.map((player) => (
              <article key={player.playerName} className="bg-[var(--card-bg-elevated)] p-4">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="font-bold text-[var(--foreground)]">{player.playerName}</h3>
                  <span className="text-xs text-[var(--text-tertiary)]">{player.runsParticipated} Run{player.runsParticipated === 1 ? '' : 's'}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricBar label="K.O. verursacht" value={player.totalKnockedOut} max={playerMax} color="bg-rose-400" />
                  <MetricBar label="Nicht gefangen" value={player.totalNotCaught} max={playerMax} color="bg-amber-400" />
                  <MetricBar label="Runs verloren" value={player.runsLost} max={playerMax} color="bg-indigo-400" />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="border border-dashed border-[var(--border-default)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
            Für diesen Bereich liegen noch keine Spielerwerte vor.
          </p>
        )}
      </section>

      <section className="p-5 md:p-6" aria-labelledby="pokemon-ranking-title">
        <div className="app-section-title">
          <h2 id="pokemon-ranking-title" className="text-xl font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">Am häufigsten gefangen</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Rangfolge nach dokumentierten Fängen.</p>
        </div>
        {analytics.mostCaught.length > 0 ? (
          <ol className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
            {analytics.mostCaught.slice(0, 10).map((pokemon, index) => (
              <li key={pokemon.pokedexId} className="relative overflow-hidden bg-[var(--card-bg-elevated)]">
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 bg-red-500/[0.08]"
                  style={{ width: `${Math.max(8, (pokemon.count / pokemonMax) * 100)}%` }}
                />
                <div className="relative flex items-center gap-3 px-3 py-2">
                  <span className="w-5 text-center text-xs font-bold tabular-nums text-[var(--text-tertiary)]">{index + 1}</span>
                  <div className="relative h-11 w-11 shrink-0">
                    <Image
                      src={spriteUrl(pokemon.pokedexId, spriteMode === 'animated', pokemon.spriteUrl)}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-contain pixelated"
                      unoptimized
                    />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--foreground)]">
                    {pokemon.nameGerman || pokemon.name}
                  </span>
                  <span className="app-status tabular-nums">
                    {pokemon.count}×
                  </span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="border border-dashed border-[var(--border-default)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
            Für diesen Bereich wurden noch keine Fänge dokumentiert.
          </p>
        )}
      </section>

      {analytics.longestTeamMembers.length > 0 && (
        <section className="border-t border-[var(--border-default)] p-5 md:p-6 xl:col-span-2" aria-labelledby="team-members-title">
          <div className="app-section-title flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 id="team-members-title" className="text-xl font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">Längste Begleiter</h2>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">Lebensdauer des aktuellen Teams, keine historische Rangliste.</p>
          </div>
          <div className="grid gap-0 border-l border-t border-[var(--border-default)] sm:grid-cols-2 lg:grid-cols-3">
            {analytics.longestTeamMembers.map((member) => (
              <article key={`${member.playerName}-${member.pokedexId}-${member.routeName}`} className="flex items-center gap-3 border-b border-r border-[var(--border-default)] bg-[var(--card-bg-elevated)] p-3">
                <div className="relative h-14 w-14 shrink-0">
                  <Image
                    src={spriteUrl(member.pokedexId, spriteMode === 'animated', member.spriteUrl)}
                    alt=""
                    fill
                    sizes="56px"
                    className={`object-contain pixelated ${member.isActive ? '' : 'grayscale opacity-50'}`}
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[var(--foreground)]">{member.nickname || member.nameGerman || member.name}</p>
                  {member.nickname && <p className="truncate text-xs text-[var(--text-secondary)]">{member.nameGerman || member.name}</p>}
                  <p className="mt-1 truncate text-xs text-[var(--text-tertiary)]">{member.playerName} · {member.routeName}</p>
                </div>
                <span className={`text-sm font-bold tabular-nums ${member.isActive ? 'text-cyan-300' : 'text-rose-300'}`}>
                  {member.daysInTeam} T
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
