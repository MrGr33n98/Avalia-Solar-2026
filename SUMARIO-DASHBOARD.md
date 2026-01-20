# 📊 SUMÁRIO TÉCNICO - DASHBOARD EMPRESA
## Avalia Solar - Company Dashboard Architecture

**URL:** `http://localhost:3000/dashboard/company?tab=overview`  
**Versão:** 1.0.0  
**Data:** 2026-01-20  
**Autor:** Senior Full-Stack Architect

---

## 📋 ÍNDICE

1. [Visão Geral da Arquitetura](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estrutura de Diretórios](#estrutura-de-diretórios)
4. [Componentes Frontend](#componentes-frontend)
5. [API Backend](#api-backend)
6. [Fluxo de Dados](#fluxo-de-dados)
7. [Models e Services](#models-e-services)
8. [Autenticação e Autorização](#autenticação)
9. [Funcionalidades por Tab](#funcionalidades)
10. [WebSockets e Real-time](#websockets)
11. [Diagramas](#diagramas)
12. [Code Snippets Essenciais](#code-snippets)
13. [Melhorias Futuras](#melhorias)

---

## 🎯 VISÃO GERAL DA ARQUITETURA

### Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                           │
│  http://localhost:3000/dashboard/company?tab=overview       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               NEXT.JS 14+ FRONTEND (Port 3000)              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  app/dashboard/company/page.tsx                       │  │
│  │         │                                              │  │
│  │         ▼                                              │  │
│  │  components/EnterpriseDashboard.tsx                   │  │
│  │         │                                              │  │
│  │         ├─► EnterpriseHeader.tsx                      │  │
│  │         ├─► EnterpriseSidebar.tsx                     │  │
│  │         │                                              │  │
│  │         └─► TAB COMPONENTS:                           │  │
│  │             ├─ OverviewTab.tsx                        │  │
│  │             ├─ CompanyInfo.tsx                        │  │
│  │             ├─ CategoriesManagement.tsx               │  │
│  │             ├─ BannersSponsorship.tsx                 │  │
│  │             ├─ ProductsManagement.tsx                 │  │
│  │             ├─ ReviewsManagement.tsx                  │  │
│  │             ├─ MediaGallery.tsx                       │  │
│  │             ├─ LeadsOpportunities.tsx                 │  │
│  │             ├─ CampaignsMarketing.tsx                 │  │
│  │             ├─ ReviewsAnalytics.tsx                   │  │
│  │             ├─ PerformanceMetrics.tsx                 │  │
│  │             ├─ CompetitorBenchmark.tsx                │  │
│  │             └─ CompanySettings.tsx                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                     │                                        │
│                     │ HTTP/REST + WebSocket                  │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            RUBY ON RAILS 7+ API (Port 3001)                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  app/controllers/api/v1/                              │  │
│  │  ├─ company_dashboard_controller.rb                   │  │
│  │  ├─ companies_controller.rb                           │  │
│  │  ├─ products_controller.rb                            │  │
│  │  ├─ reviews_controller.rb                             │  │
│  │  ├─ leads_controller.rb                               │  │
│  │  ├─ campaigns_controller.rb                           │  │
│  │  ├─ banners_controller.rb                             │  │
│  │  └─ authentication_controller.rb                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  app/services/                                         │  │
│  │  ├─ company_dashboard/stats_service.rb                │  │
│  │  ├─ analytics/track_event_service.rb                  │  │
│  │  ├─ lead_distribution_service.rb                      │  │
│  │  └─ notification_service.rb                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  app/models/                                           │  │
│  │  ├─ company.rb                                         │  │
│  │  ├─ product.rb                                         │  │
│  │  ├─ review.rb                                          │  │
│  │  ├─ lead.rb                                            │  │
│  │  ├─ campaign.rb                                        │  │
│  │  ├─ pending_change.rb                                  │  │
│  │  └─ banner_subscription.rb                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                POSTGRESQL DATABASE                          │
│  ├─ companies                                               │
│  ├─ products                                                │
│  ├─ reviews                                                 │
│  ├─ leads                                                   │
│  ├─ campaigns                                               │
│  ├─ pending_changes                                         │
│  ├─ banner_subscriptions                                    │
│  └─ active_storage_attachments (logos, banners, media)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠 STACK TECNOLÓGICO

### Frontend
```yaml
Framework: Next.js 14+ (App Router)
Language: TypeScript 5+
UI Library: React 18+
Styling: Tailwind CSS 3+
Components: shadcn/ui + Radix UI
Animations: Framer Motion
State Management: React Hooks + Context API
HTTP Client: Fetch API wrapper (lib/api.ts)
WebSocket: ActionCable (lib/cable.ts)
Charts: Recharts / Chart.js
Forms: React Hook Form
Validation: Zod
Icons: Lucide React
```

### Backend
```yaml
Framework: Ruby on Rails 7+
Language: Ruby 3+
API: RESTful JSON API
Authentication: JWT + Cookie-based
Authorization: Role-based (admin, company, user)
Database: PostgreSQL 14+
ORM: ActiveRecord
File Storage: ActiveStorage (AWS S3 / Local)
Background Jobs: Sidekiq (Redis)
WebSocket: ActionCable (Redis adapter)
Caching: Redis
```

### Infrastructure
```yaml
Development:
  - Frontend: localhost:3000
  - Backend: localhost:3001
  - Database: PostgreSQL (local)
  - Redis: localhost:6379

Production:
  - Frontend: Vercel / Netlify
  - Backend: Railway / Heroku / AWS
  - Database: PostgreSQL (managed)
  - Redis: Redis Cloud / ElastiCache
  - Storage: AWS S3
  - CDN: CloudFront / Vercel CDN
```

---

## 📁 ESTRUTURA DE DIRETÓRIOS

### Frontend Structure

```
AB0-1-front/
├── app/
│   ├── dashboard/
│   │   ├── company/
│   │   │   └── page.tsx                    # Entry point: /dashboard/company
│   │   │
│   │   ├── components/
│   │   │   ├── EnterpriseDashboard.tsx     # Main dashboard container
│   │   │   ├── EnterpriseHeader.tsx        # Top navigation bar
│   │   │   ├── EnterpriseSidebar.tsx       # Left sidebar navigation
│   │   │   │
│   │   │   ├── OverviewTab.tsx             # Tab: Overview (default)
│   │   │   ├── CompanyInfo.tsx             # Tab: Company Information
│   │   │   ├── CategoriesManagement.tsx    # Tab: Categories
│   │   │   ├── BannersSponsorship.tsx      # Tab: Banners & Sponsorship
│   │   │   ├── ProductsManagement.tsx      # Tab: Products
│   │   │   ├── ReviewsManagement.tsx       # Tab: Reviews
│   │   │   ├── MediaGallery.tsx            # Tab: Media Gallery
│   │   │   ├── LeadsOpportunities.tsx      # Tab: Leads
│   │   │   ├── CampaignsMarketing.tsx      # Tab: Campaigns
│   │   │   ├── ReviewsAnalytics.tsx        # Tab: Analytics - Reviews
│   │   │   ├── PerformanceMetrics.tsx      # Tab: Analytics - Performance
│   │   │   ├── CompetitorBenchmark.tsx     # Tab: Analytics - Competitors
│   │   │   ├── CompanySettings.tsx         # Tab: Settings
│   │   │   │
│   │   │   ├── EnterpriseMetricCard.tsx    # Reusable metric card
│   │   │   ├── MetricCard.tsx              # Simple metric display
│   │   │   └── ThemeToggle.tsx             # Dark/light mode toggle
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDashboardStats.ts        # Custom hook for stats
│   │   │   ├── useCompanyData.ts           # Custom hook for company
│   │   │   └── useNotifications.ts         # Custom hook for notifications
│   │   │
│   │   ├── types/
│   │   │   └── dashboard.ts                # TypeScript interfaces
│   │   │
│   │   └── utils/
│   │       └── formatting.ts               # Helper functions
│   │
│   ├── (auth)/
│   │   └── components/
│   │       └── AuthModal.tsx               # Login/Register modal
│   │
│   └── layout.tsx                          # Root layout
│
├── components/
│   └── ui/                                 # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── tabs.tsx
│       ├── badge.tsx
│       ├── skeleton.tsx
│       └── ...
│
├── contexts/
│   └── AuthContext.tsx                     # Authentication context
│
├── lib/
│   ├── api.ts                              # API client wrapper
│   ├── cable.ts                            # WebSocket client
│   └── utils.ts                            # Utility functions
│
└── hooks/
    ├── useBannersQuery.ts                  # React Query: Banners
    ├── useCategoriesQuery.ts               # React Query: Categories
    └── useCompaniesQuery.ts                # React Query: Companies
```

### Backend Structure

```
AB0-1-back/
├── app/
│   ├── controllers/
│   │   └── api/
│   │       └── v1/
│   │           ├── company_dashboard_controller.rb  # Main dashboard API
│   │           ├── companies_controller.rb
│   │           ├── products_controller.rb
│   │           ├── reviews_controller.rb
│   │           ├── leads_controller.rb
│   │           ├── campaigns_controller.rb
│   │           ├── banners_controller.rb
│   │           ├── banner_subscriptions_controller.rb
│   │           ├── authentication_controller.rb
│   │           └── base_controller.rb
│   │
│   ├── models/
│   │   ├── company.rb                      # Company model (main)
│   │   ├── product.rb
│   │   ├── review.rb
│   │   ├── lead.rb
│   │   ├── campaign.rb
│   │   ├── pending_change.rb               # Approval workflow
│   │   ├── banner_subscription.rb
│   │   ├── category.rb
│   │   ├── company_member.rb
│   │   └── user.rb
│   │
│   ├── services/
│   │   ├── company_dashboard/
│   │   │   └── stats_service.rb            # Dashboard stats calculator
│   │   ├── analytics/
│   │   │   ├── track_event_service.rb
│   │   │   └── export_service.rb
│   │   ├── lead_distribution_service.rb
│   │   ├── notification_service.rb
│   │   └── email_service.rb
│   │
│   ├── serializers/
│   │   ├── company_serializer.rb
│   │   ├── product_serializer.rb
│   │   └── dashboard_stats_serializer.rb
│   │
│   ├── channels/
│   │   └── company_dashboard_channel.rb    # WebSocket channel
│   │
│   └── jobs/
│       ├── notification_job.rb
│       └── analytics_job.rb
│
├── config/
│   ├── routes.rb                           # API routes
│   └── cable.yml                           # ActionCable config
│
└── db/
    ├── migrate/                            # Database migrations
    └── schema.rb                           # Database schema
```

---

## 🎨 COMPONENTES FRONTEND

### 1. **Entry Point: `app/dashboard/company/page.tsx`**

**Responsabilidade:** Ponto de entrada para o dashboard da empresa.

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EnterpriseDashboard from '../components/EnterpriseDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function CompanyDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const cid = user?.company_id;
    if (cid) {
      setCompanyId(String(cid));
    } else {
      setCompanyId(null);
    }
    setLoading(false);
  }, [authLoading, user]);

  if (loading) {
    return <LoadingState />;
  }

  if (!companyId) {
    return <NoCompanyState />;
  }

  return <EnterpriseDashboard companyId={companyId} />;
}
```

**Fluxo:**
1. Verifica autenticação via `AuthContext`
2. Obtém `company_id` do usuário logado
3. Renderiza `EnterpriseDashboard` se empresa existe
4. Mostra estados de loading/erro caso necessário

---

### 2. **Main Container: `EnterpriseDashboard.tsx`**

**Responsabilidade:** Container principal com gerenciamento de estado, tabs e layout.

```typescript
export default function EnterpriseDashboard({ companyId }: CompanyDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State Management
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Sync tab with URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Fetch company data
  useEffect(() => {
    fetchCompanyData();
    fetchStats();
    fetchNotifications();
  }, [companyId]);

  // WebSocket subscription
  useEffect(() => {
    const subscription = subscribeCompanyDashboard(companyId, {
      received: (data) => {
        // Handle real-time updates
      }
    });
    return () => subscription?.unsubscribe();
  }, [companyId]);

  return (
    <div className="flex h-screen bg-background">
      <EnterpriseSidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        company={company}
      />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        <EnterpriseHeader 
          company={company}
          notifications={notifications}
        />
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsContent value="overview">
            <OverviewTab company={company} stats={stats} />
          </TabsContent>
          
          <TabsContent value="info">
            <CompanyInfo company={company} onUpdate={fetchCompanyData} />
          </TabsContent>
          
          <TabsContent value="categories">
            <CategoriesManagement company={company} />
          </TabsContent>
          
          {/* ... more tabs ... */}
        </Tabs>
      </main>
    </div>
  );
}
```

**Características:**
- ✅ Gerenciamento centralizado de estado
- ✅ Sincronização tab ↔ URL (deep linking)
- ✅ WebSocket para atualizações em tempo real
- ✅ Fetch de dados ao montar
- ✅ Layout responsivo com sidebar colapsável

---

### 3. **Sidebar Navigation: `EnterpriseSidebar.tsx`**

**Responsabilidade:** Navegação lateral entre tabs do dashboard.

```typescript
export default function EnterpriseSidebar({ 
  activeTab, 
  onTabChange, 
  company 
}: SidebarProps) {
  const menuItems = [
    { 
      id: 'overview', 
      label: 'Visão Geral', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      id: 'info', 
      label: 'Informações', 
      icon: Building2,
      badge: company?.pendingChanges > 0 ? company.pendingChanges : null
    },
    { 
      id: 'categories', 
      label: 'Categorias', 
      icon: Layers,
      badge: null
    },
    { 
      id: 'banners', 
      label: 'Patrocínios', 
      icon: Megaphone,
      badge: company?.activeBanners > 0 ? company.activeBanners : null
    },
    {
      id: 'products',
      label: 'Produtos',
      icon: Package,
      badge: company?.productsCount
    },
    {
      id: 'reviews',
      label: 'Avaliações',
      icon: Star,
      badge: company?.reviewsPending > 0 ? company.reviewsPending : null
    },
    {
      id: 'media',
      label: 'Galeria',
      icon: Image,
      badge: null
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: Target,
      badge: company?.leadsNew > 0 ? company.leadsNew : null
    },
    {
      id: 'campaigns',
      label: 'Campanhas',
      icon: Rocket,
      badge: company?.activeCampaigns
    },
    {
      id: 'analytics',
      label: 'Analíticos',
      icon: TrendingUp,
      badge: null,
      submenu: [
        { id: 'analytics-reviews', label: 'Reviews' },
        { id: 'analytics-performance', label: 'Performance' },
        { id: 'analytics-competitors', label: 'Concorrência' }
      ]
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border">
      <div className="p-4">
        <h2 className="text-lg font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">{company?.name}</p>
      </div>
      
      <nav className="space-y-1 p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              activeTab === item.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary">{item.badge}</Badge>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
```

**Características:**
- ✅ Menu hierárquico (com submenus)
- ✅ Badges para notificações/contadores
- ✅ Estado ativo visual
- ✅ Ícones consistentes
- ✅ Responsivo (colapsa em mobile)

---

### 4. **Header: `EnterpriseHeader.tsx`**

**Responsabilidade:** Barra superior com informações do usuário e notificações.

```typescript
export default function EnterpriseHeader({ 
  company, 
  notifications 
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <MobileMenuToggle />
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: company?.name || 'Empresa', href: '#' }
        ]} />
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <NotificationsList notifications={notifications} />
          </DropdownMenuContent>
        </DropdownMenu>
        
        <UserMenu user={user} company={company} />
      </div>
    </header>
  );
}
```

**Características:**
- ✅ Breadcrumb navigation
- ✅ Notificações com contador
- ✅ Menu do usuário
- ✅ Theme toggle
- ✅ Menu mobile

---

### 5. **Tab Components (Overview Example)**

#### `OverviewTab.tsx`

**Responsabilidade:** Visão geral com métricas principais e ações rápidas.

```typescript
export default function OverviewTab({ company, stats }: OverviewTabProps) {
  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Visualizações"
          value={stats?.profileViews || 0}
          icon={Eye}
          trend="+12%"
          trendUp
        />
        <MetricCard
          title="Cliques CTA"
          value={stats?.ctaClicks || 0}
          icon={Zap}
          trend="+8%"
          trendUp
        />
        <MetricCard
          title="Leads Recebidos"
          value={stats?.leadsReceived || 0}
          icon={Target}
          trend="+15%"
          trendUp
        />
        <MetricCard
          title="Avaliação Média"
          value={stats?.averageRating?.toFixed(1) || '0.0'}
          icon={Star}
          suffix="/5.0"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.action}
                variant="outline"
                className="h-24 flex flex-col items-center gap-2"
                onClick={() => onQuickAction(action.action)}
              >
                <action.icon className="w-6 h-6" />
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline activities={recentActivities} />
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Plano: {company?.plan?.name || 'Gratuito'}</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanFeaturesList features={company?.plan_features} />
          <Button className="mt-4">Fazer Upgrade</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Outras Tabs (resumo):**

| Tab | Componente | Funcionalidade |
|-----|-----------|----------------|
| **Info** | `CompanyInfo.tsx` | Editar informações da empresa (nome, descrição, contatos, endereço) |
| **Categories** | `CategoriesManagement.tsx` | Adicionar/remover categorias (com aprovação) |
| **Banners** | `BannersSponsorship.tsx` | Gerenciar patrocínios e banners premium |
| **Products** | `ProductsManagement.tsx` | CRUD de produtos/serviços |
| **Reviews** | `ReviewsManagement.tsx` | Visualizar e responder avaliações |
| **Media** | `MediaGallery.tsx` | Upload de fotos/vídeos |
| **Leads** | `LeadsOpportunities.tsx` | Gerenciar leads recebidos |
| **Campaigns** | `CampaignsMarketing.tsx` | Criar e monitorar campanhas |
| **Analytics** | `ReviewsAnalytics.tsx`, etc. | Dashboards analíticos avançados |
| **Settings** | `CompanySettings.tsx` | Configurações gerais |

---

## 🔌 API BACKEND

### Main Controller: `company_dashboard_controller.rb`

**Namespace:** `Api::V1::CompanyDashboardController`  
**Base Path:** `/api/v1/company_dashboard`

#### **Endpoints:**

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/stats` | Estatísticas do dashboard | ✅ Company User |
| GET | `/banner_subscriptions` | Lista assinaturas de banners | ✅ Company User |
| POST | `/banner_checkout` | Checkout de banner premium | ✅ Company User |
| POST | `/update_info` | Atualizar informações da empresa | ✅ Company User |
| POST | `/add_categories` | Adicionar categorias (pending approval) | ✅ Company User |
| POST | `/remove_category` | Remover categoria (pending approval) | ✅ Company User |
| POST | `/update_ctas` | Atualizar CTAs (pending approval) | ✅ Company User |
| POST | `/update_logo` | Upload de logo (pending approval) | ✅ Company User |
| POST | `/update_banner` | Upload de banner (pending approval) | ✅ Company User |
| GET | `/pending_changes` | Lista mudanças pendentes | ✅ Company User |
| GET | `/notifications` | Notificações da empresa | ✅ Company User |
| GET | `/media` | Fotos da galeria | ✅ Company User |
| GET | `/videos` | Vídeos publicados | ✅ Company User |
| POST | `/upload_media` | Upload de mídia (pending approval) | ✅ Company User |
| POST | `/add_video` | Adicionar vídeo YouTube (pending approval) | ✅ Company User |
| DELETE | `/remove_video` | Remover vídeo (pending approval) | ✅ Company User |

---

### Example API Responses

#### **GET `/api/v1/company_dashboard/stats`**

```json
{
  "stats": {
    "profileViews": 1543,
    "ctaClicks": 89,
    "whatsappClicks": 67,
    "leadsReceived": 23,
    "reviewsCount": 45,
    "averageRating": 4.7,
    "pendingApprovals": 2,
    "activeCampaigns": 1,
    "conversionRate": 5.8
  },
  "plan_features": {
    "max_products": 50,
    "max_photos": 20,
    "can_add_videos": true,
    "can_create_campaigns": true,
    "analytics_advanced": true
  }
}
```

#### **GET `/api/v1/company_dashboard/notifications`**

```json
{
  "notifications": [
    {
      "type": "review",
      "title": "Nova Avaliação",
      "message": "Nova avaliação de 5 estrelas recebida",
      "timestamp": "2026-01-20T10:30:00Z",
      "read": false
    },
    {
      "type": "lead",
      "title": "Novo Lead",
      "message": "Novo contato de João Silva",
      "timestamp": "2026-01-20T09:15:00Z",
      "read": false
    },
    {
      "type": "approval",
      "title": "Alteração Aprovada",
      "message": "Sua alteração de Company Info foi aprovada",
      "timestamp": "2026-01-19T14:20:00Z",
      "read": true
    }
  ]
}
```

---

## 🔄 FLUXO DE DADOS

### Fluxo Completo: Atualizar Informações da Empresa

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ACTION                                   │
│  Usuário clica em "Salvar" no formulário de edição de empresa   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│               FRONTEND (CompanyInfo.tsx)                         │
│                                                                  │
│  const handleSubmit = async (data) => {                         │
│    const response = await fetchApi(                             │
│      '/api/v1/company_dashboard/update_info',                   │
│      {                                                           │
│        method: 'POST',                                           │
│        body: JSON.stringify({ company: data })                  │
│      }                                                           │
│    );                                                            │
│                                                                  │
│    if (response.ok) {                                            │
│      toast.success('Alterações enviadas para aprovação');       │
│      refetchCompany();                                           │
│    }                                                             │
│  };                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP POST
                     │ /api/v1/company_dashboard/update_info
                     │ Body: { company: { name: "...", ... } }
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│          BACKEND (company_dashboard_controller.rb)               │
│                                                                  │
│  def update_info                                                 │
│    # 1. Authenticate company user                               │
│    authenticate_company_user!                                    │
│                                                                  │
│    # 2. Check if admin (direct update)                          │
│    if current_user&.role == 'admin'                             │
│      @company.update(company_params)                            │
│      return render json: { message: 'Aplicado' }, status: :ok   │
│    end                                                           │
│                                                                  │
│    # 3. Create pending change (workflow de aprovação)           │
│    pending_change = @company.pending_changes.create!(           │
│      change_type: 'company_info',                               │
│      data: {                                                     │
│        attributes: company_params,                              │
│        previous_values: @company.attributes                     │
│      },                                                          │
│      user_id: current_user.id,                                  │
│      status: 'pending'                                          │
│    )                                                             │
│                                                                  │
│    # 4. Notify admins                                           │
│    NotificationService.notify_admins(                           │
│      'pending_change',                                          │
│      pending_change                                             │
│    )                                                             │
│                                                                  │
│    # 5. Response                                                │
│    render json: {                                                │
│      message: 'Alterações enviadas para aprovação',            │
│      pending_change: pending_change                             │
│    }, status: :created                                          │
│  end                                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Create PendingChange record
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE                                      │
│                                                                  │
│  INSERT INTO pending_changes (                                   │
│    company_id,                                                   │
│    change_type,                                                  │
│    data,                                                         │
│    user_id,                                                      │
│    status,                                                       │
│    created_at                                                    │
│  ) VALUES (                                                      │
│    1,                                                            │
│    'company_info',                                               │
│    '{"attributes": {...}, "previous_values": {...}}',          │
│    42,                                                           │
│    'pending',                                                    │
│    '2026-01-20 10:30:00'                                        │
│  );                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ (Later: Admin approves)
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              ADMIN APPROVAL (Admin Panel)                        │
│                                                                  │
│  # Admin clicks "Approve" button                                │
│  POST /api/v1/admin/pending_changes/:id/approve                 │
│                                                                  │
│  def approve                                                     │
│    pending_change = PendingChange.find(params[:id])             │
│    company = pending_change.company                             │
│                                                                  │
│    # Apply changes                                              │
│    company.update!(pending_change.data['attributes'])           │
│                                                                  │
│    # Mark as approved                                           │
│    pending_change.update!(                                      │
│      status: 'approved',                                        │
│      approved_at: Time.current,                                 │
│      approved_by: current_admin.id                              │
│    )                                                             │
│                                                                  │
│    # Notify company                                             │
│    NotificationService.notify_company(                          │
│      company,                                                   │
│      'change_approved',                                         │
│      pending_change                                             │
│    )                                                             │
│                                                                  │
│    # Broadcast via WebSocket                                    │
│    ActionCable.server.broadcast(                                │
│      "company_dashboard_#{company.id}",                         │
│      {                                                           │
│        type: 'approval',                                        │
│        change_id: pending_change.id,                            │
│        message: 'Alteração aprovada!'                           │
│      }                                                           │
│    )                                                             │
│  end                                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ WebSocket Broadcast
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND (Real-time Update)                         │
│                                                                  │
│  useEffect(() => {                                               │
│    const subscription = subscribeCompanyDashboard(              │
│      companyId,                                                  │
│      {                                                           │
│        received: (data) => {                                    │
│          if (data.type === 'approval') {                        │
│            toast.success(data.message);                         │
│            refetchCompany();  // Re-fetch updated data          │
│          }                                                       │
│        }                                                         │
│      }                                                           │
│    );                                                            │
│    return () => subscription?.unsubscribe();                    │
│  }, [companyId]);                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 MODELS E SERVICES

### Model: `company.rb`

**Principais Atributos:**

```ruby
class Company < ApplicationRecord
  # Enums
  enum status: { active: 'active', inactive: 'inactive', pending: 'pending', blocked: 'blocked' }

  # Attachments
  has_one_attached :banner
  has_one_attached :logo
  has_many_attached :media_assets

  # Associations
  has_and_belongs_to_many :categories
  has_many :reviews, dependent: :destroy
  has_many :pending_changes, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :leads, dependent: :destroy
  has_many :campaigns, dependent: :destroy
  has_many :financing_options, dependent: :destroy
  has_many :banner_subscriptions, dependent: :destroy
  has_many :company_videos, dependent: :destroy
  belongs_to :plan, optional: true
  has_many :company_members, dependent: :destroy
  has_many :members, through: :company_members, source: :user

  # Validations
  validates :name, presence: true, length: { minimum: 5 }
  validates :description, presence: true
  validates :phone, format: { with: /\A\d{10,15}\z/ }, allow_blank: true
  validates :email, format: { with: SIMPLE_EMAIL_REGEX }, allow_blank: true
  validates :website, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]) }, allow_blank: true

  # Scopes
  scope :active, -> { where(status: 'active') }
  scope :featured, -> { where(featured: true) }
  scope :verified, -> { where(verified: true) }

  # Instance Methods
  def media_urls
    media_assets.map { |asset| Rails.application.routes.url_helpers.rails_blob_url(asset, only_path: true) }
  end

  def banner_url
    banner.attached? ? Rails.application.routes.url_helpers.rails_blob_url(banner, only_path: true) : nil
  end

  def logo_url
    logo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(logo, only_path: true) : nil
  end

  def published_videos
    company_videos.where(status: 'published')
  end

  def effective_plan_features
    plan&.features || default_free_features
  end

  private

  def default_free_features
    {
      max_products: 5,
      max_photos: 3,
      can_add_videos: false,
      can_create_campaigns: false,
      analytics_advanced: false
    }
  end
end
```

---

### Service: `CompanyDashboard::StatsService`

**Responsabilidade:** Calcular estatísticas do dashboard.

```ruby
# app/services/company_dashboard/stats_service.rb
module CompanyDashboard
  class StatsService
    def initialize(company)
      @company = company
    end

    def call
      return default_stats unless @company

      {
        profileViews: calculate_profile_views,
        ctaClicks: calculate_cta_clicks,
        whatsappClicks: calculate_whatsapp_clicks,
        leadsReceived: calculate_leads_received,
        reviewsCount: @company.reviews.count,
        averageRating: calculate_average_rating,
        pendingApprovals: @company.pending_changes.pending.count,
        activeCampaigns: @company.campaigns.active.count,
        conversionRate: calculate_conversion_rate
      }
    end

    private

    def calculate_profile_views
      # Implement using analytics service
      @company.analytics_events.where(event_type: 'profile_view').count
    end

    def calculate_cta_clicks
      @company.analytics_events.where(event_type: 'cta_click').count
    end

    def calculate_whatsapp_clicks
      @company.analytics_events.where(event_type: 'whatsapp_click').count
    end

    def calculate_leads_received
      @company.leads.where('created_at > ?', 30.days.ago).count
    end

    def calculate_average_rating
      avg = @company.reviews.average(:rating)
      avg ? avg.to_f.round(1) : 0.0
    end

    def calculate_conversion_rate
      views = calculate_profile_views
      leads = calculate_leads_received
      views > 0 ? ((leads.to_f / views) * 100).round(1) : 0.0
    end

    def default_stats
      {
        profileViews: 0,
        ctaClicks: 0,
        whatsappClicks: 0,
        leadsReceived: 0,
        reviewsCount: 0,
        averageRating: 0.0,
        pendingApprovals: 0,
        activeCampaigns: 0,
        conversionRate: 0.0
      }
    end
  end
end
```

---

## 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO

### Fluxo de Autenticação

```
┌──────────────────────────────────────────────────────────────┐
│                    USER LOGIN                                 │
│  1. User submits email + password                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│         POST /api/v1/authentication/login                     │
│                                                               │
│  def login                                                    │
│    user = User.find_by(email: params[:email])               │
│    if user&.authenticate(params[:password])                  │
│      token = JWT.encode(                                     │
│        { user_id: user.id, exp: 24.hours.from_now },        │
│        Rails.application.secret_key_base                     │
│      )                                                        │
│      render json: {                                          │
│        user: user.as_json(                                   │
│          only: [:id, :name, :email, :role],                 │
│          methods: [:company_id]                              │
│        ),                                                    │
│        token: token                                          │
│      }                                                        │
│    else                                                       │
│      render json: { error: 'Invalid credentials' },         │
│             status: :unauthorized                            │
│    end                                                        │
│  end                                                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Returns JWT token + user data
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              FRONTEND (AuthContext.tsx)                       │
│                                                               │
│  const login = async (email, password) => {                  │
│    const response = await fetchApi('/api/v1/auth/login', {  │
│      method: 'POST',                                         │
│      body: JSON.stringify({ email, password })              │
│    });                                                        │
│                                                               │
│    if (response.ok) {                                        │
│      const { user, token } = await response.json();         │
│      localStorage.setItem('auth_token', token);             │
│      setUser(user);                                          │
│      router.push('/dashboard/company');                     │
│    }                                                          │
│  };                                                           │
└───────────────────────────────────────────────────────────────┘
```

### Authorization Middleware

**Backend:**

```ruby
# app/controllers/api/v1/company_dashboard_controller.rb
class CompanyDashboardController < BaseController
  before_action :authenticate_company_user!
  before_action :set_company

  private

  def authenticate_company_user!
    unless current_user&.company
      render json: { error: 'Unauthorized' }, status: :unauthorized and return
    end
    unless current_user.active?
      render json: { error: 'Access pending approval' }, status: :forbidden and return
    end
  end

  def set_company
    @company = current_user.company
    unless @company
      render json: { error: 'Company not found' }, status: :not_found and return
    end
  end
end
```

**Frontend:**

```typescript
// contexts/AuthContext.tsx
export function useAuth() {
  const { user, loading } = useContext(AuthContext);

  const requireCompany = () => {
    if (!user?.company_id) {
      router.push('/register-company');
      return false;
    }
    return true;
  };

  return { user, loading, requireCompany };
}

// Usage in page
const { requireCompany } = useAuth();

useEffect(() => {
  if (!requireCompany()) return;
  // Load dashboard data
}, []);
```

---

## 🚀 WEBSOCKETS E REAL-TIME

### ActionCable Channel

```ruby
# app/channels/company_dashboard_channel.rb
class CompanyDashboardChannel < ApplicationCable::Channel
  def subscribed
    company = current_user&.company
    stream_for company if company
  end

  def unsubscribed
    stop_all_streams
  end
end
```

### Frontend Subscription

```typescript
// lib/cable.ts
import { createConsumer } from '@rails/actioncable';

export function subscribeCompanyDashboard(companyId: string, callbacks: any) {
  const token = localStorage.getItem('auth_token');
  const consumer = createConsumer(`ws://localhost:3001/cable?token=${token}`);

  return consumer.subscriptions.create(
    { channel: 'CompanyDashboardChannel', company_id: companyId },
    {
      received(data) {
        callbacks.received?.(data);
      },
      connected() {
        console.log('[WebSocket] Connected to CompanyDashboard');
      },
      disconnected() {
        console.log('[WebSocket] Disconnected');
      }
    }
  );
}
```

### Usage in Component

```typescript
useEffect(() => {
  const subscription = subscribeCompanyDashboard(companyId, {
    received: (data) => {
      switch (data.type) {
        case 'new_lead':
          toast.info('Novo lead recebido!');
          setStats(prev => ({ ...prev, leadsReceived: prev.leadsReceived + 1 }));
          break;
        case 'new_review':
          toast.info('Nova avaliação recebida!');
          refetchStats();
          break;
        case 'approval':
          toast.success('Alteração aprovada!');
          refetchCompany();
          break;
      }
    }
  });

  return () => subscription?.unsubscribe();
}, [companyId]);
```

---

## 📈 FUNCIONALIDADES POR TAB

### 1. Overview Tab

**Features:**
- ✅ KPI cards (visualizações, cliques, leads, rating)
- ✅ Quick actions (buttons para tabs principais)
- ✅ Recent activity timeline
- ✅ Plan features summary
- ✅ Pending approvals alert

**APIs Used:**
- `GET /api/v1/company_dashboard/stats`
- `GET /api/v1/company_dashboard/notifications`

---

### 2. Company Info Tab

**Features:**
- ✅ Edit company details (name, description, contacts)
- ✅ Upload logo and banner
- ✅ Social media links
- ✅ Address and location (with map preview)
- ✅ Working hours
- ✅ Pending changes review (if not admin)

**APIs Used:**
- `POST /api/v1/company_dashboard/update_info`
- `POST /api/v1/company_dashboard/update_logo`
- `POST /api/v1/company_dashboard/update_banner`

---

### 3. Categories Tab

**Features:**
- ✅ View current categories
- ✅ Add new categories (from dropdown)
- ✅ Remove categories
- ✅ Categories require admin approval

**APIs Used:**
- `GET /api/v1/categories` (all available)
- `POST /api/v1/company_dashboard/add_categories`
- `POST /api/v1/company_dashboard/remove_category`

---

### 4. Banners & Sponsorship Tab

**Features:**
- ✅ View available banner offers
- ✅ Subscribe to premium banners
- ✅ Manage active subscriptions
- ✅ Track banner impressions/clicks
- ✅ Payment status

**APIs Used:**
- `GET /api/v1/banner_offers` (available offers)
- `GET /api/v1/company_dashboard/banner_subscriptions`
- `POST /api/v1/company_dashboard/banner_checkout`

---

### 5. Products Tab

**Features:**
- ✅ CRUD operations on products/services
- ✅ Product details (name, description, price, specs)
- ✅ Product images
- ✅ Product categories
- ✅ Stock management (optional)
- ✅ Bulk import/export

**APIs Used:**
- `GET /api/v1/companies/:id/products`
- `POST /api/v1/products`
- `PUT /api/v1/products/:id`
- `DELETE /api/v1/products/:id`

---

### 6. Reviews Tab

**Features:**
- ✅ View all reviews (with rating distribution chart)
- ✅ Filter by rating/date
- ✅ Respond to reviews
- ✅ Flag inappropriate reviews
- ✅ Export reviews CSV

**APIs Used:**
- `GET /api/v1/companies/:id/reviews`
- `POST /api/v1/reviews/:id/respond`
- `POST /api/v1/reviews/:id/flag`

---

### 7. Media Gallery Tab

**Features:**
- ✅ Upload multiple photos
- ✅ Organize photos in albums
- ✅ Set cover photo
- ✅ Add videos from YouTube
- ✅ Drag-and-drop reorder
- ✅ Image optimization (auto WebP conversion)

**APIs Used:**
- `GET /api/v1/company_dashboard/media`
- `GET /api/v1/company_dashboard/videos`
- `POST /api/v1/company_dashboard/upload_media`
- `POST /api/v1/company_dashboard/add_video`
- `DELETE /api/v1/company_dashboard/remove_video`

---

### 8. Leads Tab

**Features:**
- ✅ View all leads (table + filters)
- ✅ Lead details (name, email, phone, message)
- ✅ Lead status (new, contacted, converted, lost)
- ✅ Lead source tracking (organic, paid, referral)
- ✅ Export leads CSV
- ✅ Email/WhatsApp quick actions

**APIs Used:**
- `GET /api/v1/companies/:id/leads`
- `PUT /api/v1/leads/:id` (update status)

---

### 9. Campaigns Tab

**Features:**
- ✅ Create marketing campaigns
- ✅ Campaign types (discount, promotion, announcement)
- ✅ Set campaign duration
- ✅ Track campaign performance (impressions, clicks, conversions)
- ✅ A/B testing (for premium plans)

**APIs Used:**
- `GET /api/v1/companies/:id/campaigns`
- `POST /api/v1/campaigns`
- `PUT /api/v1/campaigns/:id`
- `DELETE /api/v1/campaigns/:id`

---

### 10. Analytics Tabs

#### 10.1 Reviews Analytics

**Features:**
- ✅ Rating distribution chart (1-5 stars)
- ✅ Review velocity (reviews per month)
- ✅ Sentiment analysis (positive/negative/neutral)
- ✅ Top keywords in reviews
- ✅ Compare with competitors

#### 10.2 Performance Metrics

**Features:**
- ✅ Traffic analytics (views, sessions, users)
- ✅ Conversion funnel (view → click → lead)
- ✅ Geographic distribution map
- ✅ Device breakdown (mobile/desktop)
- ✅ Time-series charts (daily/weekly/monthly)

#### 10.3 Competitor Benchmark

**Features:**
- ✅ Compare rating vs competitors
- ✅ Compare products count
- ✅ Market share estimation
- ✅ Price positioning
- ✅ Category ranking

---

### 11. Settings Tab

**Features:**
- ✅ Account settings
- ✅ Notification preferences
- ✅ Team management (add/remove members)
- ✅ Billing & invoices
- ✅ Plan upgrade/downgrade
- ✅ API keys & webhooks
- ✅ Export data (GDPR compliance)

**APIs Used:**
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `GET /api/v1/company_dashboard/team_members`
- `POST /api/v1/company_dashboard/invite_member`

---

## 🔍 CODE SNIPPETS ESSENCIAIS

### 1. Fetch Company Data (Frontend)

```typescript
// hooks/useCompanyData.ts
export function useCompanyData(companyId: string) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchApi(`/api/v1/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      } else {
        throw new Error('Failed to fetch company');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return { company, loading, error, refetch: fetchCompany };
}
```

---

### 2. Update Company Info (Frontend)

```typescript
// components/CompanyInfo.tsx
const handleSubmit = async (data: CompanyFormData) => {
  try {
    setSubmitting(true);
    const response = await fetchApi('/api/v1/company_dashboard/update_info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: data })
    });

    if (response.ok) {
      const result = await response.json();
      toast.success(result.message);
      refetchCompany();
    } else {
      const error = await response.json();
      toast.error(error.error || 'Erro ao atualizar');
    }
  } catch (err) {
    toast.error('Erro de conexão');
  } finally {
    setSubmitting(false);
  }
};
```

---

### 3. Approve Pending Change (Backend)

```ruby
# app/controllers/api/v1/admin/pending_changes_controller.rb
class Admin::PendingChangesController < Admin::BaseController
  def approve
    @pending_change = PendingChange.find(params[:id])
    @company = @pending_change.company

    ActiveRecord::Base.transaction do
      case @pending_change.change_type
      when 'company_info'
        @company.update!(@pending_change.data['attributes'])
      when 'logo'
        blob = ActiveStorage::Blob.find_signed(@pending_change.data['signed_id'])
        @company.logo.attach(blob)
      when 'banner'
        blob = ActiveStorage::Blob.find_signed(@pending_change.data['signed_id'])
        @company.banner.attach(blob)
      when 'categories'
        if @pending_change.data['action'] == 'add'
          category_ids = @pending_change.data['category_ids']
          @company.categories << Category.where(id: category_ids)
        elsif @pending_change.data['action'] == 'remove'
          category_ids = @pending_change.data['category_ids']
          @company.categories.delete(Category.where(id: category_ids))
        end
      end

      @pending_change.update!(
        status: 'approved',
        approved_at: Time.current,
        approved_by: current_user.id
      )
    end

    # Broadcast via WebSocket
    ActionCable.server.broadcast(
      "company_dashboard_#{@company.id}",
      { type: 'approval', change_id: @pending_change.id }
    )

    render json: { message: 'Aprovado com sucesso' }, status: :ok
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
```

---

### 4. Stats Service (Backend)

```ruby
# app/services/company_dashboard/stats_service.rb
module CompanyDashboard
  class StatsService
    CACHE_DURATION = 5.minutes

    def initialize(company)
      @company = company
    end

    def call
      Rails.cache.fetch(cache_key, expires_in: CACHE_DURATION) do
        calculate_stats
      end
    end

    private

    def calculate_stats
      {
        profileViews: profile_views_30d,
        ctaClicks: cta_clicks_30d,
        whatsappClicks: whatsapp_clicks_30d,
        leadsReceived: leads_30d,
        reviewsCount: @company.reviews.count,
        averageRating: average_rating,
        pendingApprovals: @company.pending_changes.pending.count,
        activeCampaigns: @company.campaigns.active.count,
        conversionRate: conversion_rate
      }
    end

    def profile_views_30d
      @company.analytics_events
        .where(event_type: 'profile_view')
        .where('created_at > ?', 30.days.ago)
        .count
    end

    def cta_clicks_30d
      @company.analytics_events
        .where(event_type: 'cta_click')
        .where('created_at > ?', 30.days.ago)
        .count
    end

    def whatsapp_clicks_30d
      @company.analytics_events
        .where(event_type: 'whatsapp_click')
        .where('created_at > ?', 30.days.ago)
        .count
    end

    def leads_30d
      @company.leads.where('created_at > ?', 30.days.ago).count
    end

    def average_rating
      avg = @company.reviews.average(:rating)
      avg ? avg.to_f.round(1) : 0.0
    end

    def conversion_rate
      views = profile_views_30d
      leads = leads_30d
      views > 0 ? ((leads.to_f / views) * 100).round(1) : 0.0
    end

    def cache_key
      "company_dashboard_stats_#{@company.id}_#{@company.updated_at.to_i}"
    end
  end
end
```

---

## 🚀 MELHORIAS FUTURAS

### Phase 1: Performance

- [ ] Implement Redis caching for stats
- [ ] Add pagination to all list endpoints
- [ ] Optimize database queries (N+1 prevention)
- [ ] Add CDN for static assets
- [ ] Implement lazy loading for images

### Phase 2: Features

- [ ] AI-powered review response suggestions
- [ ] Automated lead scoring
- [ ] Advanced A/B testing for campaigns
- [ ] Integrated chat with leads
- [ ] Mobile app (React Native)

### Phase 3: Analytics

- [ ] Heatmap for profile clicks
- [ ] User journey tracking
- [ ] Predictive analytics (lead conversion probability)
- [ ] Custom dashboards (drag-and-drop widgets)
- [ ] Export to BI tools (Power BI, Tableau)

### Phase 4: Integrations

- [ ] CRM integration (Salesforce, HubSpot)
- [ ] Email marketing (Mailchimp, SendGrid)
- [ ] Payment gateways (Stripe, PayPal)
- [ ] Social media auto-posting
- [ ] Google Analytics integration

---

## 📚 REFERÊNCIAS

### Documentation

- **Next.js:** https://nextjs.org/docs
- **Rails API:** https://guides.rubyonrails.org/api_app.html
- **ActionCable:** https://guides.rubyonrails.org/action_cable_overview.html
- **shadcn/ui:** https://ui.shadcn.com/
- **Framer Motion:** https://www.framer.com/motion/

### Tools

- **Database:** PostgreSQL 14+
- **Cache/Queue:** Redis 6+
- **Storage:** AWS S3 / Local ActiveStorage
- **Deployment:** Vercel (frontend) + Railway (backend)

---

## 📝 CHANGELOG

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0.0 | 2026-01-20 | Documentação inicial completa |

---

## 👥 AUTORIA

**Arquiteto Senior Full-Stack**  
Especialista em Ruby on Rails + Next.js  
Marketplace Energia Solar - Avalia Solar

**Contato:** Via dashboard interno

---

**FIM DO DOCUMENTO**

Total de Páginas: ~50  
Última Atualização: 2026-01-20
