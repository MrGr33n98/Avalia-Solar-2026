# Dashboard Components Documentation

## Overview
Modern B2B Dashboard implementation using shadcn/ui, Recharts, and Claymorphism design system.

## Component Architecture

### Layout Components

#### DashboardLayout
Main layout wrapper that provides the dashboard structure with sidebar and header.

**Props:**
- `children: ReactNode` - Dashboard page content
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<DashboardLayout>
  <YourDashboardContent />
</DashboardLayout>
```

#### DashboardSidebar
Collapsible sidebar navigation with menu items.

**Features:**
- Collapsible state
- Active route highlighting
- Icon-based navigation
- Smooth transitions

#### DashboardHeader
Top header with search, notifications, and user profile.

**Features:**
- Global search input
- Notification dropdown
- User profile menu
- Clay morphism styling

### Data Components

#### StatsCard
KPI/Metric card component for displaying key statistics.

**Props:**
- `title: string` - Card title
- `value: string | number` - Main metric value
- `change?: { value: number; label: string }` - Change percentage
- `icon: LucideIcon` - Icon component
- `iconColor?: "blue" | "green" | "purple" | "cyan" | "yellow"` - Icon color theme
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<StatsCard
  title="Total de Propostas"
  value="234"
  change={{ value: 12.5, label: "vs último mês" }}
  icon={FileText}
  iconColor="blue"
/>
```

#### ChartCard
Wrapper for chart components (Recharts).

**Props:**
- `title: string` - Chart title
- `description?: string` - Chart description
- `children: ReactNode` - Chart component
- `actions?: ReactNode` - Action buttons (e.g., download)
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<ChartCard
  title="Receita Mensal"
  description="Últimos 6 meses"
  actions={<Button>Export</Button>}
>
  <ResponsiveContainer>
    <AreaChart data={data}>
      {/* Chart configuration */}
    </AreaChart>
  </ResponsiveContainer>
</ChartCard>
```

#### RecentActivity
Activity feed component showing recent user actions.

**Props:**
- `activities?: Activity[]` - Array of activity items
- `className?: string` - Additional CSS classes

**Activity Type:**
```typescript
interface Activity {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  action: string;
  target: string;
  timestamp: string;
  type: "proposal" | "client" | "company" | "report";
}
```

#### DataTable
Table component for displaying recent proposals/data.

**Props:**
- `data?: DataItem[]` - Array of data items
- `className?: string` - Additional CSS classes

**DataItem Type:**
```typescript
interface DataItem {
  id: string;
  company: string;
  value: string;
  status: "pending" | "approved" | "rejected";
  date: string;
}
```

### Chart Components

#### DashboardCharts
Pre-configured chart components using Recharts:

- **RevenueChart** - Area chart for revenue trends
- **ProposalsChart** - Bar chart for proposal distribution
- **PerformanceChart** - Line chart for performance metrics

## Design System Integration

### Clay Morphism Classes Used
- `.clay-card` - Main card styling
- `.clay-panel` - Panel/sidebar styling
- `.clay-header` - Header bar styling
- `.clay-btn-primary` - Primary button styling
- `.clay-chip` - Chip/badge styling
- `.clay-input` - Input field styling
- `.clay-surface` - Base surface styling

### Color Tokens
- `--primary` - Brand Blue (#0056D2)
- `--secondary` - Brand Purple (#6C5CE7)
- `--accent` - Brand Green (#34C759)
- `--chart-2` - Cyan (#00AFEF)
- `--chart-4` - Yellow (#FCEE21)

## Shadcn/ui Components Required

Already installed components used:
- Avatar
- Badge
- Button
- Card
- Dialog
- Dropdown Menu
- Input
- Label
- Scroll Area
- Select
- Separator
- Switch
- Table
- Tabs
- Toast
- Tooltip

## Example Dashboard Page

```tsx
"use client";

import {
  DashboardLayout,
  StatsCard,
  RevenueChart,
  ProposalsChart,
  PerformanceChart,
  RecentActivity,
  DataTable,
} from "./components";
import { TrendingUp, FileText, Users, DollarSign } from "lucide-react";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* KPI Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Receita Total"
          value="R$ 328.500"
          change={{ value: 12.5, label: "vs último mês" }}
          icon={DollarSign}
          iconColor="blue"
        />
        <StatsCard
          title="Propostas"
          value="234"
          change={{ value: 8.2, label: "vs último mês" }}
          icon={FileText}
          iconColor="green"
        />
        <StatsCard
          title="Clientes Ativos"
          value="89"
          change={{ value: 15.3, label: "vs último mês" }}
          icon={Users}
          iconColor="purple"
        />
        <StatsCard
          title="Taxa de Conversão"
          value="68%"
          change={{ value: 5.1, label: "vs último mês" }}
          icon={TrendingUp}
          iconColor="cyan"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <RevenueChart />
        <ProposalsChart />
      </div>

      <div className="mt-6">
        <PerformanceChart />
      </div>

      {/* Activity and Data Table */}
      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <RecentActivity className="lg:col-span-1" />
        <DataTable className="lg:col-span-2" />
      </div>
    </DashboardLayout>
  );
}
```

## Responsive Behavior

- **Mobile (< 768px)**: Single column layout, collapsible sidebar
- **Tablet (768px - 1024px)**: 2-column grid for stats, stacked charts
- **Desktop (> 1024px)**: Full 4-column grid, side-by-side layouts

## Accessibility

- WCAG AA compliant color contrast
- Keyboard navigation support
- Screen reader labels
- Focus indicators
- Reduced motion support

## Performance Considerations

- Chart components use ResponsiveContainer for dynamic sizing
- Data tables paginated (implement in production)
- Lazy loading for chart libraries
- Optimized re-renders with React.memo where needed

## Future Enhancements

1. Real-time data updates with WebSocket/ActionCable
2. Customizable dashboard layouts (drag-and-drop)
3. Export functionality for charts and tables
4. Advanced filtering and date range selectors
5. Dark mode optimization
6. Mobile-specific optimizations
