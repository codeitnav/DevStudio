import { test, expect } from '@playwright/test';

test.describe('Collaborative Editing E2E Tests', () => {
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
      } else if (url.includes('/rooms/room-1') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'room-1',
              name: 'Collaboration Room',
              description: 'A room for testing collaboration',
              ownerId: '1',
              isPublic: true,
              hasPassword: false,
              maxMembers: 10,
              currentMembers: 2,
              language: 'javascript',
              createdAt: new Date().toISOString(),
              lastActivity: new Date().toISOString(),
            },
          }),
        });
      } else if (url.includes('/rooms/room-1/files') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'file-1',
                name: 'index.js',
                path: '/index.js',
                type: 'file',
                language: 'javascript',
                content: 'console.log("Hello, World!");',
                size: 28,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'folder-1',
                name: 'src',
                path: '/src',
                type: 'folder',
                children: [
                  {
                    id: 'file-2',
                    name: 'app.js',
                    path: '/src/app.js',
                    type: 'file',
                    language: 'javascript',
                    content: 'function main() {\n  console.log("App started");\n}',
                    size: 45,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        });
      } else if (url.includes('/rooms/room-1/members') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                userId: '1',
                username: 'testuser',
                role: 'owner',
                isOnline: true,
                joinedAt: new Date().toISOString(),
                color: '#3B82F6',
              },
              {
                userId: '2',
                username: 'collaborator',
                role: 'member',
                isOnline: true,
                joinedAt: new Date().toISOString(),
                color: '#EF4444',
              },
            ],
          }),
        });
      }
    });

    // Mock WebSocket and Yjs
    await page.addInitScript(() => {
      // Mock Socket.io
      const mockSocket = {
        connect: () => {},
        disconnect: () => {},
        emit: () => {},
        on: (event: string, callback: Function) => {
          // Store callbacks for later use
          (window as any).socketCallbacks = (window as any).socketCallbacks || {};
          (window as any).socketCallbacks[event] = callback;
        },
        off: () => {},
        connected: true,
        id: 'mock-socket-id',
      };

      (window as any).io = () => mockSocket;

      // Mock Yjs
      (window as any).Y = {
        Doc: class {
          getText() {
            return {
              toString: () => 'console.log("Hello, World!");',
              observe: () => {},
              unobserve: () => {},
              insert: () => {},
              delete: () => {},
            };
          }
          destroy() {}
          on() {}
          off() {}
        },
      };

      // Mock y-websocket
      (window as any).WebsocketProvider = class {
        constructor() {}
        connect() {}
        disconnect() {}
        destroy() {}
        on() {}
        off() {}
      };
    });
  });

  test('should display room with editor and file explorer', async ({ page }) => {
    await page.goto('/room/room-1');

    // Should show room name
    await expect(page.getByText('Collaboration Room')).toBeVisible();

    // Should show file explorer
    await expect(page.getByText('File Explorer')).toBeVisible();
    await expect(page.getByText('index.js')).toBeVisible();
    await expect(page.getByText('src')).toBeVisible();

    // Should show code editor
    await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();

    // Should show active users
    await expect(page.getByText('Active Users')).toBeVisible();
    await expect(page.getByText('testuser')).toBeVisible();
    await expect(page.getByText('collaborator')).toBeVisible();
  });

  test('should open files in editor', async ({ page }) => {
    await page.goto('/room/room-1');

    // Wait for file explorer to load
    await expect(page.getByText('index.js')).toBeVisible();

    // Click on a file
    await page.getByText('index.js').click();

    // Should load file content in editor
    await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();
    
    // Should show file name in editor tab
    await expect(page.getByText('index.js')).toBeVisible();
  });

  test('should expand and collapse folders', async ({ page }) => {
    await page.goto('/room/room-1');

    // Should show folder
    await expect(page.getByText('src')).toBeVisible();

    // Click to expand folder
    await page.getByText('src').click();

    // Should show folder contents
    await expect(page.getByText('app.js')).toBeVisible();

    // Click to collapse folder
    await page.getByText('src').click();

    // Folder contents should be hidden
    await expect(page.getByText('app.js')).not.toBeVisible();
  });

  test('should create new files and folders', async ({ page }) => {
    await page.goto('/room/room-1');

    // Mock file creation API
    await page.route('**/api/rooms/room-1/files', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-file-1',
              name: postData.name,
              path: `/${postData.name}`,
              type: postData.type,
              language: postData.language || 'javascript',
              content: postData.content || '',
              size: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        });
      }
    });

    // Right-click in file explorer to open context menu
    await page.locator('[data-testid="file-explorer"]').click({ button: 'right' });

    // Should show context menu
    await expect(page.getByText('New File')).toBeVisible();
    await expect(page.getByText('New Folder')).toBeVisible();

    // Create new file
    await page.getByText('New File').click();

    // Should show create file modal
    await expect(page.getByText('Create New File')).toBeVisible();

    // Fill in file details
    await page.getByLabel(/file name/i).fill('newfile.js');
    await page.getByRole('button', { name: /create file/i }).click();

    // Should show new file in explorer
    await expect(page.getByText('newfile.js')).toBeVisible();
  });

  test('should show typing indicators', async ({ page }) => {
    await page.goto('/room/room-1');

    // Open a file
    await page.getByText('index.js').click();

    // Simulate another user typing
    await page.evaluate(() => {
      const callback = (window as any).socketCallbacks?.['typing'];
      if (callback) {
        callback({
          userId: '2',
          username: 'collaborator',
          isTyping: true,
          fileId: 'file-1',
        });
      }
    });

    // Should show typing indicator
    await expect(page.getByText('collaborator is typing...')).toBeVisible();

    // Simulate user stopped typing
    await page.evaluate(() => {
      const callback = (window as any).socketCallbacks?.['typing'];
      if (callback) {
        callback({
          userId: '2',
          username: 'collaborator',
          isTyping: false,
          fileId: 'file-1',
        });
      }
    });

    // Typing indicator should disappear
    await expect(page.getByText('collaborator is typing...')).not.toBeVisible();
  });

  test('should show user presence indicators', async ({ page }) => {
    await page.goto('/room/room-1');

    // Should show online users
    await expect(page.getByText('testuser')).toBeVisible();
    await expect(page.getByText('collaborator')).toBeVisible();

    // Should show user avatars with colors
    await expect(page.locator('[data-testid="user-avatar"]')).toHaveCount(2);

    // Simulate user leaving
    await page.evaluate(() => {
      const callback = (window as any).socketCallbacks?.['user:left'];
      if (callback) {
        callback({ userId: '2' });
      }
    });

    // User should be removed from active list
    await expect(page.getByText('collaborator')).not.toBeVisible();
    await expect(page.locator('[data-testid="user-avatar"]')).toHaveCount(1);
  });

  test('should handle language changes', async ({ page }) => {
    await page.goto('/room/room-1');

    // Open a file
    await page.getByText('index.js').click();

    // Should show language selector
    await expect(page.getByRole('combobox', { name: /language/i })).toBeVisible();

    // Change language
    await page.getByRole('combobox', { name: /language/i }).selectOption('python');

    // Should update syntax highlighting
    // Note: This would require Monaco Editor to be properly loaded
    // In a real test, we'd verify the editor's language mode changed
  });

  test('should show save indicator', async ({ page }) => {
    await page.goto('/room/room-1');

    // Open a file
    await page.getByText('index.js').click();

    // Should show save status
    await expect(page.getByText(/saved/i)).toBeVisible();

    // Simulate unsaved changes
    await page.evaluate(() => {
      // Trigger unsaved state
      const event = new CustomEvent('editor:changed', { detail: { hasUnsavedChanges: true } });
      window.dispatchEvent(event);
    });

    // Should show unsaved indicator
    await expect(page.getByText(/unsaved/i)).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/room/room-1');

    // Should show mobile-optimized layout
    await expect(page.getByText('Collaboration Room')).toBeVisible();

    // File explorer should be collapsible on mobile
    const fileExplorer = page.locator('[data-testid="file-explorer"]');
    await expect(fileExplorer).toBeVisible();

    // Editor should be touch-friendly
    const editor = page.locator('[data-testid="code-editor"]');
    await expect(editor).toBeVisible();

    // User list should be compact on mobile
    const userList = page.locator('[data-testid="user-list"]');
    await expect(userList).toBeVisible();
  });

  test('should handle room settings', async ({ page }) => {
    await page.goto('/room/room-1');

    // Should show room settings button (for room owner)
    await expect(page.getByRole('button', { name: /room settings/i })).toBeVisible();

    // Click room settings
    await page.getByRole('button', { name: /room settings/i }).click();

    // Should open settings modal
    await expect(page.getByText('Room Settings')).toBeVisible();

    // Should show room configuration options
    await expect(page.getByLabel(/room name/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/maximum members/i)).toBeVisible();
  });

  test('should handle leaving room', async ({ page }) => {
    await page.goto('/room/room-1');

    // Mock leave room API
    await page.route('**/api/rooms/room-1/leave', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Should show leave room button
    await expect(page.getByRole('button', { name: /leave room/i })).toBeVisible();

    // Click leave room
    await page.getByRole('button', { name: /leave room/i }).click();

    // Should show confirmation dialog
    await expect(page.getByText('Are you sure you want to leave this room?')).toBeVisible();

    // Confirm leaving
    await page.getByRole('button', { name: /leave/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});