# Requirements Document - GTM & GA4 Diagnostic Specification

## Introduction
This specification defines a diagnostic suite for Google Tag Manager (GTM) and Google Analytics 4 (GA4) within the AB0-1 platform. The purpose is to ensure that analytics are correctly implemented, compliant with LGPD (consent-based loading), and accurately capturing user interactions and attribution (UTMs). This diagnostic will identify common configuration errors, tracking gaps, and performance impacts.

## Alignment with Product Vision
Accurate data is critical for understanding user behavior and optimizing the platform. Ensuring LGPD compliance protects user privacy and avoids legal risks. High-performance analytics implementation prevents the tracking code from degrading the user experience (LCP/TBT).

## Requirements

### Requirement 1: Initialization & Consent Compliance
**User Story:** As a developer, I want to verify that GTM and GA4 only initialize after explicit consent or after the 5s lazy-load timeout (if consent is already given), so that the application remains LGPD compliant and high-performing.

#### Acceptance Criteria
1. WHEN the application loads THEN GTM/GA4 scripts SHALL NOT be injected before the 5s timeout or explicit consent.
2. IF the user denies consent THEN GTM/GA4 tracking SHALL remain disabled.
3. WHEN consent is granted THEN GTM/GA4 SHALL initialize immediately.
4. GTM/GA4 initialization SHALL use the correct IDs (GTM-5RV76ZKR, G-5RV76ZKR).

### Requirement 2: Event Tracking & Deduplication
**User Story:** As a marketing analyst, I want to ensure that events (page views, clicks, form submissions) are tracked accurately without duplicates, so that data reports are reliable.

#### Acceptance Criteria
1. WHEN a page is viewed THEN exactly one `page_view` event SHALL be sent to GA4.
2. WHEN a tracked interaction occurs (e.g., click) THEN the `track` event SHALL be emitted.
3. IF an event is triggered multiple times rapidly THEN the `dedupe.ts` logic SHALL prevent duplicate events from being sent.
4. Events SHALL include the correct context (session ID, user properties if available).

### Requirement 3: Attribution & UTM Tracking
**User Story:** As a growth manager, I want to verify that UTM parameters are correctly captured and persisted, so that marketing campaign performance can be attributed correctly.

#### Acceptance Criteria
1. WHEN a user arrives with UTM parameters THEN `utm.ts` SHALL capture and store them in cookies/localStorage.
2. IF a user navigates between pages THEN UTM attribution SHALL persist across the session.
3. Captured UTMs SHALL be included in subsequent tracking events (e.g., lead submission).

### Requirement 4: Performance Impact Audit
**User Story:** As a performance engineer, I want to ensure that analytics loading does not negatively impact LCP (Largest Contentful Paint) or TBT (Total Blocking Time).

#### Acceptance Criteria
1. Analytics loading SHALL be deferred (lazy-loaded) to avoid competing with critical path assets.
2. The `AdvancedAnalytics` component SHALL be loaded dynamically (code splitting).

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility**: The diagnostic tools should be modular and not interfere with production tracking logic.
- **Clear Interfaces**: Use the existing `lib/analytics` interfaces for testing.

### Reliability
- The diagnostic suite should provide clear "Pass/Fail" results.
- Automated tests (Playwright/Jest) should be used for validation.

### Usability
- Diagnostic results should be easy to read in the logs or a dashboard.
