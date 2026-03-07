## 1. Audit alignment and contracts

- [ ] 1.1 Cross-check the current Company Dashboard endpoints, frontend components and admin resources against the audited files and confirm the implementation surface for categories, media, badges, banners and social proof
- [ ] 1.2 Define the API contract for reviewable edits, including `pending_review` status payloads and the metadata required by the frontend to render "Em revisão"
- [ ] 1.3 Define the backend notification contract that separates operational notifications from analytics tracking for `PendingChange`

## 2. Reviewable edit flow hardening

- [ ] 2.1 Refactor reviewable dashboard actions to persist a normalized diff in `PendingChange` and return explicit pending-state responses
- [ ] 2.2 Implement a dedicated operational notification path for newly created pending changes and for approval or rejection outcomes
- [ ] 2.3 Update Active Admin approval flows to apply or reject diffs through a deterministic service layer with audit history
- [ ] 2.4 Update the Company Dashboard frontend to render pending-state messaging for reviewable sections after submission and after reload

## 3. Media and preview integrity

- [ ] 3.1 Add backend validation rules for dashboard image uploads, including supported types, file-size constraints and deterministic error responses
- [ ] 3.2 Ensure uploaded dashboard images expose preview-safe variants or derivatives for frontend rendering
- [ ] 3.3 Add canonical parsing and provider validation for supported YouTube and Vimeo URLs and reject malformed or unsupported links
- [ ] 3.4 Implement a supported preview path for draft or pending company profile states without exposing unpublished data publicly

## 4. Trust badge reliability

- [ ] 4.1 Review the badge embed URL and rendering flow and align it with the intended public destination and tracking metadata
- [ ] 4.2 Update badge delivery to use deterministic cache invalidation tied to company badge state changes
- [ ] 4.3 Enforce the expected origin policy for badge embed requests and make failure modes observable for debugging

## 5. Feature gating foundation

- [ ] 5.1 Introduce the domain model for plans, features, plan-feature assignments, company subscriptions and company-specific feature overrides
- [ ] 5.2 Implement `Company::FeatureGateService` with precedence rules for overrides, plan entitlements and usage limits
- [ ] 5.3 Protect paid dashboard mutations such as review highlight and banner actions with centralized backend feature-gate checks
- [ ] 5.4 Expose effective feature metadata, limits and upgrade hints in dashboard-facing API responses

## 6. Active Admin and frontend monetization controls

- [ ] 6.1 Add Active Admin controls to view and update a company's plan, feature overrides and effective usage against limits
- [ ] 6.2 Add frontend locked-state components for paid features, including review highlight tooltip and banner upgrade states
- [ ] 6.3 Ensure banner and review-highlight UX consumes server-provided feature metadata instead of reimplementing plan logic in the client

## 7. Verification and rollout

- [ ] 7.1 Add backend tests covering pending review contracts, notification dispatch, video validation, badge freshness and feature-gate authorization
- [ ] 7.2 Add frontend tests covering pending-state UI, media preview behavior and paid-feature locked states
- [ ] 7.3 Validate the implementation against the existing dashboard audit stories and update the relevant story checklists and file lists
- [ ] 7.4 Define rollout and rollback notes for hotfix-first delivery, including any route versioning needed for legacy consumers
