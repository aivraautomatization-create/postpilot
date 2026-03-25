import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads and shows hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Puls/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('pricing section is visible', async ({ page }) => {
    await page.goto('/');
    const pricing = page.locator('#pricing');
    await pricing.scrollIntoViewIfNeeded();
    await expect(pricing).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('signup page loads', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page).toHaveURL(/\/auth\/signup/);
  });
});

test.describe('Protected Routes', () => {
  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Health', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');
    // Accept 200 (healthy) or 503 (degraded but responsive) — both mean the server is up
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
  });
});

test.describe('Public Wrap', () => {
  test('invalid wrap URL returns a page (not 500)', async ({ page }) => {
    const response = await page.goto('/wrap/00000000-0000-0000-0000-000000000000/2026-01');
    // Should render a not-found/empty state, not crash
    expect(response?.status()).not.toBe(500);
  });
});
