import { test, expect } from '@playwright/test';

test.describe('Room Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-token');
      localStorage.setItem('refresh_token', 'mock-refresh-token');
    });

    // Mock API responses
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (url.includes('/auth/me') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: '1',
              email: 'test@example.com',
              username: 'testuser',
              createdAt: new Date().toISOString(),
              isActive: true,
            },
          }),
        });
      } else if (url.includes('/rooms') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'room-1',
              name: 'Test Room',
              description: 'A test room',
              ownerId: '1',
              isPublic: true,
              hasPassword: false,
              maxMembers: 10,
              currentMembers: 1,
              language: 'javascript',
              createdAt: new Date().toISOString(),
              lastActivity: new Date().toISOString(),
            },
          }),
        });
      } else if (url.includes('/rooms/room-1/join') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              room: {
                id: 'room-1',
                name: 'Test Room',
                description: 'A test room',
                language: 'javascript',
              },
              members: [
                {
                  userId: '1',
                  username: 'testuser',
                  role: 'owner',
                  isOnline: true,
                },
              ],
            },
          }),
        });
      } else if (url.includes('/rooms') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'room-1',
                name: 'Public Room',
                description: 'A public room for testing',
                ownerId: '2',
                isPublic: true,
                hasPassword: false,
                maxMembers: 10,
                currentMembers: 3,
                language: 'javascript',
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
              },
              {
                id: 'room-2',
                name: 'Private Room',
                description: 'A private room',
                ownerId: '3',
                isPublic: false,
                hasPassword: true,
                maxMembers: 5,
                currentMembers: 2,
                language: 'python',
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
              },
            ],
          }),
        });
      }
    });

    // Mock WebSocket connection
    await page.addInitScript(() => {
      // Mock Socket.io
      (window as any).io = () => ({
        connect: () => {},
        disconnect: () => {},
        emit: () => {},
        on: () => {},
        off: () => {},
        connected: true,
        id: 'mock-socket-id',
      });
    });
  });

  test('should display dashboard with available rooms', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show dashboard title
    await expect(page.getByText('Welcome to DevStudio')).toBeVisible();

    // Should show create room button
    await expect(page.getByRole('button', { name: /create room/i })).toBeVisible();

    // Should show join room button
    await expect(page.getByRole('button', { name: /join room/i })).toBeVisible();

    // Should display available rooms
    await expect(page.getByText('Public Room')).toBeVisible();
    await expect(page.getByText('Private Room')).toBeVisible();
  });

  test('should create a new room', async ({ page }) => {
    await page.goto('/dashboard');

    // Click create room button
    await page.getByRole('button', { name: /create room/i }).click();

    // Should open create room modal
    await expect(page.getByText('Create New Room')).toBeVisible();

    // Fill in room details
    await page.getByLabel(/room name/i).fill('Test Room');
    await page.getByLabel(/description/i).fill('A test room for e2e testing');
    await page.getByLabel(/programming language/i).selectOption('javascript');

    // Create the room
    await page.getByRole('button', { name: /create room/i }).click();

    // Should close modal and redirect to room
    await expect(page).toHaveURL('/room/room-1');
    await expect(page.getByText('Test Room')).toBeVisible();
  });

  test('should join an existing room', async ({ page }) => {
    await page.goto('/dashboard');

    // Click join room button
    await page.getByRole('button', { name: /join room/i }).click();

    // Should open join room modal
    await expect(page.getByText('Join Room')).toBeVisible();

    // Enter room ID
    await page.getByLabel(/room id/i).fill('room-1');

    // Join the room
    await page.getByRole('button', { name: /join room/i }).click();

    // Should close modal and redirect to room
    await expect(page).toHaveURL('/room/room-1');
    await expect(page.getByText('Test Room')).toBeVisible();
  });

  test('should join room from room card', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for rooms to load
    await expect(page.getByText('Public Room')).toBeVisible();

    // Click join button on room card
    await page.locator('[data-testid="room-card"]').first().getByRole('button', { name: /join/i }).click();

    // Should redirect to room
    await expect(page).toHaveURL('/room/room-1');
  });

  test('should show password prompt for private rooms', async ({ page }) => {
    await page.goto('/dashboard');

    // Click join room button
    await page.getByRole('button', { name: /join room/i }).click();

    // Enter private room ID
    await page.getByLabel(/room id/i).fill('room-2');

    // Should show password field
    await expect(page.getByLabel(/room password/i)).toBeVisible();

    // Enter password
    await page.getByLabel(/room password/i).fill('secret123');

    // Mock the join request for private room
    await page.route('**/api/rooms/room-2/join', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            room: {
              id: 'room-2',
              name: 'Private Room',
              description: 'A private room',
              language: 'python',
            },
            members: [],
          },
        }),
      });
    });

    // Join the room
    await page.getByRole('button', { name: /join room/i }).click();

    // Should redirect to room
    await expect(page).toHaveURL('/room/room-2');
  });

  test('should handle room creation with privacy settings', async ({ page }) => {
    await page.goto('/dashboard');

    // Open create room modal
    await page.getByRole('button', { name: /create room/i }).click();

    // Fill in basic details
    await page.getByLabel(/room name/i).fill('Private Test Room');
    await page.getByLabel(/description/i).fill('A private room');

    // Make room private
    await page.getByLabel(/private room/i).check();

    // Should show password field
    await expect(page.getByLabel(/room password/i)).toBeVisible();

    // Set password
    await page.getByLabel(/room password/i).fill('secret123');

    // Set max members
    await page.getByLabel(/maximum members/i).fill('5');

    // Create the room
    await page.getByRole('button', { name: /create room/i }).click();

    // Should redirect to room
    await expect(page).toHaveURL('/room/room-1');
  });

  test('should display room information correctly', async ({ page }) => {
    await page.goto('/dashboard');

    // Check room card information
    const roomCard = page.locator('[data-testid="room-card"]').first();
    
    await expect(roomCard.getByText('Public Room')).toBeVisible();
    await expect(roomCard.getByText('A public room for testing')).toBeVisible();
    await expect(roomCard.getByText('javascript')).toBeVisible();
    await expect(roomCard.getByText('3/10')).toBeVisible(); // member count

    // Check private room indicators
    const privateRoomCard = page.locator('[data-testid="room-card"]').nth(1);
    await expect(privateRoomCard.getByLabelText(/password protected/i)).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Should show mobile-optimized layout
    await expect(page.getByText('Welcome to DevStudio')).toBeVisible();

    // Room cards should stack vertically on mobile
    const roomCards = page.locator('[data-testid="room-card"]');
    await expect(roomCards.first()).toBeVisible();

    // Create room button should be accessible
    await page.getByRole('button', { name: /create room/i }).click();
    
    // Modal should be mobile-friendly
    await expect(page.getByText('Create New Room')).toBeVisible();
    
    // Form inputs should be touch-friendly
    const nameInput = page.getByLabel(/room name/i);
    const boundingBox = await nameInput.boundingBox();
    expect(boundingBox?.height).toBeGreaterThan(40);
  });

  test('should handle navigation between pages', async ({ page }) => {
    await page.goto('/dashboard');

    // Navigate to rooms page
    await page.getByRole('link', { name: /rooms/i }).click();
    await expect(page).toHaveURL('/rooms');

    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Navigate to profile
    await page.getByRole('link', { name: /profile/i }).click();
    await expect(page).toHaveURL('/profile');
  });
});