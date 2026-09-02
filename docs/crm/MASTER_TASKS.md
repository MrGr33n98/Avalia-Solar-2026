# Avalia Solar CRM Master Tasks & Audit Matrix

## 1. Current State & Capability Matrix

| Capability | Current State | Target State | Priority | Status |
|---|---|---|---|---|
| Sales Domain Models (`Sales::*`) | Present in Rails (`Account`, `Contact`, `Opportunity`, `Pipeline`, `Stage`, `StageHistory`, `Qualification`, `Activity`, `Task`) | Full Domain Invariants & Validations | P0 | Verified |
| API Endpoints (`/api/v1/sales/*`) | Present (`accounts`, `contacts`, `opportunities`, `tasks`, `activities`, `qualifications`, `closures`, `account_links`) | Complete CRUD + Search + Pundit Auth | P0 | Verified |
| CRM Shell & Navigation | Sidebar, Header, Subdomain Routing (`crm.avaliasolar.com.br`) | Twenty-quality UX + Linear-speed | P0 | Implemented |
| Kanban Board | Drag & Drop, stage counters, totals, data-testids | Fluid optimistic DnD + Stage History | P0 | Implemented |
| Accounts / Companies | Table + Inline editing + Search | Twenty-inspired dense table + Marketplace enrichment | P0 | Implemented |
| Contacts | List + Quick actions (WhatsApp, Call, Email) | Decision Role (Maker/Champion/Influencer) + Quick actions | P0 | Implemented |
| Opportunities | Table + Record Drawer + Inline Edit | Full Record Page + Drawer + Next Action | P0 | Implemented |
| Activities & Timeline | Timeline feed + Activity composer | Log Call/WhatsApp/Note/Meeting <10s | P0 | Implemented |
| Tasks & Work Queue | Tasks list + Checkbox completion | Today / Work Queue / Overdue / Upcoming | P0/P1 | Implemented |
| SPIN & BANT Qualification | Form in Drawer / Record | Basic SPIN (Situation, Problem, Implication, Need-Payoff) + BANT | P0/P1 | Implemented |
| Won / Lost Special Flows | Modal with Lost Reasons (Price, Competitor, etc.) & Won details | Structured Lost Reason Analytics | P0 | Implemented |
| Global Search | Keyword search across accounts/contacts/deals | Fast normalized search (name, phone, CNPJ, city) | P0/P1 | Implemented |
| Command Palette (`Cmd+K`) | Keyboard shortcut + dialog | Command palette for navigation & quick creation | P1 | Implemented |
| WhatsApp & Email Scripts | Popover template generator with dynamic variables | B2B Solar Outreach Scripts | P1 | Implemented |
| Prospecting Queue & Inbox | List of accounts to prospect | Daily work queue with "No Next Action" & "Stale" filters | P1 | Implemented |
| Lead Scoring | Scores (0-100) + Solar fit | Solar-specific score calculation | P1 | Implemented |
| CSV / File Import Wizard | File upload, Google Sheets, paste & column mapper | Batch API import + Duplicate detection | P1 | Implemented |
| Analytics & Reports | Recharts Forecast, Funnel, Win/Loss | Executive intelligence dashboard | P1 | Implemented |

---

## 2. P0 Tasks Tracker (MVP Essential)
- [x] Backend Domain Verification & Models (`AB0-1-back`)
- [x] API Routing & Middleware Host Detection (`crm.avaliasolar.com.br`)
- [x] Fallback Routes (`/dashboard/companies`, `/dashboard/clients`, `/dashboard/reports`, `/dashboard/import`, `/dashboard/today`)
- [x] Twenty-inspired CRM Shell (Sidebar, Header, Layout)
- [x] Accounts / Companies View with Inline Actions
- [x] Contacts View with WhatsApp / Phone / Email Quick Actions
- [x] Opportunities Kanban Board with Drag & Drop (`dragover`, stage sum, deal count)
- [x] Record Detail Lateral Drawer (Overview, Activities, Tasks, SPIN/BANT)
- [x] Activity Composer & Timeline (Log Call, Note, WhatsApp, Meeting)
- [x] Task Management (Completion, Due Dates, Priorities)
- [x] Next Action Field & Coverage Detection
- [x] Won / Lost Dialog Flow with Lost Reasons
- [x] Global Search Component

---

## 3. P1 Tasks Tracker (Productivity & Sales Quality)
- [x] Lead Import Wizard (CSV, TSV, XLSX, Google Sheets, Quick Add)
- [x] Executive Sales Analytics & Reports (`SalesAnalyticsReport`)
- [x] Prospecting Inbox / Daily Work Queue (`/dashboard/sales/today`)
- [x] Stale Deal & No-Next-Action Detection
- [x] Solar-Specific Lead Score Display
- [x] Command Palette (`Cmd+K` / `CRMCommandPalette`)
- [x] B2B Solar Outreach Templates (`SalesOutreachTemplates`)

---

## 4. Decisions & Architectural Invariants
1. **Subdomain Isolation:** Requests to `crm.avaliasolar.com.br` redirect cleanly to `/dashboard/sales` without mixing with the B2B client portal.
2. **Sales Domain Models:** Active models in `AB0-1-back/app/models/sales/` (`Account`, `Contact`, `Opportunity`, `Pipeline`, `Stage`, `StageHistory`, `Qualification`, `Activity`, `Task`).
3. **UX Benchmark:** Twenty CRM ergonomics + Linear speed + Notion clarity with Avalia Solar yellow/navy executive styling.

---

## 5. Validation Evidence
- **TypeScript Typecheck:** `npm run typecheck` (`tsc --noEmit`) $\rightarrow$ **0 Errors**
- **Jest Unit Tests:** `CRMCommandPalette.test.tsx` & `SalesCommandCenter.test.tsx` $\rightarrow$ **4/4 Passed (100% Green)**
- **Rails Backend:** `Sales::Account.count` $\rightarrow$ **10 records active**
- **Git State:** Clean commits pushed to `origin/main`.
