# 🎨 DIAGRAMS - Company Dashboard Architecture

Complemento visual do **SUMARIO-DASHBOARD.md**

---

## 📊 DIAGRAMA 1: Component Hierarchy

```
CompanyDashboardPage (/dashboard/company)
│
└─ EnterpriseDashboard (Main Container)
   │
   ├─ EnterpriseSidebar
   │  └─ Navigation Menu
   │     ├─ Overview
   │     ├─ Company Info
   │     ├─ Categories
   │     ├─ Banners
   │     ├─ Products
   │     ├─ Reviews
   │     ├─ Media
   │     ├─ Leads
   │     ├─ Campaigns
   │     ├─ Analytics (submenu)
   │     └─ Settings
   │
   ├─ EnterpriseHeader
   │  ├─ Breadcrumb
   │  ├─ ThemeToggle
   │  ├─ Notifications Dropdown
   │  └─ User Menu
   │
   └─ Tabs Container
      ├─ OverviewTab
      │  ├─ MetricCard (x4)
      │  ├─ QuickActions
      │  ├─ RecentActivity
      │  └─ PlanFeatures
      │
      ├─ CompanyInfo
      │  ├─ BasicInfoForm
      │  ├─ ContactsForm
      │  ├─ AddressForm
      │  ├─ SocialMediaForm
      │  ├─ LogoUpload
      │  └─ BannerUpload
      │
      ├─ CategoriesManagement
      │  ├─ CurrentCategories (list)
      │  ├─ AddCategoryDropdown
      │  └─ PendingApprovals (alert)
      │
      ├─ BannersSponsorship
      │  ├─ AvailableOffers (cards)
      │  ├─ ActiveSubscriptions (table)
      │  └─ BannerStats (chart)
      │
      ├─ ProductsManagement
      │  ├─ ProductsTable
      │  ├─ AddProductModal
      │  ├─ EditProductModal
      │  └─ BulkImportExport
      │
      ├─ ReviewsManagement
      │  ├─ ReviewsTable
      │  ├─ RatingDistribution (chart)
      │  ├─ RespondModal
      │  └─ ExportCSV
      │
      ├─ MediaGallery
      │  ├─ PhotoGrid (drag-drop)
      │  ├─ UploadZone
      │  ├─ VideosList
      │  └─ AddVideoModal
      │
      ├─ LeadsOpportunities
      │  ├─ LeadsTable (with filters)
      │  ├─ LeadDetails (drawer)
      │  ├─ StatusUpdate (dropdown)
      │  └─ ExportCSV
      │
      ├─ CampaignsMarketing
      │  ├─ CampaignsTable
      │  ├─ CreateCampaignModal
      │  ├─ CampaignStats (chart)
      │  └─ ABTestingPanel
      │
      ├─ ReviewsAnalytics
      │  ├─ RatingTrend (line chart)
      │  ├─ SentimentAnalysis (pie chart)
      │  ├─ TopKeywords (word cloud)
      │  └─ CompetitorCompare (bar chart)
      │
      ├─ PerformanceMetrics
      │  ├─ TrafficChart (area chart)
      │  ├─ ConversionFunnel (funnel chart)
      │  ├─ GeoMap (map)
      │  └─ DeviceBreakdown (pie chart)
      │
      ├─ CompetitorBenchmark
      │  ├─ RatingCompare (radar chart)
      │  ├─ MarketShareTable
      │  ├─ PricePositioning (scatter plot)
      │  └─ CategoryRanking (table)
      │
      └─ CompanySettings
         ├─ AccountSettings
         ├─ NotificationPrefs
         ├─ TeamManagement
         ├─ BillingInvoices
         └─ DataExport
```

---

## 🔄 DIAGRAMA 2: Data Flow - Update Company Info

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION                                               │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ User fills form in CompanyInfo.tsx                        │ │
│    │ - Name: "Nova Solar Ltd"                                  │ │
│    │ - Description: "Empresa líder..."                         │ │
│    │ - Phone: "48999999999"                                    │ │
│    │ Clicks "Salvar"                                           │ │
│    └────────────────────┬─────────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND VALIDATION                                            │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ React Hook Form + Zod schema                             │ │
│    │ ✓ Name: min 5 chars                                      │ │
│    │ ✓ Phone: valid format                                    │ │
│    │ ✓ Email: valid format                                    │ │
│    └────────────────────┬─────────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          │ POST /api/v1/company_dashboard/update_info
                          │ Headers: { Authorization: Bearer <JWT> }
                          │ Body: { company: { name: "...", ... } }
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. RAILS MIDDLEWARE                                               │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ BaseController#authenticate_user!                        │ │
│    │ - Verify JWT token                                       │ │
│    │ - Extract user_id from token                             │ │
│    │ - Load current_user from DB                              │ │
│    └────────────────────┬─────────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. AUTHORIZATION                                                  │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ CompanyDashboardController#authenticate_company_user!    │ │
│    │ - Verify user has company_id                             │ │
│    │ - Verify user.role == 'company' or 'admin'               │ │
│    │ - Verify user.active? == true                            │ │
│    │ - Load @company = current_user.company                   │ │
│    └────────────────────┬─────────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. BUSINESS LOGIC                                                 │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ CompanyDashboardController#update_info                   │ │
│    │                                                           │ │
│    │ IF current_user.role == 'admin':                         │ │
│    │   @company.update!(company_params)                       │ │
│    │   return { message: 'Aplicado' }                         │ │
│    │                                                           │ │
│    │ ELSE:  # Regular company user                            │ │
│    │   pending_change = @company.pending_changes.create!(    │ │
│    │     change_type: 'company_info',                         │ │
│    │     data: {                                              │ │
│    │       attributes: company_params,                        │ │
│    │       previous_values: @company.attributes               │ │
│    │     },                                                    │ │
│    │     user_id: current_user.id,                            │ │
│    │     status: 'pending'                                    │ │
│    │   )                                                       │ │
│    │   return { message: 'Enviado para aprovação' }          │ │
│    └────────────────────┬─────────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. DATABASE WRITE                                                 │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ PostgreSQL                                                │ │
│    │                                                           │ │
│    │ INSERT INTO pending_changes (                            │ │
│    │   company_id,        -- 1                                │ │
│    │   change_type,       -- 'company_info'                   │ │
│    │   data,              -- JSON with attributes             │ │
│    │   user_id,           -- 42                               │ │
│    │   status,            -- 'pending'                        │ │
│    │   created_at         -- NOW()                            │ │
│    │ ) VALUES (...);                                          │ │
│    │                                                           │ │
│    │ --> pending_change_id: 123                               │ │
│    └────────────────────┬─────────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. NOTIFICATIONS                                                  │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ NotificationService.notify_admins(                       │ │
│    │   'pending_change',                                      │ │
│    │   pending_change                                         │ │
│    │ )                                                         │ │
│    │                                                           │ │
│    │ Sends:                                                    │ │
│    │ - Email to admin@avaliasolar.com                         │ │
│    │ - Push notification to admin panel                       │ │
│    │ - Slack webhook (optional)                               │ │
│    └────────────────────┬─────────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          │ JSON Response
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. FRONTEND RESPONSE HANDLING                                     │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ CompanyInfo.tsx                                          │ │
│    │                                                           │ │
│    │ if (response.ok) {                                       │ │
│    │   toast.success('Alterações enviadas para aprovação')   │ │
│    │   setPendingChangesCount(prev => prev + 1)              │ │
│    │   // Show pending badge in sidebar                       │ │
│    │ }                                                         │ │
│    └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔐 DIAGRAMA 3: Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER VISITS /dashboard/company                                 │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. AuthContext checks localStorage                                │
│    const token = localStorage.getItem('auth_token')               │
│                                                                    │
│    IF token exists:                                               │
│      Verify token with /api/v1/authentication/verify             │
│    ELSE:                                                           │
│      Redirect to /login                                           │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. Backend verifies JWT                                           │
│    POST /api/v1/authentication/verify                             │
│    Headers: { Authorization: Bearer <token> }                     │
│                                                                    │
│    JWT.decode(token, secret_key_base)                            │
│    --> { user_id: 42, exp: 1674234567 }                          │
│                                                                    │
│    User.find(42)                                                  │
│    --> { id: 42, email: "...", company_id: 1, role: "company" }  │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. Frontend receives user data                                    │
│    setUser({                                                      │
│      id: 42,                                                      │
│      email: "user@company.com",                                   │
│      company_id: 1,                                               │
│      role: "company"                                              │
│    })                                                             │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. CompanyDashboardPage checks user.company_id                    │
│    IF user.company_id:                                            │
│      <EnterpriseDashboard companyId={user.company_id} />         │
│    ELSE:                                                           │
│      Redirect to /register-company                                │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. EnterpriseDashboard loads data                                 │
│    GET /api/v1/companies/:id                                      │
│    GET /api/v1/company_dashboard/stats                            │
│    GET /api/v1/company_dashboard/notifications                    │
│                                                                    │
│    All requests include:                                          │
│    Headers: { Authorization: Bearer <token> }                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📡 DIAGRAMA 4: WebSocket Real-time Updates

```
┌──────────────────────────────────────────────────────────────────┐
│ FRONTEND: EnterpriseDashboard.tsx                                 │
│                                                                    │
│ useEffect(() => {                                                 │
│   const subscription = subscribeCompanyDashboard(companyId, {    │
│     received: (data) => handleWebSocketMessage(data)             │
│   });                                                             │
│   return () => subscription.unsubscribe();                        │
│ }, [companyId]);                                                  │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     │ WebSocket Connection
                     │ ws://localhost:3001/cable?token=<JWT>
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ BACKEND: ActionCable                                              │
│                                                                    │
│ class CompanyDashboardChannel < ApplicationCable::Channel        │
│   def subscribed                                                  │
│     company = current_user.company                                │
│     stream_for company                                            │
│   end                                                             │
│ end                                                               │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     │ Channel: company_dashboard_1
                     │ (company_id = 1)
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ EVENT TRIGGERS                                                    │
│                                                                    │
│ 1. NEW LEAD RECEIVED                                              │
│    Lead.create! --> after_create callback                         │
│    ActionCable.server.broadcast(                                  │
│      "company_dashboard_#{lead.company_id}",                      │
│      { type: 'new_lead', lead: lead.as_json }                    │
│    )                                                              │
│                                                                    │
│ 2. NEW REVIEW                                                     │
│    Review.create! --> after_create callback                       │
│    ActionCable.server.broadcast(...)                              │
│                                                                    │
│ 3. PENDING CHANGE APPROVED                                        │
│    PendingChange.update(status: 'approved')                       │
│    ActionCable.server.broadcast(...)                              │
│                                                                    │
│ 4. BANNER SUBSCRIPTION ACTIVATED                                  │
│    BannerSubscription.update(status: 'active')                    │
│    ActionCable.server.broadcast(...)                              │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     │ Broadcast via Redis Pub/Sub
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ FRONTEND: Message Handler                                         │
│                                                                    │
│ const handleWebSocketMessage = (data) => {                        │
│   switch (data.type) {                                            │
│     case 'new_lead':                                              │
│       toast.info('Novo lead recebido!');                          │
│       setStats(prev => ({                                         │
│         ...prev,                                                  │
│         leadsReceived: prev.leadsReceived + 1                     │
│       }));                                                        │
│       refetchLeads();                                             │
│       break;                                                      │
│                                                                    │
│     case 'new_review':                                            │
│       toast.info('Nova avaliação!');                              │
│       refetchStats();                                             │
│       refetchReviews();                                           │
│       break;                                                      │
│                                                                    │
│     case 'approval':                                              │
│       toast.success('Alteração aprovada!');                       │
│       refetchCompany();                                           │
│       refetchPendingChanges();                                    │
│       break;                                                      │
│   }                                                                │
│ };                                                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DIAGRAMA 5: Database Schema (Simplified)

```
┌─────────────────────────────────────────────────────────────────┐
│ companies                                                         │
├─────────────────────────────────────────────────────────────────┤
│ id                BIGINT PRIMARY KEY                             │
│ name              VARCHAR(255) NOT NULL                          │
│ description       TEXT                                           │
│ email             VARCHAR(255)                                   │
│ email_public      VARCHAR(255)                                   │
│ phone             VARCHAR(20)                                    │
│ whatsapp          VARCHAR(20)                                    │
│ website           VARCHAR(255)                                   │
│ address           TEXT                                           │
│ city              VARCHAR(100)                                   │
│ state             VARCHAR(2)                                     │
│ cnpj              VARCHAR(18) UNIQUE                             │
│ status            VARCHAR(20) DEFAULT 'pending'                  │
│ featured          BOOLEAN DEFAULT false                          │
│ verified          BOOLEAN DEFAULT false                          │
│ plan_id           BIGINT REFERENCES plans(id)                    │
│ latitude          DECIMAL(10,8)                                  │
│ longitude         DECIMAL(11,8)                                  │
│ rating_avg        DECIMAL(3,2)                                   │
│ rating_count      INTEGER DEFAULT 0                              │
│ reviews_count     INTEGER DEFAULT 0                              │
│ created_at        TIMESTAMP                                      │
│ updated_at        TIMESTAMP                                      │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ pending_changes                                                   │
├─────────────────────────────────────────────────────────────────┤
│ id                BIGINT PRIMARY KEY                             │
│ company_id        BIGINT REFERENCES companies(id)                │
│ change_type       VARCHAR(50) NOT NULL                           │
│ data              JSONB NOT NULL                                 │
│ user_id           BIGINT REFERENCES users(id)                    │
│ status            VARCHAR(20) DEFAULT 'pending'                  │
│ approved_at       TIMESTAMP                                      │
│ approved_by       BIGINT REFERENCES users(id)                    │
│ rejected_at       TIMESTAMP                                      │
│ rejected_by       BIGINT REFERENCES users(id)                    │
│ rejection_reason  TEXT                                           │
│ created_at        TIMESTAMP                                      │
│ updated_at        TIMESTAMP                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ products                                                          │
├─────────────────────────────────────────────────────────────────┤
│ id                BIGINT PRIMARY KEY                             │
│ company_id        BIGINT REFERENCES companies(id)                │
│ name              VARCHAR(255) NOT NULL                          │
│ description       TEXT                                           │
│ price_cents       BIGINT                                         │
│ currency          VARCHAR(3) DEFAULT 'BRL'                       │
│ specifications    JSONB                                          │
│ stock_quantity    INTEGER                                        │
│ active            BOOLEAN DEFAULT true                           │
│ created_at        TIMESTAMP                                      │
│ updated_at        TIMESTAMP                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ reviews                                                           │
├─────────────────────────────────────────────────────────────────┤
│ id                BIGINT PRIMARY KEY                             │
│ company_id        BIGINT REFERENCES companies(id)                │
│ user_id           BIGINT REFERENCES users(id)                    │
│ rating            INTEGER NOT NULL (1-5)                         │
│ title             VARCHAR(255)                                   │
│ content           TEXT                                           │
│ verified_purchase BOOLEAN DEFAULT false                          │
│ helpful_count     INTEGER DEFAULT 0                              │
│ status            VARCHAR(20) DEFAULT 'pending'                  │
│ response          TEXT                                           │
│ responded_at      TIMESTAMP                                      │
│ created_at        TIMESTAMP                                      │
│ updated_at        TIMESTAMP                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ leads                                                             │
├─────────────────────────────────────────────────────────────────┤
│ id                BIGINT PRIMARY KEY                             │
│ company_id        BIGINT REFERENCES companies(id)                │
│ name              VARCHAR(255) NOT NULL                          │
│ email             VARCHAR(255) NOT NULL                          │
│ phone             VARCHAR(20)                                    │
│ message           TEXT                                           │
│ source            VARCHAR(50) (organic/paid/referral)           │
│ status            VARCHAR(20) DEFAULT 'new'                      │
│ wizard_status     VARCHAR(50)                                    │
│ created_at        TIMESTAMP                                      │
│ updated_at        TIMESTAMP                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ campaigns                                                         │
├─────────────────────────────────────────────────────────────────┤
│ id                BIGINT PRIMARY KEY                             │
│ company_id        BIGINT REFERENCES companies(id)                │
│ name              VARCHAR(255) NOT NULL                          │
│ campaign_type     VARCHAR(50)                                    │
│ start_date        DATE                                           │
│ end_date          DATE                                           │
│ budget_cents      BIGINT                                         │
│ status            VARCHAR(20) DEFAULT 'draft'                    │
│ impressions       INTEGER DEFAULT 0                              │
│ clicks            INTEGER DEFAULT 0                              │
│ conversions       INTEGER DEFAULT 0                              │
│ created_at        TIMESTAMP                                      │
│ updated_at        TIMESTAMP                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ banner_subscriptions                                              │
├─────────────────────────────────────────────────────────────────┤
│ id                BIGINT PRIMARY KEY                             │
│ company_id        BIGINT REFERENCES companies(id)                │
│ banner_offer_id   BIGINT REFERENCES banner_offers(id)            │
│ status            VARCHAR(20) DEFAULT 'pending_payment'          │
│ provider          VARCHAR(50)                                    │
│ checkout_session_id VARCHAR(255)                                 │
│ payment_confirmed_at TIMESTAMP                                   │
│ starts_at         TIMESTAMP                                      │
│ expires_at        TIMESTAMP                                      │
│ impressions       INTEGER DEFAULT 0                              │
│ clicks            INTEGER DEFAULT 0                              │
│ created_at        TIMESTAMP                                      │
│ updated_at        TIMESTAMP                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ active_storage_attachments                                        │
├─────────────────────────────────────────────────────────────────┤
│ id                BIGINT PRIMARY KEY                             │
│ name              VARCHAR(255) NOT NULL (logo/banner/media)      │
│ record_type       VARCHAR(255) NOT NULL (Company)                │
│ record_id         BIGINT NOT NULL                                │
│ blob_id           BIGINT REFERENCES active_storage_blobs(id)     │
│ created_at        TIMESTAMP                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ active_storage_blobs                                              │
├─────────────────────────────────────────────────────────────────┤
│ id                BIGINT PRIMARY KEY                             │
│ key               VARCHAR(255) NOT NULL UNIQUE                   │
│ filename          VARCHAR(255) NOT NULL                          │
│ content_type      VARCHAR(255)                                   │
│ metadata          JSONB                                          │
│ byte_size         BIGINT NOT NULL                                │
│ checksum          VARCHAR(255) NOT NULL                          │
│ created_at        TIMESTAMP                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 DIAGRAMA 6: Tab Navigation State Management

```
┌──────────────────────────────────────────────────────────────────┐
│ URL: /dashboard/company?tab=overview                              │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ EnterpriseDashboard Component                                     │
│                                                                    │
│ const searchParams = useSearchParams();                           │
│ const [activeTab, setActiveTab] = useState(                       │
│   searchParams.get('tab') || 'overview'                           │
│ );                                                                 │
│                                                                    │
│ // Sync URL → State                                               │
│ useEffect(() => {                                                 │
│   const tab = searchParams.get('tab');                            │
│   if (tab && tab !== activeTab) {                                 │
│     setActiveTab(tab);                                            │
│   }                                                                │
│ }, [searchParams]);                                               │
│                                                                    │
│ // Sync State → URL                                               │
│ const handleTabChange = (tab) => {                                │
│   setActiveTab(tab);                                              │
│   const params = new URLSearchParams(searchParams);               │
│   params.set('tab', tab);                                         │
│   router.push(`/dashboard/company?${params.toString()}`);         │
│ };                                                                 │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ Tabs Component                                                    │
│                                                                    │
│ <Tabs value={activeTab} onValueChange={handleTabChange}>         │
│   <TabsContent value="overview">                                  │
│     <OverviewTab />                                               │
│   </TabsContent>                                                  │
│   <TabsContent value="info">                                      │
│     <CompanyInfo />                                               │
│   </TabsContent>                                                  │
│   ...                                                              │
│ </Tabs>                                                           │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ User Actions                                                      │
│                                                                    │
│ 1. Click sidebar item "Produtos"                                 │
│    → handleTabChange('products')                                  │
│    → setActiveTab('products')                                     │
│    → router.push('/dashboard/company?tab=products')               │
│                                                                    │
│ 2. Browser back button                                            │
│    → URL changes to ?tab=info                                     │
│    → useEffect detects searchParams change                        │
│    → setActiveTab('info')                                         │
│                                                                    │
│ 3. Direct URL visit /dashboard/company?tab=leads                  │
│    → searchParams.get('tab') = 'leads'                            │
│    → useState initializes with 'leads'                            │
│    → Renders LeadsOpportunities tab                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 DIAGRAMA 7: Stats Calculation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ TRIGGER: Frontend requests stats                                 │
│ GET /api/v1/company_dashboard/stats?company_id=1                 │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ CompanyDashboardController#stats                                  │
│                                                                    │
│ def stats                                                         │
│   stats_service = CompanyDashboard::StatsService.new(@company)   │
│   render json: { stats: stats_service.call }                     │
│ end                                                               │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ CompanyDashboard::StatsService#call                               │
│                                                                    │
│ Rails.cache.fetch("company_stats_#{company.id}", expires: 5m) { │
│   calculate_stats                                                 │
│ }                                                                 │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ calculate_stats (parallel queries)                                │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ profileViews                                                  │ │
│ │ SELECT COUNT(*) FROM analytics_events                        │ │
│ │ WHERE company_id = 1                                         │ │
│ │   AND event_type = 'profile_view'                           │ │
│ │   AND created_at > NOW() - INTERVAL '30 days'               │ │
│ │ --> 1543                                                     │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ ctaClicks                                                     │ │
│ │ SELECT COUNT(*) FROM analytics_events                        │ │
│ │ WHERE company_id = 1                                         │ │
│ │   AND event_type = 'cta_click'                              │ │
│ │   AND created_at > NOW() - INTERVAL '30 days'               │ │
│ │ --> 89                                                       │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ leadsReceived                                                 │ │
│ │ SELECT COUNT(*) FROM leads                                   │ │
│ │ WHERE company_id = 1                                         │ │
│ │   AND created_at > NOW() - INTERVAL '30 days'               │ │
│ │ --> 23                                                       │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ averageRating                                                 │ │
│ │ SELECT AVG(rating) FROM reviews                              │ │
│ │ WHERE company_id = 1                                         │ │
│ │ --> 4.7                                                      │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ conversionRate                                                │ │
│ │ (leadsReceived / profileViews) * 100                         │ │
│ │ (23 / 1543) * 100 = 1.49%                                   │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ Result: {                                                         │
│   profileViews: 1543,                                             │
│   ctaClicks: 89,                                                  │
│   leadsReceived: 23,                                              │
│   averageRating: 4.7,                                             │
│   conversionRate: 1.49                                            │
│ }                                                                 │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     │ Cache for 5 minutes in Redis
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ Response to Frontend                                              │
│                                                                    │
│ {                                                                 │
│   "stats": {                                                      │
│     "profileViews": 1543,                                         │
│     "ctaClicks": 89,                                              │
│     "whatsappClicks": 67,                                         │
│     "leadsReceived": 23,                                          │
│     "reviewsCount": 45,                                           │
│     "averageRating": 4.7,                                         │
│     "pendingApprovals": 2,                                        │
│     "activeCampaigns": 1,                                         │
│     "conversionRate": 1.49                                        │
│   }                                                               │
│ }                                                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DIAGRAMA 8: Approval Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│ COMPANY USER: Submits change request                             │
│ (e.g., update company logo)                                      │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ CREATE: PendingChange                                             │
│ {                                                                 │
│   change_type: 'logo',                                            │
│   data: { signed_id: 'xyz...' },                                 │
│   status: 'pending'                                               │
│ }                                                                 │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     │ NOTIFY
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ ADMIN PANEL: Shows pending change in queue                        │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Pending Change #123                                           │ │
│ │ Type: Logo Upload                                             │ │
│ │ Company: Nova Solar Ltd                                       │ │
│ │ User: user@company.com                                        │ │
│ │ Created: 2026-01-20 10:30                                     │ │
│ │                                                                │ │
│ │ [Preview Image]                                               │ │
│ │                                                                │ │
│ │ [ Approve ]  [ Reject ]                                       │ │
│ └──────────────────────────────────────────────────────────────┘ │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     │ ADMIN DECISION
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│ APPROVE          │    │ REJECT           │
│                  │    │                  │
│ 1. Apply change  │    │ 1. Mark rejected │
│    to company    │    │ 2. Store reason  │
│                  │    │ 3. Notify user   │
│ 2. Update status │    │                  │
│    to 'approved' │    │ Status: rejected │
│                  │    │                  │
│ 3. Notify user   │    └──────────────────┘
│                  │
│ 4. Broadcast     │
│    via WebSocket │
│                  │
└──────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│ COMPANY USER: Receives notification                               │
│                                                                    │
│ ✓ "Sua alteração de logo foi aprovada!"                          │
│                                                                    │
│ Dashboard auto-refreshes via WebSocket                            │
│ New logo appears immediately                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

**FIM DOS DIAGRAMAS**

Este documento complementa o **SUMARIO-DASHBOARD.md** com representações visuais ASCII.

Total de Diagramas: 8  
Última Atualização: 2026-01-20
