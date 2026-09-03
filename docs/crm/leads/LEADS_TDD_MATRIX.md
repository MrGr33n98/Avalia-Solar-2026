# Leads TDD Test Matrix

| Test Suite | File | Coverage Goal |
| --- | --- | --- |
| Leads API Request Spec | `spec/requests/api/v1/sales/leads_spec.rb` | 100% endpoint contracts (index, create, show, update, change_stage) |
| Leads Create Service | `spec/services/sales/leads/create_spec.rb` | Atomic creation, StageHistory creation, line items, competitors |
| Leads Query Spec | `spec/queries/sales/leads_query_spec.rb` | Filter validation, SQL safety, tenant isolation |
| TypeScript Compiler | `npm run typecheck` | 0 errors |
