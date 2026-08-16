/**
 * Design-Tokens für das Pokémon UI/UX Redesign
 * Zentrale Definitionen für Farben, Spacing, Typografie
 */

// Sports-editorial Primärfarben. Synchron mit app/globals.css.
export const primaryColors = {
  navy: '#061A32',
  blue: '#1648D8',
  red: '#ED171E',
  green: '#1F7A3F',
  gold: '#E3A114',
  black: '#081426',
  white: '#FFFFFF',
} as const;

export const editorialTheme = {
  light: {
    background: '#FFFFFF',
    surfaceSubtle: '#F3F5F7',
    foreground: '#081426',
    border: '#CFD5DC',
  },
  dark: {
    background: '#07111F',
    surfaceSubtle: '#141D29',
    foreground: '#F4F7FB',
    border: '#2B3A4C',
  },
  playerFallbacks: ['#ED171E', '#1648D8', '#1F7A3F'],
} as const;

// Pokémon Typ-Farben (Custom Colors)
export const typeColors: { [key: string]: string } = {
  normal: '#aab09f',
  fire: '#ea7a3c',
  water: '#539ae2',
  electric: '#e5c531',
  grass: '#71c558',
  ice: '#70cbd4',
  fighting: '#cb5f48',
  poison: '#b468b7',
  ground: '#cc9f4f',
  flying: '#7da6dc',
  psychic: '#e5709b',
  bug: '#94bc4a',
  rock: '#b2a061',
  ghost: '#846ab6',
  dragon: '#6a7baf',
  dark: '#736c75',
  steel: '#89a1b0',
  fairy: '#e397d1',
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
  sm: '2px',
  md: '4px',
  lg: '6px',
  xl: '8px',
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

// =============================================================================
// Theme System (Dark + Light)
// =============================================================================

// Dark Theme Farben
export const darkTheme = {
  background: {
    primary: '#07111f',
    secondary: '#0c1725',
    tertiary: '#142131',
  },
  border: {
    default: '#2b3a4c',
    hover: 'rgba(var(--player-color-rgb), 0.5)',
  },
  text: {
    primary: '#ffffff',
    secondary: '#b0bdcb',
    tertiary: '#8492a3',
  },
  glass: {
    background: '#07111f',
    blur: '0px',
    border: '#2b3a4c',
  }
} as const;

// Light Theme Farben
export const lightTheme = {
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fb',
    tertiary: '#f3f5f7',
  },
  border: {
    default: '#cfd5dc',
    hover: 'rgba(var(--player-color-rgb), 0.5)',
  },
  text: {
    primary: '#081426',
    secondary: '#526071',
    tertiary: '#788493',
  },
  glass: {
    background: '#ffffff',
    blur: '0px',
    border: '#d7dce2',
  }
} as const;

// Bento Grid Spacing
export const bentoSpacing = {
  gap: '16px',
  cardPadding: '24px',
  innerGap: '12px',
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Konvertiert Hex-Farbe zu RGB-String für CSS Variables
 * @param hex - Hex-Farbe (z.B. "#3B82F6")
 * @returns RGB-String (z.B. "59, 130, 246")
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '59, 130, 246'; // fallback blue
}

