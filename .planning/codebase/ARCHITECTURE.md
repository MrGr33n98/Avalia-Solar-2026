# Architecture

## System Overview
The application is a multi-tier platform built with Next.js (Frontend) and Ruby on Rails (Backend).
It operates as a Trust as a Service (TaaS) platform mapping intent behaviors and aggregating company credentials.

### API Layer
- **Controllers:** `/api/v1/` exposing JSON endpoints for fetching `company_dashboard` features, `leads`, `products`, `reviews`, etc.
- **Service Objects (`app/services`):** Isolated business logic (e.g., `trust_score/calculation_service.rb`, `reputation_service.rb`, `ranking_service.rb`, `intent_scoring_service.rb`).
- **Async Processing:** Sidekiq Workers (`app/workers/trust_score_recalculation_worker.rb`) run heavy tasks on trigger (e.g., new review).

### Database Layer
- **ActiveRecord Models:** Contains associations (`has_many`, `belongs_to`), callbacks (`app/models/concerns/review_callbacks.rb`), and validations. Migrations manage schema state (`AB0-1-back/db/migrate`).

### Frontend Design System
- **AS-EDS:** Aesthetics govern the framework. 
- **Claymorphism / Glassmorphism:** Extruded 3D surfaces and subtle blurs for a premium B2B SaaS feel. 

### Data Flow
Frontend `fetchApi` logic communicates primarily with Backend API exposed via `$process.env.NEXT_PUBLIC_API_URL`. Async event streaming or active polling may occur using hooks on complex pages. Webhooks are heavily employed for lead lifecycle tracking securely managed via signatures.
