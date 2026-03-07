## ADDED Requirements

### Requirement: Company media uploads must be validated and preview-safe
The system MUST validate company media uploads before persistence and MUST provide preview-safe image representations for dashboard rendering.

#### Scenario: Valid image upload produces preview-safe asset
- **WHEN** a company uploads a supported image file within size and type constraints
- **THEN** the system accepts the upload through the configured media pipeline
- **THEN** the system produces a preview-safe derivative or variant for dashboard display
- **THEN** the frontend receives a renderable media reference without requiring ad hoc thumbnail generation in the browser

#### Scenario: Invalid image upload is rejected deterministically
- **WHEN** a company uploads an unsupported file type or an oversized media asset
- **THEN** the system rejects the upload with a validation error
- **THEN** the response explains why the asset cannot be processed

### Requirement: Company video links must be normalized and provider-validated
The system MUST accept only supported video providers and MUST normalize supported URL formats into a canonical preview representation.

#### Scenario: Supported shared YouTube URL is normalized
- **WHEN** a company submits a supported YouTube or Vimeo URL, including alternate share formats
- **THEN** the system extracts and stores a canonical provider reference suitable for preview
- **THEN** the frontend can render the video preview without provider-specific URL parsing hacks

#### Scenario: Unsupported or malformed video URL is rejected
- **WHEN** a company submits a playlist URL, malformed URL, or unsupported provider link
- **THEN** the system rejects the request with a validation error
- **THEN** the invalid URL is not persisted as a company video entry

### Requirement: Draft and pending company profiles must support authenticated preview
The system MUST provide a supported preview flow for company profile states that are not yet publicly visible.

#### Scenario: Company previews pending profile state
- **WHEN** a company requests preview of a profile with draft or pending data
- **THEN** the system serves the preview through an authenticated or signed preview mechanism
- **THEN** the preview reflects unpublished changes without exposing them publicly

#### Scenario: Public profile remains protected from draft leakage
- **WHEN** an unauthenticated public request targets the company public page
- **THEN** the system does not reveal draft or pending-only content
- **THEN** only approved public data is visible

### Requirement: Trust badge embeds must serve fresh and origin-safe output
The system MUST serve trust badge embeds with cache and origin behavior that preserves freshness and expected embed usage.

#### Scenario: Badge reflects updated trust score
- **WHEN** the company trust score or badge state changes
- **THEN** the badge output becomes refreshable through a deterministic cache invalidation strategy
- **THEN** newly embedded badge requests can retrieve the updated representation

#### Scenario: Badge embed request enforces allowed origins
- **WHEN** a badge embed request is made from a supported origin
- **THEN** the system returns the badge asset with the required origin policy for rendering
- **THEN** the badge destination link includes the expected tracking or destination metadata

#### Scenario: Badge embed rejects unsupported origin behavior
- **WHEN** a badge embed request is made from an unsupported or malformed origin context
- **THEN** the system responds according to the configured origin policy
- **THEN** the behavior is predictable and observable for debugging
