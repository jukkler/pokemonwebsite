export type DefensiveCoverageKind =
  | 'immune'
  | 'strong-resistance'
  | 'resistance'
  | 'neutral'
  | 'weakness'
  | 'critical';

export const typeAbbreviations: Record<string, string> = {
  normal: 'Nor',
  fire: 'Feu',
  water: 'Was',
  electric: 'Ele',
  grass: 'Pfl',
  ice: 'Eis',
  fighting: 'Kpf',
  poison: 'Gif',
  ground: 'Bod',
  flying: 'Flu',
  psychic: 'Psy',
  bug: 'Käf',
  rock: 'Ges',
  ghost: 'Gei',
  dragon: 'Dra',
  dark: 'Unl',
  steel: 'Sta',
  fairy: 'Fee',
};

export function getDefensiveCoverageKind(multiplier: number): DefensiveCoverageKind {
  if (multiplier === 0) return 'immune';
  if (multiplier <= 0.25) return 'strong-resistance';
  if (multiplier < 1) return 'resistance';
  if (multiplier >= 4) return 'critical';
  if (multiplier > 1) return 'weakness';
  return 'neutral';
}

export function formatDefensiveMultiplier(multiplier: number): string {
  if (multiplier === 0) return '0×';
  if (multiplier === 0.25) return '¼×';
  if (multiplier === 0.5) return '½×';
  return `${multiplier}×`;
}

export function describeDefensiveMultiplier(multiplier: number): string {
  if (multiplier === 0) return 'immun, kein Schaden';
  if (multiplier === 0.25) return 'stark resistent, ein Viertel des Schadens';
  if (multiplier === 0.5) return 'resistent, halber Schaden';
  if (multiplier === 1) return 'neutraler Schaden';
  if (multiplier === 2) return 'Schwäche, doppelter Schaden';
  if (multiplier === 4) return 'kritische Schwäche, vierfacher Schaden';
  return `${multiplier}-facher Schaden`;
}
