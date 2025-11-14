/**
 * Pokémon Typ-Effektivitäts-Utilities
 * Berechnet Defensiv-Effektivität basierend auf Pokémon-Typen
 */

// Defensiv-Typ-Effektivitäts-Tabelle
export const defensiveTypeEffectiveness: { [defenseType: string]: { [attackType: string]: number } } = {
  normal: { fighting: 2, ghost: 0 },
  fire: { fire: 0.5, water: 2, grass: 0.5, ice: 0.5, ground: 2, bug: 0.5, rock: 2, steel: 0.5, fairy: 0.5 },
  water: { fire: 0.5, water: 0.5, electric: 2, grass: 2, ice: 0.5, steel: 0.5 },
  electric: { electric: 0.5, ground: 2, flying: 0.5, steel: 0.5 },
  grass: { fire: 2, water: 0.5, electric: 0.5, grass: 0.5, ice: 2, poison: 2, ground: 0.5, flying: 2, bug: 2 },
  ice: { fire: 2, ice: 0.5, fighting: 2, rock: 2, steel: 2 },
  fighting: { flying: 2, psychic: 2, bug: 0.5, rock: 0.5, dark: 0.5, fairy: 2 },
  poison: { grass: 0.5, fighting: 0.5, poison: 0.5, ground: 2, psychic: 2, bug: 0.5, fairy: 0.5 },
  ground: { water: 2, electric: 0, grass: 2, ice: 2, poison: 0.5, rock: 0.5 },
  flying: { electric: 2, grass: 0.5, ice: 2, fighting: 0.5, ground: 0, bug: 0.5, rock: 2 },
  psychic: { fighting: 0.5, psychic: 0.5, bug: 2, ghost: 2, dark: 2 },
  bug: { fire: 2, grass: 0.5, fighting: 0.5, ground: 0.5, flying: 2, rock: 2 },
  rock: { normal: 0.5, fire: 0.5, water: 2, grass: 2, fighting: 2, poison: 0.5, ground: 2, flying: 0.5, steel: 2 },
  ghost: { normal: 0, fighting: 0, poison: 0.5, bug: 0.5, ghost: 2, dark: 2 },
  dragon: { fire: 0.5, water: 0.5, electric: 0.5, grass: 0.5, ice: 2, dragon: 2, fairy: 2 },
  dark: { fighting: 2, psychic: 0, bug: 2, ghost: 0.5, dark: 0.5, fairy: 2 },
  steel: { normal: 0.5, fire: 2, grass: 0.5, ice: 0.5, fighting: 2, poison: 0, ground: 2, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, fairy: 0.5 },
  fairy: { fighting: 0.5, poison: 2, bug: 0.5, dragon: 0, dark: 0.5, steel: 2 },
};

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

// Parse Pokémon-Typen (unterstützt JSON-Array und Komma-getrennte Strings)
export function parseTypes(typesString: string): string[] {
  let types: string[] = [];
  try {
    // Versuche als JSON zu parsen
    types = JSON.parse(typesString);
  } catch {
    // Falls kein JSON, splitte nach Komma
    types = typesString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  // Normalisiere zu lowercase
  return types.map((t) => t.trim().toLowerCase()).filter(Boolean);
}

export const allPokemonTypes = Object.keys(typeNamesGerman);

export function getDefenseMultiplier(defenderTypes: string[], attackType: string): number {
  return defenderTypes.reduce((multiplier, type) => {
    const defenseData = defensiveTypeEffectiveness[type];
    if (!defenseData) {
      return multiplier;
    }
    const typeMultiplier = defenseData[attackType];
    return typeMultiplier !== undefined ? multiplier * typeMultiplier : multiplier;
  }, 1);
}

export function getGermanTypeName(type: string): string {
  return typeNamesGerman[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// Berechne Defensiv-Effektivität für ein Pokémon
export function calculateDefensiveEffectiveness(types: string[]): { [multiplier: string]: string[] } {
  const effectiveness: { [attackType: string]: number } = {};
  
  // Alle Angreifer-Typen mit 1x initialisieren
  Object.keys(typeNamesGerman).forEach(attackType => {
    effectiveness[attackType] = 1;
  });
  
  // Für jeden Verteidigungs-Typ die Multiplikatoren anwenden
  types.forEach(defenseType => {
    const defenseData = defensiveTypeEffectiveness[defenseType];
    if (defenseData) {
      Object.entries(defenseData).forEach(([attackType, multiplier]) => {
        effectiveness[attackType] *= multiplier;
      });
    }
  });
  
  // Gruppiere nach Multiplikatoren
  const grouped: { [multiplier: string]: string[] } = {};
  Object.entries(effectiveness).forEach(([attackType, mult]) => {
    const key = mult === 0 ? '0x' : `${mult}x`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(typeNamesGerman[attackType] || attackType);
  });
  
  return grouped;
}

// Formatiere Effektivitäts-String für kompakte Anzeige
export function formatEffectivenessCompact(effectiveness: { [multiplier: string]: string[] }): string {
  const parts: string[] = [];
  
  // Sortiere Multiplikatoren
  const multipliers = Object.keys(effectiveness).sort((a, b) => {
    const aVal = parseFloat(a.replace('x', '')) || 0;
    const bVal = parseFloat(b.replace('x', '')) || 0;
    return aVal - bVal;
  });
  
  // Nur nicht-neutrale Effekte zeigen
  multipliers.forEach(mult => {
    if (mult !== '1x' && effectiveness[mult] && effectiveness[mult].length > 0) {
      parts.push(`${mult}: ${effectiveness[mult].join(', ')}`);
    }
  });
  
  return parts.length > 0 ? parts.join(' • ') : 'Neutral';
}

