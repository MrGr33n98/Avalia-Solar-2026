# Story: Redirecionamento do Dashboard Legado para o Dashboard da Empresa

## Contexto
A rota `/dashboard` ainda renderizava um dashboard legado com dados mockados e uma experiência paralela ao painel real da empresa em `/dashboard/company`.

Isso gerava duplicação de produto, confusão de navegação e risco de percepção ruim de qualidade.

## O que foi ajustado
- `app/dashboard/page.tsx` passou a atuar apenas como resolvedor de destino:
  - usuário não autenticado -> `/login?return_to=%2Fdashboard`
  - usuário reviewer -> `/review-dashboard`
  - usuário empresa sem empresa ativa -> `/select-company`
  - usuário empresa com empresa ativa -> `/dashboard/company`
- `app/company-dashboard/page.tsx` passou a ser apenas uma rota legada de compatibilidade, redirecionando para `/dashboard/company`.
- `components/company/CompanySwitcher.tsx` passou a apontar diretamente para `/dashboard/company`.
- atalhos internos em `contexts/AuthContext.tsx`, `app/select-company/page.tsx` e `app/review-dashboard/page.tsx` foram alinhados para a URL canônica `/dashboard/company`.
- `__tests__/pages/dashboard.test.tsx` foi atualizado para validar o comportamento novo de redirecionamento.

## Arquivos alterados
- `app/dashboard/page.tsx`
- `app/company-dashboard/page.tsx`
- `app/review-dashboard/page.tsx`
- `app/select-company/page.tsx`
- `components/company/CompanySwitcher.tsx`
- `contexts/AuthContext.tsx`
- `__tests__/pages/dashboard.test.tsx`
- `tests/review-dashboard.spec.ts`

## Checklist
- [x] Dashboard legado removido da experiência principal
- [x] `/dashboard` resolve o destino correto por papel/contexto
- [x] `/company-dashboard` mantido apenas como alias de compatibilidade
- [x] Navegação interna passa a usar `/dashboard/company` como rota canônica
- [x] Atalho do seletor de empresa aponta para o painel real
- [ ] Validar visualmente o fluxo autenticado em ambiente real

## File List
- `app/dashboard/page.tsx`
- `app/company-dashboard/page.tsx`
- `app/review-dashboard/page.tsx`
- `app/select-company/page.tsx`
- `components/company/CompanySwitcher.tsx`
- `contexts/AuthContext.tsx`
- `__tests__/pages/dashboard.test.tsx`
- `tests/review-dashboard.spec.ts`
