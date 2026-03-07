## ADDED Requirements

### Requirement: Paid dashboard actions must be enforced by backend feature gating
The system MUST enforce paid Company Dashboard actions on the backend through a centralized feature gate and MUST NOT rely only on frontend affordances to block access.

#### Scenario: Locked paid feature is blocked server-side
- **WHEN** a company without access attempts to use a paid dashboard action such as review highlight or banner management
- **THEN** the backend rejects the action through the centralized feature gate
- **THEN** the response includes machine-readable upgrade context for the frontend

#### Scenario: Allowed paid feature passes server-side gate
- **WHEN** a company with access or an approved override performs a paid dashboard action
- **THEN** the centralized feature gate authorizes the request
- **THEN** the controller proceeds without duplicating commercial rule logic locally

### Requirement: Effective feature access must support plan limits and company overrides
The system MUST derive effective feature access from plan assignment, feature definitions, limit rules and company-specific overrides with deterministic precedence.

#### Scenario: Company override takes precedence over plan default
- **WHEN** a company has an override configured for a feature
- **THEN** the system uses the override before evaluating the plan default
- **THEN** the resulting enablement or limit reflects the override value

#### Scenario: Limit-aware feature returns effective allowance
- **WHEN** the dashboard requests feature metadata for a company
- **THEN** the system returns whether the feature is enabled and any applicable limit or remaining allowance
- **THEN** the frontend can render lock state, usage and upgrade messaging consistently

### Requirement: Active Admin must manage plans, features and company-specific exceptions
The system MUST provide administrative controls to manage plans, feature assignments and company-specific exceptions without manual database edits.

#### Scenario: Admin updates company feature access
- **WHEN** an administrator changes a company's plan or toggles a feature override in Active Admin
- **THEN** the system persists the change through supported admin resources
- **THEN** subsequent dashboard requests reflect the new effective feature state

#### Scenario: Admin inspects usage against feature limits
- **WHEN** an administrator views a company's commercial configuration
- **THEN** the system shows the relevant plan, enabled features and current usage against any configured limits

### Requirement: Locked features must expose UX metadata for upsell states
The system MUST expose UX-ready metadata for locked feature states so the frontend can present tooltips, banners and upgrade prompts consistently.

#### Scenario: Review highlight renders locked upsell state
- **WHEN** the frontend requests dashboard data for a company without `review_highlight`
- **THEN** the response includes feature metadata indicating that the action is locked
- **THEN** the UI can show a tooltip explaining that the feature requires a paid plan

#### Scenario: Banner feature exposes monetization metadata
- **WHEN** the frontend requests banner configuration for a company
- **THEN** the response includes whether banner management is enabled and any related commercial metadata
- **THEN** the UI can choose between edit mode, disabled mode or upgrade CTA without reimplementing business rules
