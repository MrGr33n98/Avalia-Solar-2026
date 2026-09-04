import { test, expect } from '@playwright/test';

test.describe('CRM Settings Sub-Sidebar Route Integrity — Zero 404 Certification', () => {
  const settingsRoutes = [
    { name: 'General Setup', href: '/dashboard/sales/settings' },
    { name: 'Email & Signatures', href: '/dashboard/sales/settings/email' },
    { name: 'Email Templates', href: '/dashboard/sales/settings/email/templates' },
    { name: 'Team & Permissions', href: '/dashboard/sales/settings/access' },
    { name: 'Custom Fields', href: '/dashboard/sales/settings/custom-fields' },
    { name: 'API Keys', href: '/dashboard/sales/settings/api-keys' },
    { name: 'Integrations & Webhooks', href: '/dashboard/sales/settings/integrations' },
    { name: 'Activity Types', href: '/dashboard/sales/settings/activity-types' },
    { name: 'Company Types', href: '/dashboard/sales/settings/company-types' },
    { name: 'Industries', href: '/dashboard/sales/settings/industries' },
    { name: 'Markets', href: '/dashboard/sales/settings/markets' },
    { name: 'Tags', href: '/dashboard/sales/settings/tags' },
    { name: 'Territories', href: '/dashboard/sales/settings/territories' },
  ];

  for (const route of settingsRoutes) {
    test(`Settings Item: ${route.name} (${route.href}) — Assert status != 404 & page renders`, async ({ page }) => {
      const response = await page.goto(route.href, { waitUntil: 'domcontentloaded' });
      
      if (response) {
        expect(response.status()).not.toBe(404);
      }

      const pageText = await page.innerText('body');
      expect(pageText).not.toContain('This page could not be found');
      expect(pageText).not.toContain('404 | This page could not be found');
    });
  }
});
