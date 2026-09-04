import { test, expect } from '@playwright/test';

test.describe('CRM Sidebar Route Integrity — Zero 404 Certification', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for uncaught page errors and unhandled promise rejections
    page.on('pageerror', (exception) => {
      console.error(`[Page Error]: ${exception.message}`);
    });
  });

  const sidebarRoutes = [
    { name: 'Leads Workspace', href: '/dashboard/sales/leads' },
    { name: 'Fila Diária (Today)', href: '/dashboard/sales/today' },
    { name: 'Propostas Solar (Quotes)', href: '/dashboard/sales/quotes' },
    { name: 'Tarefas (Tasks)', href: '/dashboard/sales/tasks' },
    { name: 'Companies (Accounts)', href: '/dashboard/sales/accounts' },
    { name: 'People (Contacts)', href: '/dashboard/sales/people' },
    { name: 'Analytics & Reports', href: '/dashboard/sales/reports' },
    { name: 'CRM Settings', href: '/dashboard/sales/settings' },
  ];

  for (const route of sidebarRoutes) {
    test(`Navigate to ${route.name} (${route.href}) — Assert status != 404 & no 404 page`, async ({ page }) => {
      const response = await page.goto(route.href, { waitUntil: 'domcontentloaded' });
      
      // Response status must not be 404
      if (response) {
        expect(response.status()).not.toBe(404);
      }

      // Must not display default Next.js 404 error page text
      const pageText = await page.innerText('body');
      expect(pageText).not.toContain('This page could not be found');
      expect(pageText).not.toContain('404 | This page could not be found');
    });
  }
});
