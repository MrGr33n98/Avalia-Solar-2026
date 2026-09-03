# Leads API Contract Specification

## Public Endpoints

### 1. `GET /api/v1/sales/leads`
Query Parameters:
- `q`: search keyword
- `temperature`: `cold`, `warm`, `hot`
- `status`: `open`, `won`, `lost`
- `owner_id`: number or `unassigned`
- `pipeline_id`, `stage_id`: numbers
- `source_id`, `competitor_id`: numbers
- `value_min`, `value_max`: cents
- `page`, `per_page`: pagination

### 2. `POST /api/v1/sales/leads`
Payload:
```json
{
  "lead": {
    "name": "Projeto Usina Rooftop 200kWp",
    "sales_account_id": 12,
    "sales_pipeline_id": 1,
    "sales_stage_id": 2,
    "owner_id": 5,
    "temperature": "hot",
    "expected_close_date": "2026-10-15",
    "value_cents": 25000000,
    "probability": 75,
    "source_id": 3,
    "competitor_ids": [1, 2],
    "contact_ids": [14]
  }
}
```

### 3. `GET /api/v1/sales/leads/:id` & `PATCH /api/v1/sales/leads/:id`
Handles single lead details and updates.
