# Leads Workspace Refactor Baseline

## Overview & Architecture Decision
- **Product Entity**: `LEAD`
- **Domain Persistence Entity**: `Sales::Opportunity` (`sales_opportunities`)
- **Primary Route**: `/dashboard/sales/leads`
- **Legacy Route**: `/dashboard/sales/pipeline` -> Compatibility redirect to `/dashboard/sales/leads?view=kanban`

## Baseline Metrics & Requirements
- Story Point Target: 95 SP
- Form Width Benchmark: 500–540px
- Zero Mock Policy: All options loaded from server APIs
