import { expect, test } from '@playwright/test';
import { installRunComparisonMocks } from './run-comparison-fixtures';

function compareValue(url: string) {
  return new URL(url).searchParams.get('compare');
}

test.describe('Direkter Run-Vergleich', () => {
  test.describe('Desktop', () => {
    test.use({ viewport: { width: 1440, height: 1000 } });

    test('wählt genau zwei Runs, öffnet den Vergleich und stellt ihn aus der URL wieder her', async ({ page }) => {
      await installRunComparisonMocks(page);
      await page.goto('/statistik');

      await page.getByTestId('run-compare-toggle-101').click();
      await expect.poll(() => compareValue(page.url())).toBe('101');
      await page.getByTestId('run-compare-toggle-102').click();

      await expect(page.getByTestId('run-compare-toggle-101')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('run-compare-toggle-102')).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => compareValue(page.url())).toBe('101,102');
      await expect(page.getByTestId('run-compare-toggle-201')).toBeDisabled();

      const tray = page.getByTestId('run-comparison-tray');
      await expect(tray).toBeVisible();
      await expect(tray).toContainText('Run #1');
      await expect(tray).toContainText('Run #2');
      await page.getByTestId('run-comparison-open').click();

      const comparison = page.getByTestId('run-comparison');
      await expect(comparison).toBeVisible();
      await expect(page.getByTestId('run-comparison-left')).toContainText('Run #1');
      await expect(page.getByTestId('run-comparison-right')).toContainText('Run #2');
      await expect(page.getByTestId('run-comparison-metric-caught')).toContainText('8');
      await expect(page.getByTestId('run-comparison-metric-caught')).toContainText('5');
      await expect(page.getByTestId('run-comparison-metric-caught')).toContainText(/-3|−3/);
      await expect(page.getByTestId('run-comparison-metric-knockedOut')).toContainText(/\+1/);
      await expect(page.getByTestId('run-comparison-players')).toContainText('Testspieler');
      await expect(comparison).toContainText(/teilweise|nicht erfasst/i);

      await page.reload();
      await expect.poll(() => compareValue(page.url())).toBe('101,102');
      await expect(page.getByTestId('run-comparison')).toBeVisible();

      await page.goto('/statistik?game=red-blue');
      await page.goBack();
      await expect.poll(() => compareValue(page.url())).toBe('101,102');
      await expect(page.getByTestId('run-comparison')).toBeVisible();
    });

    test('tauscht die Basis, entfernt eine Seite und leert die Auswahl', async ({ page }) => {
      await installRunComparisonMocks(page);
      await page.goto('/statistik?compare=101,102');

      await expect(page.getByTestId('run-comparison')).toBeVisible();
      await page.getByTestId('run-comparison-swap').click();
      await expect.poll(() => compareValue(page.url())).toBe('102,101');
      await expect(page.getByTestId('run-comparison-left')).toContainText('Run #2');
      await expect(page.getByTestId('run-comparison-right')).toContainText('Run #1');

      await page.getByTestId('run-comparison-remove-left').click();
      await expect.poll(() => compareValue(page.url())).toBe('101');
      await expect(page.getByTestId('run-comparison')).toBeHidden();
      await expect(page.getByTestId('run-compare-toggle-101')).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('run-comparison-clear').click();
      await expect.poll(() => compareValue(page.url())).toBeNull();
      await expect(page.getByTestId('run-comparison-tray')).toBeHidden();
    });

    test('zeigt einen Ladefehler und lädt denselben Vergleich gezielt erneut', async ({ page }) => {
      await installRunComparisonMocks(page);
      let firstRequest = true;
      await page.route('**/api/runs/compare?*', async (route) => {
        if (!firstRequest) return route.fallback();
        firstRequest = false;
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Vergleich vorübergehend nicht verfügbar.' }),
        });
      });

      await page.goto('/statistik?compare=101,102');
      const comparison = page.getByTestId('run-comparison');
      await expect(comparison.getByRole('alert')).toContainText('Vergleich vorübergehend nicht verfügbar.');

      await comparison.getByRole('button', { name: 'Erneut versuchen' }).click();
      await expect(page.getByTestId('run-comparison-left')).toContainText('Run #1');
      await expect(page.getByTestId('run-comparison-right')).toContainText('Run #2');
      await expect(comparison.getByRole('alert')).toBeHidden();
    });
  });

  test.describe('Mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('zeigt den Vergleich als lesbare Karten ohne horizontalen Seiten-Scroll', async ({ page }) => {
      await installRunComparisonMocks(page);
      await page.goto('/statistik?compare=101,102');

      await expect(page.getByTestId('run-comparison')).toBeVisible();
      await expect(page.getByTestId('run-comparison-mobile-card-caught')).toBeVisible();
      await expect(page.getByTestId('run-comparison-mobile-card-knockedOut')).toBeVisible();
      await expect(page.getByTestId('run-comparison-mobile-card-caught')).toContainText(/8/);
      await expect(page.getByTestId('run-comparison-mobile-card-caught')).toContainText(/5/);
      await expect(page.getByTestId('run-comparison-mobile-card-caught')).toContainText(/-3|−3/);

      const hasHorizontalPageScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(hasHorizontalPageScroll).toBe(false);
    });
  });
});
