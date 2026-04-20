import { test, expect } from '@playwright/test';

test.describe('Order Tracking Pipeline via Socket.io', () => {
  test('Verify real-time delivery progress updates without refreshing', async ({ page, request }) => {
    // Navigate home and mock auth
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.setItem('token', 'mock_e2e_token_123'); // Ensure this links to a predictable mock user/order
    });
    
    // Jump to the Order Tracking pipeline page directly
    await page.goto('/myorders');
    
    // Wait for the Kanban/Progress cards to aggressively load via the backend fetching logic
    // We assume the first order is standard "Food Processing" default
    const orderCard = page.locator('.my-orders-order').first();
    await orderCard.waitFor({ state: 'visible' });

    // Ensure it says "Food Processing" initially
    await expect(orderCard.locator('.status-text')).toContainText(/Processing/i);

    // Extract the exact Order ID printed dynamically
    const orderText = await orderCard.locator('b.order-id-label').innerText();
    const parsedOrderId = orderText.split('#')[1].trim();

    // ── TRIGGER REAL-TIME WEBHOOK DIRECTLY TO BACKEND ──
    // Simulate an Admin shifting the Database explicitly
    const serverUrl = process.env.VITE_API_URL || 'http://localhost:4000';
    const interceptReq = await request.post(`${serverUrl}/api/order/status`, {
        data: {
            orderId: parsedOrderId,
            status: 'Out for delivery'
        },
        headers: {
            // Include fake super-admin token if the route is secure, or ignore if mocked locally natively
            'Authorization': 'mock_admin_token'
        }
    });
    expect(interceptReq.ok()).toBeTruthy();

    // ── OBSERVE THE UI STATE TRANSITION ──
    // Because Socket.IO natively pushes the result gracefully, we expect Playwright to see it shift WITHOUT a `.reload()`
    await expect(orderCard.locator('.status-text')).toContainText(/Out for delivery/i, { timeout: 8000 });

    // Validate the CSS Pulse UI mapped to Out For Delivery is actively mounted
    const iconState = orderCard.locator('.status-pulse-circle');
    await expect(iconState).toHaveClass(/delivery-active-pulse/);
  });
});
