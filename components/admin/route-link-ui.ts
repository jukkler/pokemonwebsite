import type { EncounterAdminTarget } from '@/lib/encounter-admin';

export interface EncounterRouteLinkTarget {
  route: {
    id: number;
    name: string;
  };
  encounters: EncounterAdminTarget[];
  /** Number of players expected to have one encounter on this route. */
  expectedPlayerCount?: number;
}

export interface EncounterRouteLinkState {
  memberCount: number;
  expectedPlayerCount: number;
  missingPlayerCount: number;
  isComplete: boolean;
  isStatusMixed: boolean;
  isTeamSlotMixed: boolean;
  allActive: boolean;
  hasInactiveMembers: boolean;
  teamSlot: number | null | 'mixed';
  canAssignToTeam: boolean;
  blockedReasons: string[];
}

export function getEncounterRouteLinkState(
  link: EncounterRouteLinkTarget,
): EncounterRouteLinkState {
  const uniquePlayerCount = new Set(
    link.encounters.map((encounter) => encounter.player.id),
  ).size;
  const expectedPlayerCount = Math.max(
    uniquePlayerCount,
    link.expectedPlayerCount ?? uniquePlayerCount,
  );
  const missingPlayerCount = Math.max(0, expectedPlayerCount - uniquePlayerCount);
  const isComplete = uniquePlayerCount > 0 && missingPlayerCount === 0;

  const statuses = new Set(
    link.encounters.map((encounter) => {
      if (encounter.isKnockedOut) return 'knocked-out';
      if (encounter.isNotCaught) return 'not-caught';
      return 'active';
    }),
  );
  const teamSlots = new Set(
    link.encounters.map((encounter) => encounter.teamSlot ?? 'none'),
  );
  const isStatusMixed = statuses.size > 1;
  const isTeamSlotMixed = teamSlots.size > 1;
  const allActive = statuses.size === 1 && statuses.has('active');
  const hasInactiveMembers = link.encounters.some(
    (encounter) => encounter.isKnockedOut || encounter.isNotCaught,
  );
  const onlyTeamSlot = teamSlots.values().next().value;
  const teamSlot = isTeamSlotMixed
    ? 'mixed'
    : onlyTeamSlot === 'none' || onlyTeamSlot === undefined
      ? null
      : Number(onlyTeamSlot);

  const blockedReasons: string[] = [];
  if (link.encounters.length === 0) {
    blockedReasons.push('Für diesen Link sind noch keine Pokémon erfasst.');
  }
  if (missingPlayerCount > 0) {
    blockedReasons.push(
      `${missingPlayerCount} von ${expectedPlayerCount} erwarteten Spieler-Encounters fehlen.`,
    );
  }
  if (isStatusMixed) {
    blockedReasons.push('Die Pokémon besitzen unterschiedliche Statuswerte.');
  }
  if (isTeamSlotMixed) {
    blockedReasons.push('Die Pokémon besitzen unterschiedliche Teamplätze.');
  }
  if (!allActive && !isStatusMixed && link.encounters.length > 0) {
    blockedReasons.push('K.O. oder nicht gefangene Links müssen zuerst reaktiviert werden.');
  }

  return {
    memberCount: link.encounters.length,
    expectedPlayerCount,
    missingPlayerCount,
    isComplete,
    isStatusMixed,
    isTeamSlotMixed,
    allActive,
    hasInactiveMembers,
    teamSlot,
    canAssignToTeam:
      link.encounters.length > 0 &&
      isComplete &&
      allActive &&
      !isStatusMixed,
    blockedReasons,
  };
}

export function pokemonDisplayName(encounter: EncounterAdminTarget) {
  return encounter.nickname || encounter.pokemon.nameGerman || encounter.pokemon.name;
}
