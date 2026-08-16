import { describe, expect, it } from 'vitest';
import {
  buildEncounterAdminUpdate,
  parseEncounterAdminAction,
} from '@/lib/encounter-admin';

describe('individual encounter admin contract', () => {
  it('accepts only Pokémon swap and nickname actions', () => {
    expect(parseEncounterAdminAction({ action: 'swap-pokemon', pokemonId: 25 })).toEqual({
      ok: true,
      action: { action: 'swap-pokemon', pokemonId: 25 },
    });
    expect(parseEncounterAdminAction({ action: 'update-nickname', nickname: '  Sparky ' })).toEqual({
      ok: true,
      action: { action: 'update-nickname', nickname: 'Sparky' },
    });
    expect(parseEncounterAdminAction({ action: 'update-nickname', nickname: '' })).toEqual({
      ok: true,
      action: { action: 'update-nickname', nickname: null },
    });
  });

  it('rejects route-link actions on the individual contract', () => {
    for (const action of [
      { action: 'set-team-slot', teamSlot: 2 },
      { action: 'knockout', causedBy: 'Lukas', reason: null },
      { action: 'not-caught', causedBy: 'Lukas', reason: null },
      { action: 'reactivate' },
      { action: 'delete-link' },
    ]) {
      expect(parseEncounterAdminAction(action)).toMatchObject({ ok: false });
    }
  });

  it('validates IDs and nickname length', () => {
    expect(parseEncounterAdminAction({ action: 'swap-pokemon', pokemonId: 0 })).toMatchObject({ ok: false });
    expect(parseEncounterAdminAction({ action: 'swap-pokemon', pokemonId: 1.5 })).toMatchObject({ ok: false });
    expect(
      parseEncounterAdminAction({ action: 'update-nickname', nickname: 'x'.repeat(61) }),
    ).toMatchObject({ ok: false });
  });

  it('builds one-row updates without status or team fields', () => {
    expect(buildEncounterAdminUpdate({ action: 'swap-pokemon', pokemonId: 7 })).toEqual({
      ok: true,
      data: { pokemonId: 7 },
    });
    expect(buildEncounterAdminUpdate({ action: 'update-nickname', nickname: null })).toEqual({
      ok: true,
      data: { nickname: null },
    });
  });
});
