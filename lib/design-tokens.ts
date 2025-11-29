/**
 * Design-Tokens für das Pokémon UI/UX Redesign
 * Zentrale Definitionen für Farben, Spacing, Typografie
 */

// Primärfarben
export const primaryColors = {
  blue: '#3B82F6',
  red: '#EF4444',
  black: '#000000',
  white: '#FFFFFF',
} as const;

// Pokémon Typ-Farben (24 Typen)
export const typeColors: { [key: string]: string } = {
  water: '#3B82F6',      // Blau
  dragon: '#2563EB',     // Dunkelblau
  electric: '#FBBF24',   // Gelb
  fairy: '#EC4899',       // Rosa
  ghost: '#8B5CF6',      // Lila
  fire: '#F97316',        // Orange
  ice: '#06B6D4',        // Hellblau/Türkis
  grass: '#22C55E',       // Grün
  bug: '#84CC16',         // Lime
  fighting: '#DC2626',    // Rot/Magenta
  normal: '#9CA3AF',      // Grau
  dark: '#1F2937',        // Dunkelgrau
  steel: '#14B8A6',       // Teal
  rock: '#A16207',        // Braun
  psychic: '#F87171',     // Koralle
  ground: '#D97706',      // Orange-Braun
  poison: '#A855F7',      // Lila
  flying: '#60A5FA',       // Hellblau
} as const;

// Deutsche Typ-Namen
export const typeNamesGerman: { [key: string]: string } = {
  normal: 'Normal',
  fire: 'Feuer',
  water: 'Wasser',
  electric: 'Elektro',
  grass: 'Pflanze',
  ice: 'Eis',
  fighting: 'Kampf',
  poison: 'Gift',
  ground: 'Boden',
  flying: 'Flug',
  psychic: 'Psycho',
  bug: 'Käfer',
  rock: 'Gestein',
  ghost: 'Geist',
  dragon: 'Drache',
  dark: 'Unlicht',
  steel: 'Stahl',
  fairy: 'Fee',
};

// Typ-Icons (SVG-Pfade oder Unicode-Symbole)
export const typeIcons: { [key: string]: string } = {
  water: '💧',
  dragon: '🐉',
  electric: '⚡',
  fairy: '✨',
  ghost: '👻',
  fire: '🔥',
  ice: '❄️',
  grass: '🍃',
  bug: '🐛',
  fighting: '👊',
  normal: '⚪',
  dark: '🌙',
  steel: '⚙️',
  rock: '🪨',
  psychic: '🌀',
  ground: '⛰️',
  poison: '☠️',
  flying: '🪽',
};

// Spacing-System
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '70px',
} as const;

// Schriftgrößen
export const fontSizes = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
} as const;

// Border-Radius
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const;

// Helper-Funktion: Hole Typ-Farbe
export function getTypeColor(type: string): string {
  return typeColors[type.toLowerCase()] || typeColors.normal;
}

// Helper-Funktion: Hole deutschen Typ-Namen
export function getGermanTypeName(type: string): string {
  return typeNamesGerman[type.toLowerCase()] || type;
}

// Helper-Funktion: Hole Typ-Icon
export function getTypeIcon(type: string): string {
  return typeIcons[type.toLowerCase()] || typeIcons.normal;
}

