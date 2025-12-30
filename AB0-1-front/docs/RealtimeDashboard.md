# Realtime Dashboard (Next.js + ActionCable + shadcn/ui)

## Hook: useCompanyDashboard(companyId)
- Busca histórico com `/api/v1/companies/:id/analytics/historical`.
- Assina `CompanyDashboardChannel` e atualiza KPIs/series em tempo real.
- Batching de 250ms para reduzir rerenders.

## Componentes
- `RealtimeKPICard`: card de KPI responsivo.
- `RealtimeDashboard`: grade de KPIs + gráficos (Recharts) e lista de eventos.

## Uso
```tsx
import RealtimeDashboard from '@/app/dashboard/components/RealtimeDashboard'

export default function Page() {
  const companyId = 123
  return <RealtimeDashboard companyId={companyId} />
}
```

### Integração na página do dashboard
- Em `app/dashboard/page.tsx`, o `companyId` é inferido de `localStorage.auth.user.company_id` quando disponível e o componente é renderizado dentro de uma seção dedicada.

## Configuração
- `NEXT_PUBLIC_CABLE_URL` (opcional), default `'/cable'`.
- Dependências: `@rails/actioncable`, `recharts`, `shadcn/ui`.

## Segurança
- Canal valida usuário e empresa; assinatura usa `{ company_id }`.

## Testes
- Jest/RTL cobrindo atualização de KPIs e renderização.
