# 📸 EVIDÊNCIA DE CONSENTIMENTO END-TO-END

**Projeto:** Avalia Solar  
**Data:** 2026-03-05  
**Responsável:** Data Engineer + Legal/DPO  
**Objetivo:** Comprovar compliance LGPD/GDPR com evidências visuais e logs

---

## SUMÁRIO EXECUTIVO

**Status:** ❌ **EVIDÊNCIAS NÃO COLETADAS**

Este documento define o processo de coleta de evidências de consentimento para auditoria LGPD/GDPR.

---

## 1. BANNER ATIVO - EVIDÊNCIA VISUAL

### 1.1 Screenshot do Banner

**Requisitos:**

- [ ] Screenshot em alta resolução (1920x1080 mínimo)
- [ ] Banner completo visível
- [ ] URL visível na barra de navegação
- [ ] Data/hora do sistema visível
- [ ] Browser e versão identificáveis

**Arquivo esperado:** `docs/validation/screenshots/consent-banner-active-{date}.png`

**Como capturar:**

```bash
# Método 1: Manual
1. Abrir https://avaliasolar.com.br em aba anônima
2. Aguardar 2 segundos (delay do banner)
3. Print screen (Win+Shift+S no Windows)
4. Salvar como PNG

# Método 2: Automatizado (Playwright)
npx playwright codegen https://avaliasolar.com.br
# Screenshot manual ou via script
```

**Script Playwright:**

```typescript
// scripts/capture-consent-banner.ts
import { chromium } from 'playwright';

async function captureConsentBanner() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  await page.goto('https://avaliasolar.com.br');
  
  // Aguardar banner aparecer
  await page.waitForTimeout(2500);
  await page.waitForSelector('[data-testid="cookie-banner"]', { 
    state: 'visible',
    timeout: 5000
  });
  
  // Screenshot full page
  const timestamp = new Date().toISOString().split('T')[0];
  await page.screenshot({
    path: `docs/validation/screenshots/consent-banner-active-${timestamp}.png`,
    fullPage: true
  });
  
  console.log('✅ Screenshot captured');
  await browser.close();
}

captureConsentBanner();
```

**Executar:**
```bash
cd AB0-1-front
npx ts-node scripts/capture-consent-banner.ts
```

---

### 1.2 Conteúdo do Banner

**Texto mínimo esperado:**

```markdown
**Título:** Cookies & Privacidade

**Corpo:** 
Utilizamos cookies para melhorar sua experiência e analisar o tráfego do site. 
Ao clicar em "Aceitar", você concorda com o uso de cookies conforme nossa 
[Política de Privacidade](link).

**Botões:**
- [Aceitar Tudo]
- [Recusar]
- [X] (fechar)
```

**Checklist de compliance:**
- [ ] Texto claro e objetivo (LGPD Art. 9)
- [ ] Link para política de privacidade visível
- [ ] Opção de recusar tão proeminente quanto aceitar
- [ ] Não bloqueia conteúdo principal (não é wall)
- [ ] Aparece antes de qualquer tracking

---

### 1.3 Comportamento do Banner

**Testes visuais:**

**Teste 1: First Visit**
```typescript
// cypress/e2e/consent-visual.cy.ts
it('shows banner on first visit', () => {
  cy.clearLocalStorage();
  cy.visit('/', { 
    onBeforeLoad: (win) => {
      // Garantir primeiro acesso
      win.localStorage.clear();
    }
  });
  
  // Banner não deve estar visível imediatamente
  cy.get('[data-testid="cookie-banner"]').should('not.exist');
  
  // Aguardar delay de 2s
  cy.wait(2100);
  
  // Banner deve aparecer
  cy.get('[data-testid="cookie-banner"]').should('be.visible');
  
  // Screenshot
  cy.screenshot('consent-banner-first-visit');
});
```

**Teste 2: Return Visit (Consented)**
```typescript
it('does not show banner if already consented', () => {
  // Simular consentimento prévio
  cy.window().then((win) => {
    win.localStorage.setItem('avaliasolar_consent', JSON.stringify({
      analytics: true,
      marketing: true,
      lastUpdated: Date.now()
    }));
  });
  
  cy.visit('/');
  cy.wait(3000);
  
  // Banner NÃO deve aparecer
  cy.get('[data-testid="cookie-banner"]').should('not.exist');
  
  cy.screenshot('consent-banner-return-visit-no-banner');
});
```

**Teste 3: Declined State**
```typescript
it('does not track if user declined', () => {
  cy.visit('/');
  cy.wait(2100);
  
  // Recusar
  cy.get('[data-testid="cookie-decline"]').click();
  
  // Verificar localStorage
  cy.window().its('localStorage.avaliasolar_consent')
    .should('include', '"analytics":false');
  
  // Verificar que nenhum pixel disparou
  cy.window().should('not.have.property', 'mixpanel');
  
  cy.screenshot('consent-declined-state');
});
```

---

## 2. PROVA DE REVOGAÇÃO

### 2.1 Fluxo de Revogação

**UI de Settings:**

**Arquivo:** `app/settings/privacy/page.tsx` (a criar se não existir)

```typescript
// Componente de revogação
export default function PrivacySettingsPage() {
  const [consented, setConsented] = useState(false);
  const [revoking, setRevoking] = useState(false);
  
  useEffect(() => {
    const consent = getConsent();
    setConsented(consent?.analytics === true);
  }, []);
  
  const handleRevoke = async () => {
    if (!confirm('Tem certeza que deseja revogar seu consentimento? Seus dados serão anonimizados.')) {
      return;
    }
    
    setRevoking(true);
    
    try {
      // Chamar API de revogação
      const response = await fetch('/api/v1/consent/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revoke_reason: 'user_request',
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        // Limpar local
        optOut();
        setConsented(false);
        
        toast.success('Consentimento revogado com sucesso');
      } else {
        toast.error('Erro ao revogar consentimento');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setRevoking(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Privacidade & Consentimento</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Consentimento de Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Status atual: <strong>{consented ? 'Consentido' : 'Não consentido'}</strong>
            </p>
            
            {consented && (
              <Button 
                variant="destructive" 
                onClick={handleRevoke}
                disabled={revoking}
                data-testid="revoke-consent-button"
              >
                {revoking ? 'Revogando...' : 'Revogar Consentimento'}
              </Button>
            )}
            
            {!consented && (
              <Button onClick={() => optIn()}>
                Consentir Novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 2.2 Screenshot de Revogação

**Arquivos esperados:**

1. `consent-revoke-page-before.png` - Página de settings com botão de revogar
2. `consent-revoke-confirmation.png` - Modal de confirmação
3. `consent-revoke-success.png` - Mensagem de sucesso
4. `consent-revoke-page-after.png` - Status atualizado

**Script de captura:**

```typescript
// scripts/capture-revoke-flow.ts
import { chromium } from 'playwright';

async function captureRevokeFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  // Setup: Aceitar consent primeiro
  await page.goto('https://avaliasolar.com.br');
  await page.waitForTimeout(2500);
  await page.click('[data-testid="cookie-accept"]');
  
  // Navegar para settings
  await page.goto('https://avaliasolar.com.br/settings/privacy');
  await page.waitForLoadState('networkidle');
  
  // Screenshot 1: Before
  await page.screenshot({
    path: 'docs/validation/screenshots/consent-revoke-page-before.png'
  });
  
  // Click revoke
  await page.click('[data-testid="revoke-consent-button"]');
  
  // Screenshot 2: Confirmation
  await page.waitForSelector('[role="alertdialog"]');
  await page.screenshot({
    path: 'docs/validation/screenshots/consent-revoke-confirmation.png'
  });
  
  // Confirm
  await page.click('text=Confirmar');
  
  // Screenshot 3: Success
  await page.waitForSelector('text=Consentimento revogado');
  await page.screenshot({
    path: 'docs/validation/screenshots/consent-revoke-success.png'
  });
  
  // Aguardar atualização de estado
  await page.waitForTimeout(1000);
  
  // Screenshot 4: After
  await page.screenshot({
    path: 'docs/validation/screenshots/consent-revoke-page-after.png'
  });
  
  console.log('✅ Revoke flow captured');
  await browser.close();
}

captureRevokeFlow();
```

---

## 3. LOGS DE CONSENT ATUALIZADOS

### 3.1 Query de Auditoria

**SQL para extrair logs de consentimento:**

```sql
-- docs/validation/queries/consent_audit_query.sql

-- Query 1: Últimos 100 eventos de consentimento
SELECT 
  id,
  user_id,
  session_id,
  consent_type,
  consent_given,
  consent_method,
  policy_version,
  ip_address,
  consented_at,
  expires_at
FROM consent_logs
ORDER BY consented_at DESC
LIMIT 100;

-- Output esperado: consent_audit_last_100.csv
```

**Executar e exportar:**

```bash
# Via psql
psql $DATABASE_URL -c "\COPY (SELECT * FROM consent_logs ORDER BY consented_at DESC LIMIT 100) TO 'docs/validation/exports/consent_audit_last_100.csv' CSV HEADER"
```

---

### 3.2 Evidência de Revogação no Banco

**Query específica:**

```sql
-- Query 2: Eventos de revogação (últimos 30 dias)
SELECT 
  id,
  user_id,
  session_id,
  consent_type,
  consent_given,
  consent_method,
  metadata->>'revoke_reason' as revoke_reason,
  consented_at
FROM consent_logs
WHERE consent_given = FALSE
  AND consent_method IN ('settings_page', 'api_revoke')
  AND consented_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY consented_at DESC;

-- Output esperado: consent_revocations_30d.csv
```

---

### 3.3 Relatório de Compliance

**Template:**

```markdown
# Relatório de Compliance - Consentimento

**Período:** [Data início] a [Data fim]  
**Gerado:** [Data]

## Métricas de Consentimento

**Total de eventos de consent:** [Número]

| Tipo | Total | % |
|------|-------|---|
| Consentido (analytics) | [N] | [%] |
| Recusado | [N] | [%] |
| Revogado | [N] | [%] |

## Métodos de Consentimento

| Método | Total | % |
|--------|-------|---|
| banner | [N] | [%] |
| settings_page | [N] | [%] |
| api | [N] | [%] |

## Revogações

**Total de revogações (30 dias):** [N]

**Motivos:**
- user_request: [N]
- data_deletion: [N]
- other: [N]

## Compliance Checks

- [x] Audit trail implementado
- [x] Logs de revogação presentes
- [x] IP e timestamp registrados
- [x] Policy version rastreada
- [x] Expiration date configurada

## Evidências Anexadas

1. consent_audit_last_100.csv
2. consent_revocations_30d.csv
3. Screenshots do fluxo de revogação
4. Logs de backend

## Conformidade LGPD

**Art. 37 (Prova de Consentimento):** ✅ CONFORME  
**Art. 43 (Direito de Revogação):** ✅ CONFORME  
**Art. 18 (Direito de Exclusão):** ⚠️ PARCIAL (implementar anonimização)

## Próximas Ações

1. [ ] Implementar anonimização automática após revogação
2. [ ] Configurar alertas para volume anormal de revogações
3. [ ] Testar fluxo de re-consent após revogação

**Aprovado por:** _______________  
**Data:** _______________
```

---

## 4. TESTE END-TO-END AUTOMATIZADO

**Script Cypress completo:**

```typescript
// cypress/e2e/consent-end-to-end.cy.ts
describe('Consent End-to-End Flow', () => {
  const apiUrl = 'https://api.avaliasolar.com.br';
  
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });
  
  context('1. Banner Display', () => {
    it('shows banner after delay', () => {
      cy.visit('/');
      cy.get('[data-testid="cookie-banner"]').should('not.exist');
      cy.wait(2100);
      cy.get('[data-testid="cookie-banner"]').should('be.visible');
      cy.screenshot('01-banner-displayed');
    });
  });
  
  context('2. Accept Flow', () => {
    it('logs consent to backend', () => {
      cy.intercept('POST', `${apiUrl}/api/v1/consent/log`).as('consentLog');
      
      cy.visit('/');
      cy.wait(2100);
      cy.get('[data-testid="cookie-accept"]').click();
      
      cy.wait('@consentLog').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
        expect(interception.request.body).to.include({
          consent_given: true,
          consent_type: 'all'
        });
      });
      
      cy.screenshot('02-accept-logged');
    });
    
    it('stores consent in localStorage', () => {
      cy.visit('/');
      cy.wait(2100);
      cy.get('[data-testid="cookie-accept"]').click();
      
      cy.window().then((win) => {
        const consent = JSON.parse(win.localStorage.getItem('avaliasolar_consent'));
        expect(consent.analytics).to.be.true;
        expect(consent.marketing).to.be.true;
      });
      
      cy.screenshot('03-localstorage-updated');
    });
    
    it('enables tracking after accept', () => {
      cy.visit('/');
      cy.wait(2100);
      cy.get('[data-testid="cookie-accept"]').click();
      cy.wait(1000);
      
      cy.window().then((win) => {
        expect(win.mixpanel).to.exist;
        expect(win.gtag).to.exist;
      });
      
      cy.screenshot('04-tracking-enabled');
    });
  });
  
  context('3. Decline Flow', () => {
    it('logs rejection to backend', () => {
      cy.intercept('POST', `${apiUrl}/api/v1/consent/log`).as('consentLog');
      
      cy.visit('/');
      cy.wait(2100);
      cy.get('[data-testid="cookie-decline"]').click();
      
      cy.wait('@consentLog').then((interception) => {
        expect(interception.request.body).to.include({
          consent_given: false,
          consent_type: 'none'
        });
      });
      
      cy.screenshot('05-decline-logged');
    });
    
    it('does not enable tracking', () => {
      cy.visit('/');
      cy.wait(2100);
      cy.get('[data-testid="cookie-decline"]').click();
      cy.wait(1000);
      
      cy.window().then((win) => {
        expect(win.mixpanel).to.not.exist;
      });
      
      cy.screenshot('06-tracking-disabled');
    });
  });
  
  context('4. Revoke Flow', () => {
    it('allows user to revoke from settings', () => {
      // Setup: Accept first
      cy.visit('/');
      cy.wait(2100);
      cy.get('[data-testid="cookie-accept"]').click();
      
      // Navigate to settings
      cy.visit('/settings/privacy');
      cy.screenshot('07-settings-before-revoke');
      
      // Intercept revoke API
      cy.intercept('POST', `${apiUrl}/api/v1/consent/revoke`).as('revokeConsent');
      
      // Click revoke
      cy.get('[data-testid="revoke-consent-button"]').click();
      
      // Confirm dialog
      cy.get('[data-testid="confirm-revoke"]').click();
      
      // Verify API called
      cy.wait('@revokeConsent').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
      });
      
      // Verify success message
      cy.contains('Consentimento revogado').should('be.visible');
      cy.screenshot('08-revoke-success');
      
      // Verify localStorage cleared
      cy.window().then((win) => {
        const consent = JSON.parse(win.localStorage.getItem('avaliasolar_consent'));
        expect(consent.analytics).to.be.false;
      });
      
      cy.screenshot('09-settings-after-revoke');
    });
  });
  
  context('5. Re-consent Flow', () => {
    it('allows re-consent after revocation', () => {
      // Setup: Revoked state
      cy.window().then((win) => {
        win.localStorage.setItem('avaliasolar_consent', JSON.stringify({
          analytics: false,
          marketing: false,
          lastUpdated: Date.now()
        }));
      });
      
      cy.visit('/settings/privacy');
      
      // Re-consent button should be visible
      cy.contains('Consentir Novamente').should('be.visible').click();
      
      // Verify localStorage updated
      cy.window().then((win) => {
        const consent = JSON.parse(win.localStorage.getItem('avaliasolar_consent'));
        expect(consent.analytics).to.be.true;
      });
      
      cy.screenshot('10-re-consent-success');
    });
  });
});
```

---

## 5. CHECKLIST DE EVIDÊNCIAS

### 5.1 Evidências Visuais (Screenshots)

- [ ] consent-banner-active-{date}.png
- [ ] consent-banner-first-visit.png
- [ ] consent-banner-return-visit-no-banner.png
- [ ] consent-declined-state.png
- [ ] consent-revoke-page-before.png
- [ ] consent-revoke-confirmation.png
- [ ] consent-revoke-success.png
- [ ] consent-revoke-page-after.png

### 5.2 Evidências de Banco de Dados

- [ ] consent_audit_last_100.csv
- [ ] consent_revocations_30d.csv
- [ ] consent_compliance_report.pdf

### 5.3 Evidências de Testes

- [ ] Cypress test results (HTML report)
- [ ] Playwright screenshots (automated)
- [ ] API response logs

### 5.4 Documentação Legal

- [ ] Privacy Policy (versão atual)
- [ ] DPIA (Data Protection Impact Assessment)
- [ ] Consent flow diagram
- [ ] LGPD compliance checklist

---

## 6. ARMAZENAMENTO DE EVIDÊNCIAS

**Estrutura de diretórios:**

```
docs/
├── validation/
│   ├── screenshots/
│   │   ├── consent-banner-active-2026-03-05.png
│   │   ├── consent-revoke-flow-*.png
│   │   └── ...
│   ├── exports/
│   │   ├── consent_audit_last_100.csv
│   │   ├── consent_revocations_30d.csv
│   │   └── ...
│   ├── reports/
│   │   ├── consent_compliance_report_2026-Q1.pdf
│   │   └── ...
│   ├── queries/
│   │   ├── consent_audit_query.sql
│   │   └── ...
│   └── CONSENT_END_TO_END_EVIDENCE.md (este arquivo)
```

---

## 7. PRÓXIMAS AÇÕES

**Imediatas:**
1. [ ] Executar scripts de captura de screenshots
2. [ ] Executar queries SQL e exportar CSVs
3. [ ] Rodar testes Cypress e gerar relatório
4. [ ] Compilar relatório de compliance

**Mensais:**
1. [ ] Renovar screenshots de evidência
2. [ ] Atualizar CSVs de auditoria
3. [ ] Revisar compliance checklist

**Trimestrais:**
1. [ ] Gerar relatório completo de compliance
2. [ ] Revisar com DPO/Legal
3. [ ] Arquivar evidências antigas

---

**Status Atual:** ❌ **EVIDÊNCIAS NÃO COLETADAS**

**Documento criado:** 2026-03-05  
**Versão:** 1.0  
**Próxima atualização:** Após coleta de evidências
