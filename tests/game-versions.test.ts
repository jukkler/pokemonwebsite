import { describe, expect, it } from 'vitest';
import { GAME_VERSIONS, getKnownGameVersion } from '@/lib/game-versions';

describe('PokeAPI game version mapping', () => {
  it('maps every selectable edition to an exact PokeAPI version and version group', () => {
    expect(GAME_VERSIONS).toHaveLength(37);
    for (const version of GAME_VERSIONS) {
      expect(version.versionSlug).not.toBe('');
      expect(version.versionGroupSlug).not.toBe('');
      expect(getKnownGameVersion(version.key)).toEqual(version);
    }
  });

  it('maps sequels and remakes to their edition-specific groups', () => {
    expect(getKnownGameVersion('black2')).toMatchObject({
      versionSlug: 'black-2',
      versionGroupSlug: 'black-2-white-2',
    });
    expect(getKnownGameVersion('brilliantdiamond')).toMatchObject({
      versionSlug: 'brilliant-diamond',
      versionGroupSlug: 'brilliant-diamond-and-shining-pearl',
    });
  });

  it('does not silently fall back for an unknown edition', () => {
    expect(getKnownGameVersion('unknown')).toBeNull();
    expect(getKnownGameVersion(null)).toBeNull();
  });
});
