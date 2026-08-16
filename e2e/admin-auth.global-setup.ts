import { chromium, type FullConfig } from '@playwright/test';
import { rm, writeFile } from 'node:fs/promises';
import { adminStorageStatePath, emptyStorageState } from './admin-auth-state';

function configBaseUrl(config: FullConfig) {
  const configured = config.projects[0]?.use.baseURL;
  return typeof configured === 'string' ? configured : 'http://127.0.0.1:3001';
}

export default async function createSharedAdminSession(config: FullConfig) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    await writeFile(adminStorageStatePath, JSON.stringify(emptyStorageState));
    return async () => rm(adminStorageStatePath, { force: true });
  }

  const isolatedTestIp = `198.51.100.${(Date.now() % 253) + 1}`;
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: configBaseUrl(config),
    extraHTTPHeaders: {
      // Lokale E2E-Läufe teilen sich nicht den produktiven IP-Zähler.
      'x-forwarded-for': isolatedTestIp,
    },
  });

  try {
    const page = await context.newPage();
    await page.goto('/login?redirect=%2Fpokeroute');
    await page.getByLabel('Benutzername').fill(username);
    await page.getByLabel('Passwort').fill(password);
    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/auth/login',
    );
    await page.getByRole('button', { name: 'Anmelden' }).click();
    const loginResponse = await loginResponsePromise;
    if (!loginResponse.ok()) {
      throw new Error(
        `Admin-E2E-Session konnte nicht erstellt werden (${loginResponse.status()}).`,
      );
    }
    await page.waitForURL((url) => url.pathname === '/pokeroute');
    await page.getByRole('link', { name: 'Admin', exact: true }).first().waitFor();
    await context.storageState({ path: adminStorageStatePath });
  } finally {
    await context.close();
    await browser.close();
  }

  return async () => rm(adminStorageStatePath, { force: true });
}
