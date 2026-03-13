# Dashboard Component Map

## Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DASHBOARDLAYOUT                                     │
│  ┌──────────────┐  ┌────────────────────────────────────────────────────┐  │
│  │              │  │                  DASHBOARDHEADER                    │  │
│  │              │  │  ┌──────────────────┐  ┌─────┐  ┌──────────────┐  │  │
│  │              │  │  │   Search Input   │  │ 🔔  │  │   Avatar ▾   │  │  │
│  │              │  │  └──────────────────┘  └─────┘  └──────────────┘  │  │
│  │   SIDEBAR    │  └────────────────────────────────────────────────────┘  │
│  │              │  ┌────────────────────────────────────────────────────┐  │
│  │  ┌────────┐  │  │                  MAIN CONTENT                      │  │
│  │  │ Logo   │  │  │                                                    │  │
│  │  └────────┘  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │
│  │              │  │  │  STATS  │ │  STATS  │ │  STATS  │ │  STATS  │ │  │
│  │  📊 Dashboard│  │  │  CARD   │ │  CARD   │ │  CARD   │ │  CARD   │ │  │
│  │  🏢 Empresas │  │  │  (KPI)  │ │  (KPI)  │ │  (KPI)  │ │  (KPI)  │ │  │
│  │  📄 Propostas│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │  │
│  │  👥 Clientes │  │                                                    │  │
│  │  📈 Relatórios│ │  ┌─────────────────────┐ ┌────────────────────┐  │  │
│  │  ⚙️  Config.  │  │  │    CHARTCARD       │ │   CHARTCARD       │  │  │
│  │              │  │  │  ┌───────────────┐  │ │ ┌───────────────┐ │  │  │
│  │  ┌────────┐  │  │  │  │ Revenue Chart │  │ │ │Proposals Chart│ │  │  │
│  │  │   ⬅️   │  │  │  │  │  (Area Chart) │  │ │ │  (Bar Chart)  │ │  │  │
│  │  └────────┘  │  │  │  └───────────────┘  │ │ └───────────────┘ │  │  │
│  │   Collapse   │  │  └─────────────────────┘ └────────────────────┘  │  │
│  │              │  │                                                    │  │
│  └──────────────┘  │  ┌──────────────────────────────────────────────┐ │  │
│    256px → 80px    │  │           CHARTCARD (Full Width)             │ │  │
│                    │  │  ┌──────────────────────────────────────────┐│ │  │
│                    │  │  │      Performance Chart (Line Chart)      ││ │  │
│                    │  │  └──────────────────────────────────────────┘│ │  │
│                    │  └──────────────────────────────────────────────┘ │  │
│                    │                                                    │  │
│                    │  ┌────────────┐ ┌─────────────────────────────┐  │  │
│                    │  │   RECENT   │ │        DATATABLE            │  │  │
│                    │  │  ACTIVITY  │ │  ┌──────────────────────┐  │  │  │
│                    │  │            │ │  │ Company | Value | ... │  │  │  │
│                    │  │  👤 User   │ │  ├──────────────────────┤  │  │  │
│                    │  │  did X     │ │  │ Row 1                │  │  │  │
│                    │  │  5min ago  │ │  │ Row 2                │  │  │  │
│                    │  │            │ │  │ Row 3                │  │  │  │
│                    │  │  👤 User   │ │  │ Row 4                │  │  │  │
│                    │  │  did Y     │ │  └──────────────────────┘  │  │  │
│                    │  │  15min ago │ │                             │  │  │
│                    │  └────────────┘ └─────────────────────────────┘  │  │
│                    └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Tree

```
DashboardLayout
├── DashboardSidebar
│   ├── Logo
│   ├── Navigation Menu
│   │   ├── MenuItem (Dashboard) [active state]
│   │   ├── MenuItem (Empresas)
│   │   ├── MenuItem (Propostas)
│   │   ├── MenuItem (Clientes)
│   │   ├── MenuItem (Relatórios)
│   │   └── MenuItem (Configurações)
│   └── Collapse Button
│
├── Main Content Area
│   ├── DashboardHeader
│   │   ├── Search Input (clay-input)
│   │   ├── Notification Dropdown
│   │   │   └── Notification Items
│   │   └── User Profile Dropdown
│   │       ├── Avatar
│   │       └── Menu Items
│   │
│   └── Dashboard Content (children)
│       ├── Stats Grid (4 columns)
│       │   ├── StatsCard (Revenue)
│       │   ├── StatsCard (Proposals)
│       │   ├── StatsCard (Clients)
│       │   └── StatsCard (Conversion)
│       │
│       ├── Charts Grid (2 columns)
│       │   ├── RevenueChart
│       │   │   └── ChartCard
│       │   │       └── AreaChart (Recharts)
│       │   └── ProposalsChart
│       │       └── ChartCard
│       │           └── BarChart (Recharts)
│       │
│       ├── Performance Chart (Full Width)
│       │   └── ChartCard
│       │       └── LineChart (Recharts)
│       │
│       └── Activity + Table Grid (3 columns)
│           ├── RecentActivity (1 col)
│           │   └── Activity Items
│           │       ├── Avatar
│           │       ├── User Name
│           │       ├── Action Text
│           │       ├── Timestamp
│           │       └── Type Badge
│           │
│           └── DataTable (2 cols)
│               ├── Table Header
│               └── Table Rows
│                   ├── Company Name
│                   ├── Value
│                   ├── Status Badge
│                   ├── Date
│                   └── Actions Dropdown
```

## Responsive Breakpoints

### Mobile (<768px)
```
┌─────────────────┐
│    Header       │
├─────────────────┤
│  Stats (1 col)  │
│  ┌───────────┐  │
│  │  Card 1   │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │  Card 2   │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │  Chart 1  │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │  Chart 2  │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │ Activity  │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │   Table   │  │
│  └───────────┘  │
└─────────────────┘
Sidebar: Overlay/Drawer
```

### Tablet (768px - 1024px)
```
┌───────────────────────┐
│       Header          │
├───────┬───────────────┤
│       │  Stats (2col) │
│ Side  │  ┌─────┬─────┐│
│ bar   │  │Card1│Card2││
│       │  └─────┴─────┘│
│       │  ┌─────┬─────┐│
│       │  │Card3│Card4││
│       │  └─────┴─────┘│
│       │  ┌───────────┐│
│       │  │  Chart 1  ││
│       │  └───────────┘│
│       │  ┌───────────┐│
│       │  │  Chart 2  ││
│       │  └───────────┘│
└───────┴───────────────┘
Sidebar: 80px collapsed
```

### Desktop (>1024px)
```
┌───────────────────────────────────────┐
│            Header                     │
├───────┬───────────────────────────────┤
│       │  Stats (4 columns)            │
│       │  ┌────┬────┬────┬────┐        │
│ Side  │  │Card│Card│Card│Card│        │
│ bar   │  └────┴────┴────┴────┘        │
│ 256px │  ┌───────────┬──────────┐     │
│       │  │  Chart 1  │ Chart 2  │     │
│       │  └───────────┴──────────┘     │
│       │  ┌──────────────────────┐     │
│       │  │   Full Width Chart   │     │
│       │  └──────────────────────┘     │
│       │  ┌────────┬─────────────┐     │
│       │  │Activity│   Table     │     │
│       │  │  (1col)│   (2cols)   │     │
│       │  └────────┴─────────────┘     │
└───────┴───────────────────────────────┘
```

## Component Dependencies

### External Libraries
```
StatsCard
└── lucide-react (icons)

DashboardCharts
├── recharts
│   ├── AreaChart
│   ├── BarChart
│   └── LineChart
└── lucide-react (Download icon)

DashboardHeader
├── @/components/ui/input
├── @/components/ui/button
├── @/components/ui/dropdown-menu
└── @/components/ui/avatar

RecentActivity
├── @/components/ui/avatar
└── @/components/ui/badge

DataTable
├── @/components/ui/table
├── @/components/ui/badge
├── @/components/ui/button
└── @/components/ui/dropdown-menu
```

### Internal Dependencies
```
DashboardLayout
├── DashboardSidebar
└── DashboardHeader

All Components
└── @/lib/utils (cn function)
```

## State Management Flow

```
┌─────────────────────────────────────────────┐
│            Application State                │
│  (React Query / Zustand / Context)          │
└────────────────┬────────────────────────────┘
                 │
      ┌──────────┼──────────┐
      │          │          │
      ▼          ▼          ▼
  ┌────────┐ ┌────────┐ ┌────────┐
  │ Stats  │ │ Charts │ │Activity│
  │  Data  │ │  Data  │ │  Data  │
  └────┬───┘ └────┬───┘ └────┬───┘
       │          │          │
       ▼          ▼          ▼
  ┌─────────────────────────────┐
  │      Dashboard Page         │
  │  ┌─────────────────────┐   │
  │  │  DashboardLayout    │   │
  │  │  ├─ StatsCard       │   │
  │  │  ├─ RevenueChart    │   │
  │  │  ├─ ProposalsChart  │   │
  │  │  ├─ RecentActivity  │   │
  │  │  └─ DataTable       │   │
  │  └─────────────────────┘   │
  └─────────────────────────────┘
```

## Clay Morphism Visual Effects

```
Convex (Raised) - Cards, Buttons
┌─────────────────┐
│                 │ ← Light shadow (top-left)
│   Clay Card     │
│                 │ ← Dark shadow (bottom-right)
└─────────────────┘

Concave (Sunken) - Inputs
┌─────────────────┐
│ ↓ Dark (inside) │
│   Input Field   │
│ ↑ Light (inside)│
└─────────────────┘

Pressed State
┌─────────────────┐
│ ↓↓ Deeper inset │
│   Active Button │
│                 │
└─────────────────┘
```

## Color Coding Legend

```
Icon Colors:
🔵 Blue    - Primary actions, revenue
🟢 Green   - Success, growth, clients
🟣 Purple  - Secondary actions, settings
🔵 Cyan    - Information, metrics
🟡 Yellow  - Warnings, pending states

Status Colors:
✅ Approved  - Green (#34C759)
⏳ Pending   - Yellow (#FCEE21)
❌ Rejected  - Red (destructive)
```

---

**Component Map Purpose**: Visual reference for understanding dashboard structure, component relationships, and responsive behavior patterns.
