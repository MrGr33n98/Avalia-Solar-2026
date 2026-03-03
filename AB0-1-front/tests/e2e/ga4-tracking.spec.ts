import { test, expect, Request } from '@playwright/test';

/**
 * GA4 Tracking & Consent Mode v2 E2E Validation
 * 
 * Este teste valida a inicialização do GA4, o cumprimento das regras de LGPD (Consent Mode v2)
 * e o envio correto de eventos durante a navegação SPA.
 */

const GA_ID = 'G-5RV76ZKR'; // Measurement ID extraído do projeto
const CONSENT_STORAGE_KEY = 'avaliasolar_consent';

test.describe('GA4 Tracking & Consent Mode v2', () => {
  
  test.beforeEach(async ({ page }) => {
    // Garantir estado limpo antes de cada teste
    await page.addInitScript((key) => {
      window.localStorage.removeItem(key);
    }, CONSENT_STORAGE_KEY);
  });

  test('Cenário 1: Fluxo de Consentimento Inicial (Opt-in)', async ({ page }) => {
    const gaRequests: Request[] = [];
    
    // 1. Configurar interceptação de rede
    page.on('request', request => {
      const url = request.url();
      if (url.includes('google-analytics.com/g/collect') || url.includes('googletagmanager.com/gtm.js')) {
        gaRequests.push(request);
      }
    });

    // 2. Acessar a Home
    await page.goto('/');

    // 3. Verificar estado inicial do dataLayer (Consent Default = Denied)
    const dataLayerDefault = await page.evaluate(() => {
      return (window as any).dataLayer?.find((item: any) => item[0] === 'consent' && item[1] === 'default');
    });
    
    expect(dataLayerDefault).toBeDefined();
    expect(dataLayerDefault[2]).toMatchObject({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });

    // 4. Aguardar exibição do banner (delay de 2s configurado no componente)
    const acceptButton = page.getByRole('button', { name: 'Aceitar Tudo' });
    await expect(acceptButton).toBeVisible({ timeout: 5000 });

    // 5. Aceitar Cookies e validar atualização
    await acceptButton.click();
    await expect(acceptButton).not.toBeVisible();

    // 6. Verificar persistência no localStorage
    const storedConsent = await page.evaluate((key) => localStorage.getItem(key), CONSENT_STORAGE_KEY);
    expect(JSON.parse(storedConsent!)).toMatchObject({
      analytics: true,
      marketing: true
    });

    // 7. Verificar dataLayer UPDATE (Consent Mode v2)
    const dataLayerUpdate = await page.evaluate(() => {
      return (window as any).dataLayer?.filter((item: any) => item[0] === 'consent' && item[1] === 'update').pop();
    });
    
    expect(dataLayerUpdate).toBeDefined();
    expect(dataLayerUpdate[2]).toMatchObject({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });

    // 8. Verificar se o request de coleta do GA4 foi disparado após o consentimento
    // O GA4 demora alguns segundos para processar o update e enviar o primeiro ping
    await page.waitForTimeout(3000);
    const collectRequest = gaRequests.find(r => r.url().includes('/g/collect'));
    expect(collectRequest).toBeDefined();
    
    // Validar Measurement ID (tid) e Consent Status (gcs) no payload
    const requestUrl = collectRequest!.url();
    expect(requestUrl).toContain(`tid=${GA_ID}`);
    // gcs=G111 significa que todos os consentimentos foram concedidos (111)
    expect(requestUrl).toContain('gcs=G111');
  });

  test('Cenário 2: Navegação SPA com Consentimento Prévio', async ({ page }) => {
    const pageViews: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/g/collect')) {
        pageViews.push(request.url());
      }
    });

    // 1. Simular usuário que já aceitou cookies anteriormente
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, JSON.stringify({
        analytics: true,
        marketing: true,
        lastUpdated: Date.now()
      }));
    }, CONSENT_STORAGE_KEY);

    // 2. Acessar a Home
    await page.goto('/');
    
    // 3. Aguardar inicialização do Lazy Load (1.5s para usuários com consentimento)
    await page.waitForTimeout(3000);
    const initialPageViews = pageViews.filter(url => url.includes('en=page_view')).length;
    expect(initialPageViews).toBeGreaterThan(0);

    // 4. Navegar via Link (Transição SPA)
    // Procurar por links de categorias ou navegação comum
    const categoryLink = page.locator('a[href*="/categoria/"]').first();
    if (await categoryLink.isVisible()) {
      await categoryLink.click();
      
      // 5. Validar novo Page View disparado
      await page.waitForTimeout(2000);
      const newPageViews = pageViews.filter(url => url.includes('en=page_view')).length;
      expect(newPageViews).toBeGreaterThan(initialPageViews);
    } else {
      console.warn('Link de categoria não encontrado, pulando asserção de clique SPA');
    }
  });

  test('Cenário 3: Recusa de Cookies bloqueia Tracking de Identificação', async ({ page }) => {
    const gaRequests: Request[] = [];
    page.on('request', request => {
      if (request.url().includes('/g/collect')) {
        gaRequests.push(request);
      }
    });

    await page.goto('/');
    const declineButton = page.getByRole('button', { name: 'Recusar' });
    await expect(declineButton).toBeVisible({ timeout: 5000 });

    // 1. Recusar Cookies
    await declineButton.click();
    await page.waitForTimeout(2000);

    // 2. Verificar que o localStorage marca recusa
    const storedConsent = await page.evaluate((key) => localStorage.getItem(key), CONSENT_STORAGE_KEY);
    expect(JSON.parse(storedConsent!)).toMatchObject({
      analytics: false,
      marketing: false
    });

    // 3. Validar Pings de Consentimento (GA4 pode enviar pings sem cookies)
    // gcs=G100 significa: Google Consent Status - denied para tudo (00)
    const collectRequests = gaRequests.filter(r => r.url().includes('/g/collect'));
    for (const req of collectRequests) {
      expect(req.url()).toContain('gcs=G100');
    }
  });
});
