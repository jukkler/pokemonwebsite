export const TEAM_BASE_STAT_DEFINITIONS = [
  { key: 'hp', label: 'KP' },
  { key: 'attack', label: 'Angriff' },
  { key: 'defense', label: 'Verteidigung' },
  { key: 'spAttack', label: 'Sp.-Angriff' },
  { key: 'spDefense', label: 'Sp.-Verteidigung' },
  { key: 'speed', label: 'Initiative' },
] as const;

export type TeamBaseStatKey = (typeof TEAM_BASE_STAT_DEFINITIONS)[number]['key'];

export type TeamBaseStats = Record<TeamBaseStatKey, number>;

export function getTeamPokemonTotal(pokemon: TeamBaseStats): number {
  return TEAM_BASE_STAT_DEFINITIONS.reduce(
    (total, definition) => total + pokemon[definition.key],
    0,
  );
}

export function getAverageTeamStrength(team: readonly TeamBaseStats[]): number | null {
  if (team.length === 0) return null;

  const total = team.reduce((sum, pokemon) => sum + getTeamPokemonTotal(pokemon), 0);
  return Math.round(total / team.length);
}

export function getStrongestBaseStats(pokemon: TeamBaseStats): TeamBaseStatKey[] {
  const highestValue = Math.max(
    ...TEAM_BASE_STAT_DEFINITIONS.map(definition => pokemon[definition.key]),
  );

  return TEAM_BASE_STAT_DEFINITIONS
    .filter(definition => pokemon[definition.key] === highestValue)
    .map(definition => definition.key);
}

export function getBaseStatBarWidth(value: number): number {
  return Math.max(0, Math.min(100, Math.round((value / 255) * 100)));
}
