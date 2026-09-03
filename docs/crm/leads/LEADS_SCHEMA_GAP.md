# Leads Schema Gap Analysis

| Field / Concept | Existing Column / Table | Action Required |
| --- | --- | --- |
| Lead Name | `sales_opportunities.name` | Reuse existing |
| Account / Company | `sales_opportunities.sales_account_id` | Reuse existing |
| Primary Contact | `sales_opportunities.primary_contact_id` | Reuse existing |
| Pipeline & Stage | `sales_opportunities.sales_pipeline_id` & `sales_stage_id` | Reuse existing |
| Owner | `sales_opportunities.owner_id` | Reuse existing |
| Temperature (Hot Lead 🔥) | Missing | Add column `temperature` (string: `cold`, `warm`, `hot`) to `sales_opportunities` |
| Expected Close Date | `sales_opportunities.expected_close_date` | Reuse existing |
| Value (Money Cents) | `sales_opportunities.value_cents` | Reuse existing |
| Probability (%) | `sales_opportunities.probability` & `probability_overridden` | Reuse existing |
| Sources | Missing table | Create `sales_sources` table and `source_id` foreign key |
| Competitors | Missing table | Create `sales_competitors` and `sales_opportunity_competitors` tables |
| Multiple Contacts | Missing table | Create `sales_opportunity_contacts` join table with `role` |
