import { test, expect } from '@playwright/test';

test.describe('UI and Theme Persistence', () => {
  test('Toggling dark mode applies securely to html.dark and survives hard reload', async ({ page }) => {
    // Navigate home
    await page.goto('/');

    // Validate default theme (should explicitly NOT contain 'dark' unless localStorage pre-seeded)
    const htmlNode = page.locator('html');

    // Make sure we start in light mode for the test baseline natively
    await page.evaluate(() => {
        localStorage.setItem('theme', 'light');
    });
    await page.reload();

    await expect(htmlNode).not.toHaveClass(/dark/);

    // Find the toggle button in Navbar
    const themeToggleBtn = page.locator('.theme-toggle-btn').first();
    await themeToggleBtn.click();

    // Directly evaluate the DOM constraint
    await expect(htmlNode).toHaveClass(/dark/);

    // Optionally check if a specific structural block transitioned accurately
    // The specific `bg-white` class for the BiteBlitz image wrapper in Navbar.jsx
    const logoImg = page.locator('img[alt="BiteBlitz"]').first();
    await expect(logoImg).toHaveClass(/bg-white/);

    // Hard Reload purely
    await page.reload();

    // Verify Dark Mode persisted flawlessly from the Context engine bootstrapping local storage
    await expect(htmlNode).toHaveClass(/dark/);
    await expect(logoImg).toHaveClass(/bg-white/);
  });
});
