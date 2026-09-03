# Leads Workspace Release Gate Checklist

- [x] **Sidebar Navigation**: Sidebar displays "Leads" pointing to `/dashboard/sales/leads`.
- [x] **Legacy Compatibility Redirect**: `/dashboard/sales/pipeline` redirects to `/dashboard/sales/leads?view=kanban`.
- [x] **Global Add Lead**: "+ Novo" button displays "Lead" and triggers `CreateLeadModal`.
- [x] **Canonical CreateLeadModal**: Proportions ~540px, fixed header/footer, scrollable body.
- [x] **Nutshell Form Parity**: Name, Pipeline, Stage, Hot Lead 🔥 (`temperature`), Owner, Expected Close Date, Products/Line items (cents), Confidence %, Account, People with roles, Sources, Competitors.
- [x] **Backend API & Query Layer**: REST `/api/v1/sales/leads` endpoints delegating to `Sales::Opportunity` with `Sales::LeadsQuery` and `Sales::Leads::Create`.
- [x] **Zero Mock Data**: All dropdowns, comboboxes, and taxonomies loaded dynamically from server APIs.
- [x] **Quality Gate**: RSpec specs pass, `npm run typecheck` (0 errors), zero-mock script PASS.
