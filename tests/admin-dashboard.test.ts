import { describe, expect, it } from 'vitest';
import {
  buildRecentEvents,
  getPlayerTeamSummary,
  type AdminDashboardEncounter,
  type AdminDashboardPlayer,
} from '@/app/admin/dashboard-model';

const pokemon = {
  pokedexId: 25,
  name: 'pikachu',
  nameGerman: 'Pikachu',
  spriteUrl: null,
};

function createEncounter(
  id: number,
  overrides: Partial<AdminDashboardEncounter> = {}
): AdminDashboardEncounter {
  return {
    id,
    nickname: null,
    teamSlot: null,
    createdAt: new Date('2026-08-10T10:00:00.000Z'),
    isKnockedOut: false,
    koCausedBy: null,
    koReason: null,
    koDate: null,
    isNotCaught: false,
    notCaughtBy: null,
    notCaughtReason: null,
    notCaughtDate: null,
    player: { id: 1, name: 'Lukas', color: '#3b82f6' },
    pokemon,
    route: { id: 1, name: 'Route 1' },
    ...overrides,
  };
}

describe('Admin dashboard team summary', () => {
  it('maps valid team slots and reports visible free capacity', () => {
    const player: AdminDashboardPlayer = {
      id: 1,
      name: 'Lukas',
      color: '#3b82f6',
      teamMembers: [
        {
          id: 10,
          nickname: 'Sparky',
          teamSlot: 1,
          pokemon,
          route: { id: 1, name: 'Route 1' },
        },
        {
          id: 11,
          nickname: null,
          teamSlot: 4,
          pokemon: { ...pokemon, pokedexId: 1, name: 'bulbasaur' },
          route: { id: 2, name: 'Route 2' },
        },
      ],
    };

    expect(getPlayerTeamSummary(player)).toMatchObject({
      occupied: 2,
      free: 4,
      percentage: 33,
    });
    expect(getPlayerTeamSummary(player).slots.map((member) => member?.id ?? null)).toEqual([
      10,
      null,
      null,
      11,
      null,
      null,
    ]);
  });

  it('does not count invalid or duplicate slots as extra capacity', () => {
    const player: AdminDashboardPlayer = {
      id: 1,
      name: 'Lukas',
      color: '#3b82f6',
      teamMembers: [
        { id: 10, nickname: null, teamSlot: 1, pokemon, route: { id: 1, name: 'A' } },
        { id: 11, nickname: null, teamSlot: 1, pokemon, route: { id: 2, name: 'B' } },
        { id: 12, nickname: null, teamSlot: 7, pokemon, route: { id: 3, name: 'C' } },
      ],
    };

    const summary = getPlayerTeamSummary(player);
    expect(summary.occupied).toBe(1);
    expect(summary.free).toBe(5);
    expect(summary.slots[0]?.id).toBe(11);
  });
});

describe('Admin dashboard event timeline', () => {
  it('combines status changes and encounter creation in descending order', () => {
    const knockedOut = createEncounter(1, {
      isKnockedOut: true,
      koDate: new Date('2026-08-12T12:00:00.000Z'),
      koCausedBy: 'Thorben',
      koReason: 'Arena',
    });
    const notCaught = createEncounter(2, {
      createdAt: new Date('2026-08-11T10:00:00.000Z'),
      isNotCaught: true,
      notCaughtDate: new Date('2026-08-13T12:00:00.000Z'),
    });

    const events = buildRecentEvents([knockedOut, notCaught]);

    expect(events.map((event) => event.id)).toEqual([
      'not-caught-2',
      'knocked-out-1',
      'encounter-created-2',
      'encounter-created-1',
    ]);
    expect(events[1]).toMatchObject({ causedBy: 'Thorben', reason: 'Arena' });
  });

  it('keeps missing event timestamps visible but behind dated evidence', () => {
    const encounter = createEncounter(1, {
      isKnockedOut: true,
      koDate: null,
    });

    const events = buildRecentEvents([encounter]);
    expect(events.map((event) => event.id)).toEqual([
      'encounter-created-1',
      'knocked-out-1',
    ]);
    expect(events[1].occurredAt).toBeNull();
  });

  it('respects the requested evidence limit', () => {
    const encounters = Array.from({ length: 12 }, (_, index) =>
      createEncounter(index + 1, {
        createdAt: new Date(Date.UTC(2026, 7, index + 1)),
      })
    );

    expect(buildRecentEvents(encounters, 5)).toHaveLength(5);
    expect(buildRecentEvents(encounters, 5)[0].id).toBe('encounter-created-12');
  });
});
