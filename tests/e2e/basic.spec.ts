/**
 * Basic E2E Test - Phase 9
 * Ensures core navigation works
 */

import { test, expect } from '@playwright/test'

test.describe('ProEdit Basic Navigation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/ProEdit/)
  })

  test('should navigate to login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Sign in with Google')).toBeVisible()
  })
})
