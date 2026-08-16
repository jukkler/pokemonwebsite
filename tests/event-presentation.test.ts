import { describe, expect, it } from 'vitest';
import { getEventPresentation } from '@/lib/event-presentation';
import type { GameEvent } from '@/lib/event-store';

function event(
  type: GameEvent['type'],
  data: GameEvent['data'] = {},
): GameEvent {
  return { id: 'event-1', type, timestamp: 1, data };
}

describe('game event presentation', () => {
  it('uses the German Pokémon name and concrete KO context', () => {
    const presentation = getEventPresentation(
      event('pokemon_ko', {
        pokemonName: 'Azumarill',
        pokemonNameGerman: 'Azumarill',
        playerName: 'Lukas',
        routeName: 'Route 19',
      }),
    );

    expect(presentation).toMatchObject({
      tone: 'ko',
      visual: 'pokemon',
      headline: 'Azumarill',
      declaration: 'IST GEFALLEN',
      details: ['K.O. durch Lukas', 'Route 19'],
    });
  });

  it('gives an escaped encounter its own presentation', () => {
    const presentation = getEventPresentation(
      event('pokemon_not_caught', {
        pokemonNameGerman: 'Enekoro',
        playerName: 'Thorben',
      }),
    );

    expect(presentation.tone).toBe('escape');
    expect(presentation.declaration).toBe('IST ENTKOMMEN');
    expect(presentation.details).toEqual(['Nicht gefangen von Thorben']);
  });

  it('labels a badge milestone with its ordinal number', () => {
    const presentation = getEventPresentation(
      event('badge_unlocked', { badgeName: 'Voltorden', badgeNumber: 4 }),
    );

    expect(presentation).toMatchObject({
      tone: 'badge',
      visual: 'badge',
      headline: 'Voltorden',
      declaration: '4. ORDEN GESICHERT',
    });
  });

  it('announces a complete route link joining a team slot', () => {
    const presentation = getEventPresentation(
      event('team_link_added', {
        routeName: 'Lichtung 2',
        teamSlot: 3,
        teamMembers: [
          { pokemonName: 'Azumarill', playerName: 'Lukas' },
          { pokemonName: 'Skuntank', playerName: 'Thorben' },
          { pokemonName: 'Galvantula', pokemonNameGerman: 'Voltula', playerName: 'Timo' },
        ],
      }),
    );

    expect(presentation).toMatchObject({
      tone: 'team',
      visual: 'team',
      headline: 'LINK BERUFEN',
      declaration: 'AUF TEAMPLATZ 3',
      details: ['Lichtung 2', '3 Pokémon ziehen gemeinsam ins Team'],
    });
  });

  it('announces a complete route link moving into the box', () => {
    const presentation = getEventPresentation(
      event('team_link_boxed', {
        routeName: 'Lichtung 2',
        teamSlot: 3,
        teamMembers: [
          { pokemonName: 'Azumarill', playerName: 'Lukas' },
          { pokemonName: 'Skuntank', playerName: 'Thorben' },
          { pokemonName: 'Galvantula', pokemonNameGerman: 'Voltula', playerName: 'Timo' },
        ],
      }),
    );

    expect(presentation).toMatchObject({
      tone: 'box',
      visual: 'team',
      headline: 'IN DIE BOX GELEGT',
      declaration: 'TEAMPLATZ 3 IST WIEDER FREI',
      details: ['Lichtung 2', '3 Pokémon wurden gemeinsam eingelagert'],
    });
  });

  it.each([
    ['run_completed', 'victory', 'SIEG', 'RUN #11 GEWONNEN'],
    ['run_failed', 'failure', 'GESCHEITERT', 'RUN #11'],
  ] as const)('presents %s as a cinematic run outcome', (type, tone, headline, declaration) => {
    expect(getEventPresentation(event(type, { runNumber: 11 }))).toMatchObject({
      tone,
      headline,
      declaration,
    });
  });
});
