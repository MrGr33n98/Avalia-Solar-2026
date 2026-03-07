## ADDED Requirements

### Requirement: Reviewable dashboard edits must return explicit pending review state
The system MUST persist reviewable Company Dashboard edits as `PendingChange` records and MUST return an explicit API response indicating that the change is pending operational review.

#### Scenario: Category change enters review
- **WHEN** an authenticated company user submits a category update that requires approval
- **THEN** the system creates a `PendingChange` with the category diff and status `pending`
- **THEN** the API response includes a machine-readable state such as `pending_review`
- **THEN** the response includes enough metadata for the frontend to show that the requested change is not yet active

#### Scenario: Pending review state survives page refresh
- **WHEN** the company dashboard reloads after a reviewable edit was submitted
- **THEN** the system returns the current pending review state for the affected section
- **THEN** the frontend can render the section as "Em revisão" until the request is approved or rejected

### Requirement: Reviewable edits must generate operational notifications outside analytics
The system MUST generate operational notifications for reviewable dashboard edits through a dedicated operational notification path and MUST NOT rely solely on analytics events for operational awareness.

#### Scenario: Pending change notifies operations
- **WHEN** a `PendingChange` is created from a dashboard edit
- **THEN** the system emits an operational notification event or job targeted to the administrative review channel
- **THEN** the notification is traceable independently from analytics logs

#### Scenario: Analytics remains secondary
- **WHEN** the system tracks a dashboard update request for analytics purposes
- **THEN** the operational notification still exists even if analytics ingestion is delayed or unavailable

### Requirement: Review decisions must be auditable and user-visible
The system MUST apply approval and rejection decisions through a deterministic service flow that preserves auditability and notifies the company of the final decision.

#### Scenario: Admin approves a pending change
- **WHEN** an admin approves a pending dashboard change in Active Admin
- **THEN** the system applies the stored diff to the canonical company data
- **THEN** the pending change status becomes `approved`
- **THEN** the company receives a visible status update for the affected section

#### Scenario: Admin rejects a pending change
- **WHEN** an admin rejects a pending dashboard change
- **THEN** the pending change status becomes `rejected`
- **THEN** the rejection reason is preserved for audit history
- **THEN** the company dashboard can display that the requested edit was not accepted
