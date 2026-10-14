# Gap Analysis — Upgrade de Planos e Modal | Avalia Solar 2026

## Matriz de Conformidade

| Requisito / Componente | Estado Atual | Estado Desejado | Classificação | Evidência / Arquivo |
|---|---|---|---|---|
| **Assets SVG** | Presentes no pacote descompactado | Disponíveis em diretório público do frontend | **PARCIAL** | `AB0-1-front/public/avalia-solar-upgrade-assets/assets/*.svg` → `AB0-1-front/public/upgrade-assets/` |
| **Widget da Sidebar** | Inexistente na sidebar ativa | Integrado no rodapé de `EnterpriseSidebar.tsx` antes de `Alternar Empresa`, com variante compacta para rail de 112px | **AUSENTE** | `EnterpriseSidebar.tsx:341-414` |
| **Contraste Dark Sidebar** | Sidebar possui fundo `hsl(var(--dashboard-rail))` | Widget com fundo `#FFFBEB` ou escurecido translúcido garantindo contraste com texto e borda `#FBBF24` | **AUSENTE** | `SidebarUpgradeWidget.tsx` |
| **Tooltip Acessível (Modo Compacto)** | Inexistente para o widget | Radix Tooltip "Desbloqueie seu potencial: Conhecer planos" visível ao pairar ou focar no rail estreito | **AUSENTE** | `EnterpriseSidebar.tsx` (compact mode) |
| **Modal de Planos Controlado** | Ausente no dashboard global | Instanciado via `Dialog` com owner de estado em `EnterpriseDashboard.tsx`, sem redirecionar rota | **AUSENTE** | `EnterpriseDashboard.tsx` |
| **Tabela de Preços Real** | Configurada em `lib/pricing/billing.ts` | Exibida no modal com valores exatos: Free R$ 0, Essencial R$ 49,17/mês (R$ 590 anual), Pro R$ 125,00/mês (R$ 1.500 anual), Enterprise Sob consulta | **EXISTE** | `AB0-1-front/lib/pricing/billing.ts:14-23` |
| **Trigger via Aba de Assinatura** | Botão "Fazer Upgrade de Plano" sem `onClick` | Botão dispara o mesmo modal de planos | **PARCIAL** | `PlanAndSubscription.tsx:105-107` |
| **Checkout Idempotente** | `billingApi.createCheckoutSession` implementado | Disparado pelo CTA do modal com feedback de carregamento | **EXISTE** | `AB0-1-front/lib/api/billing.ts:65-85` |
| **Lead Comercial Enterprise** | `billingApi.createEnterpriseLead` implementado | Disparado ao selecionar Enterprise | **EXISTE** | `AB0-1-front/lib/api/billing.ts:97-110` |
| **Ocultação em Contas Enterprise** | Não há verificação no widget | Widget oculto se `company.plan_tier === 'enterprise'` | **AUSENTE** | `EnterpriseSidebar.tsx` |
| **Entitlements Server-Side** | `EntitlementService` e `LeadWizard::Creator` | Mantidos protegidos sem dependência exclusiva da UI | **EXISTE** | `AB0-1-back/app/services/lead_wizard/creator.rb:108` |
