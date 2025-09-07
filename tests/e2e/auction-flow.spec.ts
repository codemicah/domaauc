import { test, expect } from '@playwright/test';

test.describe('DomaAuc Auction Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should display landing page with correct content', async ({ page }) => {
    // Check hero section
    await expect(page.locator('h1')).toContainText('Tokenized Domain Dutch Auctions');
    await expect(page.locator('text=Discover, bid, and acquire premium tokenized domains')).toBeVisible();
    
    // Check navigation
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Browse Listings')).toBeVisible();
    
    // Check features section
    await expect(page.locator('text=Dutch Auction Mechanism')).toBeVisible();
    await expect(page.locator('text=Secure SIWE Authentication')).toBeVisible();
    await expect(page.locator('text=Real-time Leaderboards')).toBeVisible();
  });

  test('should require authentication for dashboard access', async ({ page }) => {
    // Try to access dashboard
    await page.click('text=Dashboard');
    
    // Should show connect wallet UI
    await expect(page.locator('text=Connect your wallet to continue')).toBeVisible();
    await expect(page.locator('text=Connect Wallet')).toBeVisible();
  });

  test('should display listings page', async ({ page }) => {
    await page.goto('/dashboard/listings');
    
    // Should show auth guard
    await expect(page.locator('text=Connect your wallet to continue')).toBeVisible();
  });

  test('should handle wallet connection flow', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click connect wallet button
    await page.click('text=Connect Wallet');
    
    // Note: In a real test, we would mock the wallet connection
    // For now, we just verify the button is clickable
    await expect(page.locator('text=Connect Wallet')).toBeVisible();
  });

  test('should display create listing form when authenticated', async ({ page }) => {
    // Mock authentication by setting session cookie
    await page.context().addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict'
    }]);

    await page.goto('/dashboard');
    
    // Should show create listing form
    await expect(page.locator('text=Create New Listing')).toBeVisible();
    await expect(page.locator('text=Select Domain')).toBeVisible();
    await expect(page.locator('text=Auction Parameters')).toBeVisible();
  });

  test('should validate listing form inputs', async ({ page }) => {
    // Mock authentication
    await page.context().addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict'
    }]);

    await page.goto('/dashboard');
    
    // Try to submit form without filling required fields
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
    
    // Fill in some fields and check validation
    await page.fill('input[name="startPrice"]', '0.1');
    await page.fill('input[name="reservePrice"]', '0.05');
    await page.fill('input[name="duration"]', '24');
    
    // Submit button should still be disabled without domain selection
    await expect(submitButton).toBeDisabled();
  });

  test('should display Dutch price preview', async ({ page }) => {
    await page.context().addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict'
    }]);

    await page.goto('/dashboard');
    
    // Fill in auction parameters
    await page.fill('input[name="startPrice"]', '1.0');
    await page.fill('input[name="reservePrice"]', '0.1');
    await page.fill('input[name="duration"]', '24');
    
    // Should show price preview
    await expect(page.locator('text=Price Preview')).toBeVisible();
    await expect(page.locator('text=Current Price')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('/api/subgraph/domains*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.context().addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict'
    }]);

    await page.goto('/dashboard');
    
    // Should show error message
    await expect(page.locator('text=Failed to load domains')).toBeVisible();
  });

  test('should display listing detail page structure', async ({ page }) => {
    // Mock a listing response
    await page.route('/api/listings*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          listings: [{
            _id: 'test-listing-id',
            tokenContract: '0x1234567890123456789012345678901234567890',
            tokenId: '1',
            chainId: 'eip155:84532',
            seller: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            startPriceWei: '1000000000000000000',
            reservePriceWei: '100000000000000000',
            startAt: new Date().toISOString(),
            endAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]
        })
      });
    });

    await page.context().addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict'
    }]);

    await page.goto('/dashboard/listings/test-listing-id');
    
    // Should show listing details
    await expect(page.locator('text=Domain #1')).toBeVisible();
    await expect(page.locator('text=ACTIVE')).toBeVisible();
    await expect(page.locator('text=Time Remaining')).toBeVisible();
    await expect(page.locator('text=Base Sepolia')).toBeVisible();
  });

  test('should display offer form in listing detail', async ({ page }) => {
    // Mock listing and leaderboard responses
    await page.route('/api/listings*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          listings: [{
            _id: 'test-listing-id',
            tokenContract: '0x1234567890123456789012345678901234567890',
            tokenId: '1',
            chainId: 'eip155:84532',
            seller: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            startPriceWei: '1000000000000000000',
            reservePriceWei: '100000000000000000',
            startAt: new Date().toISOString(),
            endAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]
        })
      });
    });

    await page.route('/api/listings/*/leaderboard', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ offers: [] })
      });
    });

    await page.context().addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict'
    }]);

    await page.goto('/dashboard/listings/test-listing-id');
    
    // Should show offer form
    await expect(page.locator('text=Place Offer')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter username"]')).toBeVisible();
    await expect(page.locator('input[placeholder="0.0"]')).toBeVisible();
    await expect(page.locator('text=Current Dutch Price')).toBeVisible();
  });

  test('should validate offer form inputs', async ({ page }) => {
    // Mock responses
    await page.route('/api/listings*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          listings: [{
            _id: 'test-listing-id',
            tokenContract: '0x1234567890123456789012345678901234567890',
            tokenId: '1',
            chainId: 'eip155:84532',
            seller: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            startPriceWei: '1000000000000000000',
            reservePriceWei: '100000000000000000',
            startAt: new Date().toISOString(),
            endAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]
        })
      });
    });

    await page.route('/api/listings/*/leaderboard', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ offers: [] })
      });
    });

    await page.context().addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict'
    }]);

    await page.goto('/dashboard/listings/test-listing-id');
    
    // Try invalid username
    await page.fill('input[placeholder="Enter username"]', 'invalid username!');
    await page.fill('input[placeholder="0.0"]', '0.5');
    
    const submitButton = page.locator('button:has-text("Place Offer")');
    await expect(submitButton).toBeDisabled();
    
    // Fix username
    await page.fill('input[placeholder="Enter username"]', 'validuser123');
    await expect(submitButton).toBeEnabled();
  });
});
