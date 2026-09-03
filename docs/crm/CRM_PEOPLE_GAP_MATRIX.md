# CRM People — Gap Matrix (Benchmark Nutshell vs Avalia Solar)

| Capability | Benchmark | Avalia Status | Implementation |
| --- | --- | --- | --- |
| Canonical Entity | Contact | DONE | `Sales::Contact` |
| Real Owner Filter | Assigned To | DONE | `Sales::ContactsQuery` (`user_id`) |
| Real Last Contact | Last Contact | DONE | `Sales::Contacts::LastContactResolver` |
| Real Next Action | Next Action | DONE | `Sales::Contacts::NextActionResolver` |
| Canonical Timeline | Activity feed | DONE | `Sales::Contacts::TimelineBuilder` |
| Person 360 Workspace | Full Record | DONE | `/dashboard/sales/people/[id]` (75%/25%) |
| Write Note | Inline Editor | DONE | Inline composer in Person 360 |
| Internal Email | CRM Composer | DONE | `SendEmailModal` (POST `/api/v1/sales/emails`) |
| List / Map Toggle | Map View | DONE | `PeopleMapView.tsx` |
| Columns Configurator | Column Manager | DONE | `PeopleColumnsDialog.tsx` |
| Metadata Pagination | Paginated list | DONE | `{ page, per_page, total, pages }` |
