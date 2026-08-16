import { expect, test } from '@playwright/test';
import { installPokeradarMocks } from './fixtures';

test.describe('Mobile Auswahl und Navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('übernimmt eine mobile Auswahl und bedient das Mehr-Menü per Tastatur', async ({ page }) => {
    await installPokeradarMocks(page);
    await page.goto('/pokeradar?pokemon=4&ref=4&metric=speed');

    await page.getByRole('button', { name: 'Pokémon hinzufügen', exact: true }).click();
    const picker = page.getByRole('dialog', { name: 'Pokémon hinzufügen' });
    await expect(picker).toBeVisible();
    await picker.getByRole('button', { name: 'Schiggy zur Auswahl hinzufügen' }).click();
    await picker.getByRole('button', { name: 'Übernehmen (2)' }).click();

    await expect(picker).toBeHidden();
    await expect.poll(() => new URL(page.url()).searchParams.get('pokemon')).toBe('4,7');
    await expect(page.getByRole('button', { name: 'Schiggy als Referenz festlegen' })).toBeVisible();

    const navigation = page.getByRole('navigation', { name: 'Hauptnavigation mobil' });
    await expect(navigation.getByRole('link', { name: 'Routen' })).toHaveAttribute('href', '/pokeroute');
    await expect(navigation.getByRole('link', { name: 'Tabelle' })).toHaveAttribute('href', '/tabelle');

    const moreButton = navigation.getByRole('button', { name: 'Mehr' });
    await moreButton.click();
    const moreDialog = page.getByRole('dialog', { name: 'Mehr' });
    await expect(moreDialog).toBeVisible();
    await expect(moreDialog.getByRole('link', { name: 'Statistik' })).toHaveAttribute('href', '/statistik');
    await expect(moreDialog.getByRole('link', { name: 'Streams' })).toHaveAttribute('href', '/streams');
    await expect(moreDialog.getByRole('button', { name: /Pokémon-Bilder/ })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(moreDialog).toBeHidden();
    await expect(moreButton).toBeFocused();
  });

  test('löst den Scroll-Lock beim Wechsel in die Desktop-Ansicht', async ({ page }) => {
    await installPokeradarMocks(page);
    await page.goto('/pokeradar?pokemon=4&ref=4&metric=speed');

    await page.getByRole('button', { name: 'Pokémon hinzufügen', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Pokémon hinzufügen' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.setViewportSize({ width: 1440, height: 1000 });

    await expect(page.getByRole('dialog', { name: 'Pokémon hinzufügen' })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });
});
