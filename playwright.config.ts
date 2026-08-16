import { defineConfig, devices } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { adminStorageStatePath } from './e2e/admin-auth-state';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3001';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/admin-auth.global-setup.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  outputDir: join(tmpdir(), 'pokemonwebsite-playwright-results'),
  use: {
    baseURL,
    storageState: adminStorageStatePath,
    ...devices['Desktop Chrome'],
    locale: 'de-DE',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
});
