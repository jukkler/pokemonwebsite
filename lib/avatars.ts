/**
 * Avatar-Konfiguration für Spieler
 * Vordefinierte Trainer-Sprites und eigene Uploads
 */

// Basis-URL für PokeAPI Sprites (andere Sprites, da Trainer-Sprites nicht verfügbar sind)
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

export const AVATAR_OPTIONS = [
  { key: 'none', label: 'Kein Avatar', url: null },
  // Starter-Pokémon als Avatar-Optionen
  { key: 'pikachu', label: 'Pikachu', url: `${SPRITE_BASE}/25.png` },
  { key: 'bulbasaur', label: 'Bisasam', url: `${SPRITE_BASE}/1.png` },
  { key: 'charmander', label: 'Glumanda', url: `${SPRITE_BASE}/4.png` },
  { key: 'squirtle', label: 'Schiggy', url: `${SPRITE_BASE}/7.png` },
  { key: 'eevee', label: 'Evoli', url: `${SPRITE_BASE}/133.png` },
  { key: 'meowth', label: 'Mauzi', url: `${SPRITE_BASE}/52.png` },
  { key: 'jigglypuff', label: 'Pummeluff', url: `${SPRITE_BASE}/39.png` },
  { key: 'psyduck', label: 'Enton', url: `${SPRITE_BASE}/54.png` },
  { key: 'snorlax', label: 'Relaxo', url: `${SPRITE_BASE}/143.png` },
  { key: 'gengar', label: 'Gengar', url: `${SPRITE_BASE}/94.png` },
  { key: 'lucario', label: 'Lucario', url: `${SPRITE_BASE}/448.png` },
  { key: 'charizard', label: 'Glurak', url: `${SPRITE_BASE}/6.png` },
] as const;

export type AvatarKey = typeof AVATAR_OPTIONS[number]['key'];

/**
 * Prüft, ob ein Wert eine URL ist (eigener Upload)
 */
function isUrl(value: string): boolean {
  return value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://');
}

/**
 * Ermittelt die Avatar-URL aus einem Key oder einer URL
 */
export function getAvatarUrl(avatarKey: string | null | undefined): string | null {
  if (!avatarKey || avatarKey === 'none') return null;
  
  // Falls es bereits eine URL ist (eigener Upload)
  if (isUrl(avatarKey)) {
    return avatarKey;
  }
  
  // Sonst in den vordefinierten Avataren suchen
  const avatar = AVATAR_OPTIONS.find(a => a.key === avatarKey);
  return avatar?.url || null;
}

/**
 * Ermittelt den Avatar-Label aus einem Key
 */
export function getAvatarLabel(avatarKey: string | null | undefined): string {
  if (!avatarKey || avatarKey === 'none') return 'Kein Avatar';
  
  // Falls es eine URL ist
  if (isUrl(avatarKey)) {
    return 'Eigener Avatar';
  }
  
  const avatar = AVATAR_OPTIONS.find(a => a.key === avatarKey);
  return avatar?.label || avatarKey;
}
