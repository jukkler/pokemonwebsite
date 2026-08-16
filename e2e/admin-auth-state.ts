import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const adminStorageStatePath = join(
  tmpdir(),
  'pokemonwebsite-playwright-admin-state.json',
);

export const emptyStorageState = {
  cookies: [],
  origins: [],
} as const;
