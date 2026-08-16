import { describe, expect, it } from 'vitest';
import type { EncounterAdminTarget } from '@/lib/encounter-admin';
import { getEncounterRouteLinkState } from '@/components/admin/route-link-ui';

function encounter(
  id: number,
  playerId: number,
  overrides: Partial<EncounterAdminTarget> = {},
): EncounterAdminTarget {
  return {
    id,
    nickname: null,
    teamSlot: null,
    isKnockedOut: false,
    koCausedBy: null,
    koReason: null,
    koDate: null,
    isNotCaught: false,
    notCaughtBy: null,
    notCaughtReason: null,
    notCaughtDate: null,
    player: { id: playerId, name: `Spieler ${playerId}`, color: '#3b82f6' },
    route: { id: 7, name: 'Route 7' },
    pokemon: {
      id,
      pokedexId: id,
      name: `pokemon-${id}`,
      nameGerman: null,
      spriteUrl: null,
      spriteGifUrl: null,
    },
    ...overrides,
  };
}

describe('Route link UI state', () => {
  it('keeps incomplete links visible but blocks a team-slot assignment', () => {
    const state = getEncounterRouteLinkState({
      route: { id: 7, name: 'Route 7' },
      encounters: [encounter(1, 1), encounter(2, 2)],
      expectedPlayerCount: 3,
    });

    expect(state).toMatchObject({
      memberCount: 2,
      missingPlayerCount: 1,
      isComplete: false,
      canAssignToTeam: false,
    });
    expect(state.blockedReasons.join(' ')).toContain('fehlen');
  });

  it('allows a deliberate group assignment to repair mixed team slots', () => {
    const state = getEncounterRouteLinkState({
      route: { id: 7, name: 'Route 7' },
      encounters: [
        encounter(1, 1, { teamSlot: 1 }),
        encounter(2, 2, { teamSlot: 2 }),
      ],
      expectedPlayerCount: 2,
    });

    expect(state.isTeamSlotMixed).toBe(true);
    expect(state.teamSlot).toBe('mixed');
    expect(state.canAssignToTeam).toBe(true);
  });

  it('marks mixed statuses without hiding existing inactive members', () => {
    const state = getEncounterRouteLinkState({
      route: { id: 7, name: 'Route 7' },
      encounters: [
        encounter(1, 1),
        encounter(2, 2, {
          isKnockedOut: true,
          koCausedBy: 'Spieler 1',
          koDate: '2026-08-15T10:00:00.000Z',
        }),
      ],
      expectedPlayerCount: 2,
    });

    expect(state.isStatusMixed).toBe(true);
    expect(state.hasInactiveMembers).toBe(true);
    expect(state.canAssignToTeam).toBe(false);
  });
});
