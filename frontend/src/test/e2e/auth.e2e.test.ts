import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API responses
    await page.route('**/api/auth/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (url.includes('/auth/login') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: '1',
                email: 'test@example.com',
                username: 'testuser',
                createdAt: new Date().toISOString(),
                isActive: true,
              },
              token: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
            },
          }),
        });
      } else if (url.includes('/auth/register') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: '2',
                email: 'newuser@example.com',
                username: 'newuser',
                createdAt: new Date().toISOString(),
                isActive: true,
              },
              token: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
            },
          }),
        });
      }
    });
  });

  test('should complete login flow', async ({ page }) => {
    await page.goto('/');

    // Should show login form
    await expect(page.getByText('Sign in to DevStudio')).toBeVisible();

    // Fill in login form
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome to DevStudio')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/');

    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation errors
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should complete registration flow', async ({ page }) => {
    await page.goto('/');

    // Navigate to registration
    await page.getByText(/don't have an account/i).click();
    await expect(page).toHaveURL('/register');

    // Fill in registration form
    await page.getByLabel(/username/i).fill('newuser');
    await page.getByLabel(/email address/i).fill('newuser@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('password123');

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome to DevStudio')).toBeVisible();
  });

  test('should show password mismatch error', async ({ page }) => {
    await page.goto('/register');

    // Fill in form with mismatched passwords
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('different');

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show validation error
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should navigate between login and register forms', async ({ page }) => {
    await page.goto('/');

    // Should be on login page
    await expect(page.getByText('Sign in to DevStudio')).toBeVisible();

    // Navigate to register
    await page.getByText(/don't have an account/i).click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByText('Create your DevStudio account')).toBeVisible();

    // Navigate back to login
    await page.getByText(/already have an account/i).click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Sign in to DevStudio')).toBeVisible();
  });

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/');

    // Navigate to forgot password
    await page.getByText(/forgot your password/i).click();
    await expect(page).toHaveURL('/forgot-password');

    // Fill in email
    await page.getByLabel(/email address/i).fill('test@example.com');
    
    // Mock the forgot password API
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Submit form
    await page.getByRole('button', { name: /send reset email/i }).click();

    // Should show success message
    await expect(page.getByText(/password reset email sent/i)).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Should show mobile-optimized layout
    await expect(page.getByText('Sign in to DevStudio')).toBeVisible();
    
    // Form should be properly sized for mobile
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Inputs should be touch-friendly
    const emailInput = page.getByLabel(/email address/i);
    await expect(emailInput).toBeVisible();
    
    const boundingBox = await emailInput.boundingBox();
    expect(boundingBox?.height).toBeGreaterThan(40); // Touch-friendly height
  });
});