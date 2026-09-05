# MASTER TASK — AVALIA SOLAR CRM

## Campaign & Outbound Marketing — Production Ready E2E Certification

REPOSITORY:
MrGr33n98/Avalia-Solar-2026

APPLICATION:
https://crm.avaliasolar.com.br/dashboard/sales/campaigns

OBJECTIVE:
Transform the existing Campaign / Outbound Marketing implementation into a
100% functional, production-ready, observable and tested outbound email engine.

DO NOT build a parallel marketing system.

Reuse and complete the existing canonical stack:

Sales::Campaign
Sales::CampaignRecipient
Sales::Contact
Sales::Account
Sales::Opportunity
Sales::EmailTemplate
Sales::EmailMessage
Sales::EmailEvent
Sales::EmailLink
Sales::EmailSuppression
Sales::EmailSequence
Sales::Campaigns::AudienceResolver
Sales::Campaigns::Preflight
Sales::Campaigns::SnapshotService
Sales::Campaigns::Dispatcher
Sales::CampaignBatchProcessorJob
Sales::SendEmailJob
Sales::Messaging::Providers::Ses
Redis
Sidekiq
AWS SES / SNS

================================================== 0. VERIFIED PRODUCTION BASELINE — DO NOT IGNORE
==================================================

A real production diagnostic was performed.

Campaign:

id=1
name=Q3 2026
status=draft
total_recipients=0
processed_recipients=0
email_template_id=nil

audience_filter:
{
"search": "felipe@avaliasolar.com.br",
"segment": "Integrador / Instalador"
}

CampaignRecipient:
count=0

Preflight returned:

{
ready: false,
blockers: [
{
code: "MISSING_TEMPLATE",
message: "Selecione um template de e-mail."
}
],
warnings: [],
audience: {
estimated_count: 5
},
sender: {
sender_id: 19,
sender_name: "Felipe Henrique",
from_email: "contato@weg.net"
},
provider: {
provider: "aws_ses",
status: "configured"
}
}

Dispatcher returned:

{
status: "draft",
error: "PREFLIGHT_FAILED",
message: "A campanha não passou no preflight."
}

Production EmailTemplate query returned:

Sales::EmailTemplate.count == 0

Frontend click does reach:

POST /api/v1/sales/campaigns/1/dispatch

Controller:
Api::V1::Sales::CampaignsController

Action:
launch

HTTP:
200

BUT:

CampaignBatchProcessorJob is NOT enqueued.
SendEmailJob is NOT enqueued.
SES is NOT reached.

Therefore the current proven break is:

Campaign
->
Preflight
->
MISSING_TEMPLATE
->
PREFLIGHT_FAILED
->
HTTP 200
->
Frontend gives insufficient feedback
->
No snapshot
->
No recipients
->
No Sidekiq campaign job
->
No SES call

==================================================

1. # PRIMARY SUCCESS FLOW

The following flow MUST work from the CRM UI without Rails console,
manual SQL, rake commands or production intervention:

User opens Campaigns
|
v
Create Campaign
|
v
Configure Campaign
|
+--> Name
+--> Campaign Type
+--> Owner
+--> Audience
+--> Template
+--> Sender
+--> Schedule
|
v
Audience Preview
|
v
Eligibility / Suppression / Consent
|
v
Preflight
|
+--> Name OK
+--> Template OK
+--> HTML body OK
+--> Subject OK
+--> Sender OK
+--> Audience > 0
+--> Provider OK
+--> Status valid
|
v
Recipient Snapshot
|
v
Sales::CampaignRecipient
|
v
Dispatch
|
v
CampaignBatchProcessorJob
|
v
SendEmailJob
|
v
Messaging Provider
|
v
AWS SES
|
v
provider_message_id
|
v
SES/SNS EVENTS
|
+--> delivery
+--> bounce
+--> complaint
|
v
Tracking
|
+--> open
+--> click
+--> unsubscribe
+--> reply where supported
|
v
CampaignRecipient lifecycle
|
v
Campaign counters
|
v
Analytics
|
v
Contact / Opportunity / Revenue Attribution

================================================== 2. EXECUTION RULE
==================================================

Do not implement blindly from this document.

First inspect the repository's current HEAD.

For every area inspect the REAL:

routes
controllers
models
services
queries
jobs
policies
serializers
migrations
schema
Sidekiq configuration
Redis configuration
SES provider
SNS webhook
email tracking
frontend pages
frontend API clients
hooks
components
forms
tests
CI

Documentation is reference only.

Repository code is source of truth.

================================================== 3. P0 — EMAIL TEMPLATE SYSTEM
==================================================

ROOT CAUSE CURRENTLY VERIFIED:
Production has zero Sales::EmailTemplate records.

Audit:

AB0-1-back/app/models/sales/email_template.rb

Confirm schema from:
db/schema.rb
migrations for sales_email_templates

Confirm existing controller:
Api::V1::Sales::EmailTemplatesController

Confirm routes.

Confirm frontend:
app/dashboard/sales/settings/email/templates/page.tsx

Confirm API client used by this page.

The template feature MUST support:

create
read
update
duplicate
archive/delete according to current architecture
preview
test render

Required fields must reflect actual schema.

At minimum current model requires:

company
name
subject_template

Preflight also requires:

body_html

Template must be tenant scoped.

A user from company A must never see/edit/use a template from company B.

Implement proper empty state:

"Nenhum template criado"

CTA:
"Criar primeiro template"

Campaign editor must be able to create a template without leaving the workflow,
or navigate to template creation and return to campaign.

Campaign creation cannot reach a misleading launch state when no templates exist.

================================================== 4. P0 — CAMPAIGN CREATION WIZARD
==================================================

Current page is too operational/technical.

Do not expose internal orchestration as primary UX.

Replace the fragmented mental model with:

STEP 1 — Details
STEP 2 — Audience
STEP 3 — Content
STEP 4 — Sender
STEP 5 — Review
STEP 6 — Send / Schedule

The user must NOT need to understand:

SnapshotService
CampaignRecipient
Dispatcher
Sidekiq

Those are implementation details.

The application must orchestrate them automatically.

================================================== 5. P0 — AUDIENCE BUILDER
==================================================

Audit:

Sales::Campaigns::AudienceResolver

Validate against:

Sales::Contact
Sales::Account
Sales::Opportunity

Current production filter resolves estimated_count=5,
therefore preserve working behavior.

But certify all filters.

Required audience capabilities:

search
segment
account/company
city
state
region
contact owner
account owner
opportunity stage
pipeline
tags if canonical
source
status
created_at
last activity
has email
consent
suppression
unsubscribed
bounce state

Never materialize arbitrary cross-tenant contacts.

Audience preview must display:

estimated contacts
eligible contacts
excluded contacts
missing email
suppressed
unsubscribed
duplicates
invalid email

The count shown before launch MUST match the snapshot contract
except for explicitly documented eligibility changes.

================================================== 6. P0 — PREFLIGHT CONTRACT
==================================================

Audit:

AB0-1-back/app/services/sales/campaigns/preflight.rb

Current preflight checks:

name
template
sender
audience
status

Improve it into a production gate.

Required blocker codes should include where applicable:

MISSING_NAME
MISSING_TEMPLATE
EMPTY_TEMPLATE_BODY
MISSING_SENDER
EMPTY_AUDIENCE
INVALID_STATUS
INVALID_SENDER
UNVERIFIED_SENDER
PROVIDER_UNAVAILABLE
NO_ELIGIBLE_RECIPIENTS
INVALID_TEMPLATE_VARIABLES

Warnings can include:

EMPTY_SUBJECT_TEMPLATE
SMALL_AUDIENCE
MISSING_COMPANY_EMAIL
HIGH_BOUNCE_RISK
PARTIAL_SUPPRESSION

Do not fake provider health.

Current code returns:

provider: aws_ses
status: configured

Audit whether this represents actual configuration.

If possible distinguish:

configured
verified
healthy

Preflight response contract:

{
ready: boolean,
blockers: [],
warnings: [],
audience: {
estimated_count,
eligible_count,
excluded_count
},
sender: {...},
template: {...},
provider: {...}
}

================================================== 7. P0 — FIX DISPATCH API CONTRACT
==================================================

Current behavior:

POST /api/v1/sales/campaigns/:id/dispatch

can return:

HTTP 200

while body contains:

error=PREFLIGHT_FAILED

This is misleading.

Audit the frontend API client and controller contract.

Choose one consistent contract.

Preferred:

422 Unprocessable Entity for preflight failure

with:

{
error: {
code: "PREFLIGHT_FAILED",
message: "...",
blockers: [...]
},
preflight: {...}
}

Alternatively, if command-result HTTP 200 is intentionally preserved,
the frontend MUST explicitly inspect:

dispatch.error
preflight.ready

and MUST NOT show success.

Never infer successful dispatch from HTTP 2xx alone.

================================================== 8. P0 — CAMPAIGN UI BLOCKERS
==================================================

Campaign list/detail must show readiness.

Example:

Q3 2026
Rascunho

Audience ✓ 5 encontrados
Template ✕ Não selecionado
Sender ✓ Felipe Henrique
Provider ✓ AWS SES
Preflight ✕ 1 bloqueio

"Selecione um template antes de disparar."

[Selecionar template]

[Disparar]
disabled

Launch button conditions:

campaign exists
AND
preflight.ready == true
AND
template exists
AND
eligible audience > 0

Never allow the UI to appear successful while backend rejected dispatch.

================================================== 9. P0 — SNAPSHOT
==================================================

Audit:

Sales::Campaigns::SnapshotService

Current Dispatcher behavior:

if @campaign.recipients.empty?
SnapshotService.call(campaign: @campaign)
end

Certify:

audience resolver input
tenant isolation
email normalization
deduplication
suppression
unsubscribe
consent
invalid emails
snapshot metadata
idempotency

Snapshot must create:

Sales::CampaignRecipient

with deterministic unique identity.

Repeated launch must not duplicate recipients.

Campaign counters must be updated atomically/correctly.

After snapshot expected invariant:

campaign.total_recipients ==
campaign.recipients.count

unless explicitly documented otherwise.

Do not expose "Snapshot" as a normal primary user action.

It may remain as an internal/debug/admin action if useful.

================================================== 10. P0 — DISPATCHER
==================================================

Audit:

AB0-1-back/app/services/sales/campaigns/dispatcher.rb

Current behavior is approximately:

lock
preflight
snapshot if necessary
status = dispatching
enqueue batches

Preserve good properties:

Redis lock
batch size
pause
resume
cancel
retry_failed

But certify state transitions.

Allowed:

draft -> dispatching
scheduled -> dispatching
paused -> dispatching
dispatching -> paused
dispatching -> completed

- -> cancelled according to domain rules

Prevent invalid transitions.

Do not silently return success for invalid actions.

Avoid update_all where lifecycle/domain events are required.

All operations must be idempotent and retry-safe.

================================================== 11. P0 — SIDEKIQ / BATCH EXECUTION
==================================================

Audit:

Sales::CampaignBatchProcessorJob

Ensure worker consumes the actual queue where campaign jobs are placed.

Production currently shows no campaign jobs because preflight blocks before enqueue.

After fixing template/preflight, prove that:

Dispatcher
->
CampaignBatchProcessorJob.perform_later
->
Sidekiq queue
->
worker starts
->
worker finishes

Add structured logging:

campaign_id
recipient_id
batch_id
job_id
queue
attempt
duration
status
error_code

Never log full email body or sensitive unnecessary personal data.

================================================== 12. P0 — SEND EMAIL JOB
==================================================

Audit:

Sales::SendEmailJob

Certify:

recipient lookup
campaign scope
contact scope
template render
merge variables
sender
from
reply-to
message persistence
provider invocation
provider_message_id

Every recipient must have observable lifecycle:

pending
queued
sending
sent
delivered
opened
clicked
bounced
complained
unsubscribed
failed
cancelled

Do not consider the email "sent" before provider acceptance.

================================================== 13. P0 — AWS SES PROVIDER
==================================================

Audit:

Sales::Messaging::Providers::Ses

Do not assume because preflight reports "configured" that delivery works.

Certify:

AWS credentials
region
SES identity
domain verification
from address
DKIM
SPF where infrastructure manages it
SES production/sandbox status
sending quota
rate limit
configuration set if used
SNS destinations if used

Provide a safe diagnostic command/service.

Example conceptual result:

{
configured: true,
credentials_valid: true,
identity_verified: true,
production_access: true,
quota: {...}
}

Never expose AWS secrets.

================================================== 14. P0 — EMAIL MESSAGE PERSISTENCE
==================================================

Each actual campaign send must produce/link the canonical:

Sales::EmailMessage

with:

campaign
campaign_recipient
contact where applicable
account where applicable
from_email
to_email
subject
rendered body
status
tracking token
provider_message_id
sent_at

Do not create a second outbound email model.

================================================== 15. P0 — SES/SNS EVENT LOOP
==================================================

Audit:

Api::V1::Sales::SesWebhooksController

and:

Sales::EmailEvent

Certify:

provider message correlation
deduplication by provider event id
delivery
bounce
complaint
timestamp ordering
idempotency
signature verification

Event:

SES
->
SNS
->
webhook
->
EmailEvent
->
EmailMessage
->
CampaignRecipient
->
Campaign counters

must work E2E.

================================================== 16. P0 — OPEN & CLICK TRACKING
==================================================

Audit:

app/controllers/t/email_tracking_controller.rb
Sales::EmailLink
Sales::EmailEvent

Certify:

unique tracking tokens
open pixel
redirect tracking
unique open
total opens
unique click
total clicks

Tracking failures must never break the destination link.

================================================== 17. P0 — UNSUBSCRIBE / SUPPRESSION / LGPD
==================================================

Audit:

Sales::EmailSuppression
Sales::Messaging::SuppressionChecker

Every campaign launch MUST pass suppression before send.

An unsubscribed address must never re-enter a campaign because of:

retry
resume
re-snapshot
new audience filter

Provide user-visible unsubscribe mechanics for marketing/outbound where required.

Persist:

reason
source
occurred_at
company scope

Respect existing privacy/LGPD architecture.

================================================== 18. P1 — SCHEDULING
==================================================

Campaigns support scheduled status.

Certify:

scheduled_at
timezone
scheduler
due campaign query
job
lock
preflight at execution time
snapshot policy

User flow:

Schedule
->
scheduled
->
due
->
preflight
->
snapshot
->
dispatch

A campaign must never silently remain scheduled forever.

================================================== 19. P1 — PAUSE / RESUME / RETRY
==================================================

Certify:

pause prevents new batches
already executing single delivery may finish
resume only sends pending recipients
retry_failed only retries failed recipients
cancel prevents future sends

Do not duplicate already sent recipients.

================================================== 20. P1 — METRICS
==================================================

Current Campaign model has counters.

Audit:

MetricsCalculator
CampaignDailyMetric
Campaign#update_progress_counters!

Ensure counters are mathematically correct.

Required:

audience
eligible
queued
sent
delivered
opened
unique opens
clicked
unique clicks
replied if supported
bounce
complaint
unsubscribe
failed

Rates:

delivery_rate
open_rate
CTR
CTOR
bounce_rate
complaint_rate
unsubscribe_rate
conversion_rate

Avoid full recipient scans on every page request at scale.

================================================== 21. P1 — ATTRIBUTION
==================================================

Integrate:

Campaign
->
Recipient
->
Contact
->
Opportunity
->
Won Revenue

Track at minimum:

influenced opportunities
conversions
pipeline value
won revenue

Do not invent attribution where correlation does not exist.

Document the attribution model.

================================================== 22. P1 — EMAIL TEMPLATE VARIABLES
==================================================

Support controlled canonical merge variables.

Examples where real data exists:

{{first_name}}
{{last_name}}
{{company_name}}
{{owner_name}}
{{email}}

Fail closed for unknown mandatory variables.

Add preview using a real/sample-safe context.

Never silently send literal broken variables such as:

Olá {{first_name}}

================================================== 23. SECURITY / TENANT ISOLATION
==================================================

Every endpoint and query must be tenant scoped.

Test IDOR for:

Campaign
Template
Recipient
Contact
Account
Opportunity
Analytics

A company user cannot:

read
update
dispatch
delete
attach

another company's campaign or template.

Admins follow existing project authorization model.

Do not invent bypasses.

================================================== 24. PERFORMANCE
==================================================

Audit all Campaign list/detail queries for N+1.

Use:

includes
preload
select
counter caches / rollups where appropriate
database indexes
pagination
batching

Inspect query plans for:

campaign lists
recipient lists
audience resolution
metrics
event correlation

Required indexes should reflect actual query shapes.

Do not add speculative indexes without checking schema/query usage.

================================================== 25. OBSERVABILITY
==================================================

Add structured events for:

campaign_created
campaign_preflight_failed
campaign_snapshot_started
campaign_snapshot_completed
campaign_dispatch_started
campaign_batch_enqueued
campaign_batch_completed
campaign_recipient_sent
campaign_recipient_failed
campaign_completed
campaign_paused
campaign_resumed
campaign_cancelled

Include:

campaign_id
company_id
request_id
job_id
batch_id
duration
status
error_code

Do not include secrets or full message contents.

================================================== 26. FRONTEND STATE MODEL
==================================================

Campaign UI should understand:

loading
empty
draft
incomplete
ready
scheduled
dispatching
paused
completed
failed/cancelled as appropriate

Never display:

"success"

when:

preflight.ready == false

Render blockers directly.

Examples:

MISSING_TEMPLATE
"Selecione um template de e-mail."

EMPTY_AUDIENCE
"Nenhum contato elegível foi encontrado."

UNVERIFIED_SENDER
"O remetente precisa ser verificado."

================================================== 27. TEMPLATE BOOTSTRAP / EMPTY DATABASE
==================================================

Production currently has:

Sales::EmailTemplate.count = 0

Do NOT mask this by adding hard-coded fake frontend templates.

Instead:

make template CRUD fully usable

AND

if appropriate to product requirements,
create a documented idempotent seed/bootstrap mechanism for default templates.

A production deploy must never unexpectedly overwrite user templates.

Seed must be:

tenant-safe
idempotent
explicit
reviewable

If default templates are inappropriate,
leave database empty and provide excellent creation UX.

================================================== 28. TEST MATRIX
==================================================

Create/complete automated tests for:

Template model
Template request/API
Template tenant isolation
Campaign model
Campaign create
Campaign update
Campaign preflight success
Campaign MISSING_TEMPLATE
Campaign EMPTY_AUDIENCE
Campaign invalid sender
AudienceResolver
SnapshotService
Snapshot dedupe
Snapshot suppression
Dispatcher
Dispatcher lock
Dispatcher duplicate launch
Dispatcher pause
Dispatcher resume
Dispatcher cancel
Dispatcher retry_failed
CampaignBatchProcessorJob
SendEmailJob
SES provider abstraction
SES failure
SNS delivery
SNS bounce
SNS complaint
Open tracking
Click tracking
Unsubscribe
Metrics
Attribution
RBAC
IDOR
pagination
N+1 where tooling permits

Frontend:

Campaign empty state
Template empty state
Template creation
Campaign wizard
Audience preview
Preflight blockers
Launch disabled
Launch success
Launch failure
Scheduled state
Dispatching state
Completed state

E2E:

Create template
->
Create campaign
->
Select audience
->
Select template
->
Preflight ready
->
Launch
->
Snapshot
->
CampaignRecipient
->
Sidekiq
->
Provider adapter
->
sent

For provider E2E in CI use the project's approved adapter/test boundary.
Never send real production email from automated CI.

================================================== 29. PRODUCTION SMOKE TEST
==================================================

After deploy, create a controlled test campaign.

Use explicitly authorized internal/test addresses only.

Expected:

Campaign = draft

Audience estimate > 0

Template assigned

Preflight:
ready=true
blockers=[]

Launch

Campaign:
status=dispatching

Recipients:
pending -> queued/sending -> sent

Worker logs:
CampaignBatchProcessorJob

Worker logs:
SendEmailJob

EmailMessage:
provider_message_id present

SES:
accepted

Then confirm incoming event:

delivery

Then controlled:

open
click

Confirm:

CampaignRecipient
EmailMessage
EmailEvent
Campaign counters

Finally campaign:
completed

================================================== 30. PRODUCTION DOCTOR COMMAND
==================================================

Create a non-destructive diagnostic command such as:

bin/rails sales:campaigns:doctor

or extend existing email doctor.

Output:

Database
Campaign tables
Template count
Recipient table
Redis connectivity
Sidekiq connectivity
Campaign queues
Retries
Dead jobs
SES configured
Sender verification where accessible
SNS webhook configuration state where inspectable
Suppression count
Recent campaign failures

Do not print credentials.

Exit non-zero for real blocking failures.

================================================== 31. DEFINITION OF DONE
==================================================

The feature is NOT done because:

the page renders
the endpoint returns 200
the model exists
SES credentials exist

DONE means:

A normal CRM user can create a template.

A normal CRM user can create a campaign.

A normal CRM user can select real Sales::Contact audience.

The UI previews eligible recipients.

The UI identifies excluded recipients.

A template can be selected.

A sender can be selected/resolved.

Preflight blockers are visible before launch.

Launch is disabled while blockers exist.

When ready, Launch creates recipient snapshot automatically.

Recipients are deduplicated and suppression-safe.

Dispatcher changes state correctly.

CampaignBatchProcessorJob reaches Sidekiq.

Worker consumes the job.

SendEmailJob sends through the canonical messaging provider.

AWS SES accepts the email.

provider_message_id is persisted.

SES/SNS events correlate back to EmailMessage and CampaignRecipient.

Delivery updates metrics.

Open updates metrics.

Click updates metrics.

Bounce updates suppression/state.

Complaint updates suppression/state.

Unsubscribe prevents future sends.

Pause works.

Resume works.

Retry Failed works without duplicates.

Scheduling works.

Campaign completes correctly.

Dashboard uses real data.

No campaign data is mocked.

No fake templates are presented as database data.

Tenant isolation passes.

Critical queries do not introduce N+1.

Tests pass.

Frontend typecheck passes.

Backend specs pass.

Build passes.

Deploy passes.

Production controlled smoke test passes.

================================================== 32. REQUIRED FINAL REPORT
==================================================

At completion generate:

docs/03-campaign/CAMPAIGN_PRODUCTION_CERTIFICATION.md

Include:

baseline
root causes found
files changed
migrations
API contracts
state machine
queue topology
SES flow
SNS flow
tracking flow
security tests
performance findings
test results
production smoke results
remaining known limitations

Also provide a final matrix:

Requirement
Before
After
Evidence
Test
Status

================================================== 33. EXECUTION ORDER
==================================================

Execute in this exact risk-first sequence:

P0.1 Audit current HEAD
P0.2 Fix/complete Email Template CRUD
P0.3 Fix Campaign template selection
P0.4 Surface Preflight blockers
P0.5 Fix dispatch API/frontend failure semantics
P0.6 Certify AudienceResolver
P0.7 Certify SnapshotService
P0.8 Certify Dispatcher
P0.9 Certify CampaignBatchProcessorJob
P0.10 Certify SendEmailJob
P0.11 Certify SES provider
P0.12 Certify SNS events
P0.13 Certify tracking
P0.14 Certify suppression
P0.15 Controlled E2E test
P1.1 Scheduling
P1.2 Pause/resume/retry
P1.3 Metrics
P1.4 Attribution
P1.5 Performance
P1.6 Observability
P1.7 Production certification

Do not advance to the next stage while a P0 blocking test is failing.

================================================== 34. IMPORTANT IMPLEMENTATION CONSTRAINTS
==================================================

Do not create another Campaign model.

Do not create another Contact model.

Do not create another EmailMessage model.

Do not create another email provider layer unless the current abstraction is
provably insufficient.

Do not bypass Preflight.

Do not disable suppression to make tests pass.

Do not insert fake recipients.

Do not hard-code templates in the frontend.

Do not mark messages as sent before SES accepts them.

Do not swallow exceptions with rescue => {}.

Do not hide failed dispatch behind HTTP 200 success UX.

Do not use Redis as source of truth.

PostgreSQL remains source of truth.

Redis is coordination/cache/queue infrastructure.

All jobs must be idempotent.

All write paths must be tenant scoped.

All external-provider operations must be observable.

Preserve rollback capability.

================================================== 35. FIRST IMMEDIATE TASK
==================================================

Begin by proving the actual Email Template path.

Inspect:

AB0-1-back/app/models/sales/email_template.rb
AB0-1-back/app/controllers/api/v1/sales/email_templates_controller.rb
AB0-1-back/config/routes.rb
AB0-1-back/db/schema.rb
AB0-1-back/db/migrate/\*
AB0-1-front/app/dashboard/sales/settings/email/templates/page.tsx
AB0-1-front/lib/api/sales/client.ts
AB0-1-front/lib/api-campaigns.ts

Determine:

why production has zero templates,
whether CRUD is complete,
whether the campaign creation UI exposes template selection,
whether the API returns available tenant templates,
whether creating a template from CRM persists it correctly.

Then implement the smallest complete vertical slice:

Template Create
->
Template persisted
->
Campaign selects template
->
Preflight ready
->
Snapshot
->
Dispatch
->
CampaignBatchProcessorJob appears in Sidekiq

STOP and report evidence before proceeding to SES delivery certification.
