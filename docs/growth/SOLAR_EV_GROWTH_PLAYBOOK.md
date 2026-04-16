# Solar + EV Growth Playbook

This playbook turns Avalia Solar into a demand engine for energy solar and mobilidade eletrica. The core idea is simple: trust is the product, local proof is the hook, and WhatsApp is the closing lane.

## Market thesis

The market buys when it sees three things at the same time:

- local proof
- clear savings
- low-friction next step

Solar and EV share the same buying psychology:

- high ticket
- long consideration
- fear of bad installers
- need for ROI or TCO proof
- strong local bias

That means the best growth hacks are not generic "post more content" ideas. They are trust loops, proof loops, and conversion loops.

## Channel priority

| Channel | Best use | What to post | CTA |
| --- | --- | --- | --- |
| LinkedIn | B2B, partners, fleets, condominiums, installers | trust, ranking, ROI, compliance, case studies | audit, demo, partner call |
| Instagram | Consumer education, proof, before/after, reels | savings, installation stories, myth busting | calculator, WhatsApp, compare |
| YouTube | Deep authority and search intent | explainers, cases, walkthroughs | landing page, quote, subscribe |
| WhatsApp | Closing, follow-up, reactivation | prefilled short message, offer, reminder | talk now |
| X | Sharp hooks, PR, contrarian takes | short takes, facts, local wins | click, share |
| Slack | Internal command center and campaign ops | brief, approval, draft distribution | approve, publish |

## 30 growth hacks that fit this market

### 1. Local trust and proof

- City trust scoreboard: publish the top trusted companies per city and update it monthly. This turns trust into a repeatable content series.
- Ranking by category: create one ranking for residential solar, one for commercial solar, and one for EV charging. The user self-selects the use case.
- Before/after bill story: show the energy bill before and after the project with a simple graphic. Savings are easier to sell when they are visual.
- Review harvest after installation: ask every happy client for a review within 24 to 72 hours after the system is live. Fresh proof converts better.
- Neighborhood map: show "installations near you" or "clients in your region" to make the buying decision feel local and safe.

### 2. Solar-specific loops

- Bill shock reel: record a 15 to 30 second video that starts with the current bill and ends with the projected solar savings.
- Financing simulator: let the prospect compare monthly financing against the current power bill. This moves the conversation from "price" to "monthly fit".
- Tariff alert content: when tariffs increase or the bill spikes, post an immediate education piece with the local angle.
- Roof viability checklist: offer a simple guide that helps the user know if their roof is ready before they talk to sales.
- ROI calculator landing page: one page, one promise, one CTA. The user should get a fast answer before they need to speak to anyone.

### 3. EV-specific loops

- Wallbox savings calculator: compare the cost per km of charging at home versus fueling a car. This is one of the strongest EV hooks.
- Condo charging playbook: create a guide for condo managers that explains approval, installation, and governance.
- Fleet TCO audit: position EV charging as a fleet cost reduction project, not just a technology project.
- Route charging map: show where the user can charge, how long it takes, and what it costs. Range anxiety drops when the map is clear.
- Solar + EV bundle story: show that the cheapest kilowatt is the one generated on the roof and consumed in the driveway.

### 4. B2B and ABM loops

- LinkedIn outreach by role: target CFOs, facility managers, sustainability officers, and condominium administrators with different messages.
- Industry one-pagers: create one sheet for retail, one for agro, one for logistics, one for condominiums, and one for industrial sites.
- RFP generator: let buyers generate a request for proposal in minutes. That reduces friction and captures intent early.
- ESG report helper: frame solar and EV as a measurable sustainability win with numbers that can be reused in reports.
- Partner co-marketing: co-author content with electricians, architects, roofing companies, financing partners, and equipment brands.

### 5. Conversion hacks

- Prefilled WhatsApp CTA: use a prewritten message so the user does not need to think about what to say.
- Compare 3 companies only: do not overwhelm the user with too many options. Three is enough for decision speed.
- Exit-intent lead magnet: offer a checklist, calculator, or comparison template right before the user leaves.
- Scarcity by capacity: if the team has limited install slots or limited audit slots, say so. Real scarcity improves response.
- Quote follow-up automation: if someone starts a wizard and stops, send a follow-up with the exact step they abandoned.

### 6. Viral and referral loops

- Double discount referral: give both sides a better deal when a client invites a neighbor, colleague, or building manager.
- Shareable PDF report: convert the audit result into a PDF that can be forwarded inside the family or company decision chain.
- WhatsApp status asset: build vertical images and short lines that users can post on WhatsApp Status.
- Savings leaderboard: let clients opt in to a public leaderboard of monthly savings or avoided fuel cost.
- Post-install share prompt: ask clients to share their system story once the project is visible and the payoff is emotional.

### 7. Content factory loops

- One article to ten assets: turn one deep article into a LinkedIn post, X post, Instagram caption, WhatsApp message, carousel, reel script, and newsletter snippet.
- FAQ to reel: each common objection becomes a short reel or short-form video.
- Review to carousel: one review becomes a carousel with the outcome, the city, and the savings.
- Webinar to shorts: one live webinar becomes multiple clips, quotes, and clips for remarketing.
- Seasonal content calendar: plan content around tariff changes, heat waves, travel season, and budget planning cycles.

## Seven hacks to launch today

1. Publish one city trust scoreboard.
2. Ship one bill shock reel.
3. Post one LinkedIn ABM piece for B2B buyers.
4. Create one WhatsApp status graphic.
5. Send one review harvest request to recent clients.
6. Build one solar + EV calculator landing page.
7. Turn one case study into a 5 asset content pack.

## Workflow that implements this today

The n8n workflow lives in `n8n-workflows/WF-017-growth-command-center-solar-ev.json`.

It does the following:

- receives a webhook brief or manually triggered payload
- parses the market, city, audience, goal, and channels
- generates drafts for LinkedIn, Instagram, X, and WhatsApp
- saves the campaign to Google Sheets
- sends the pack to Slack for review
- optionally publishes to LinkedIn and X when `publish: auto`

### Brief syntax for the webhook

Example for solar:

```text
vertical: solar
city: Florianopolis
audience: b2c
goal: lead_gen
channels: linkedin,instagram,x,whatsapp
publish: draft
```

Example for EV:

```text
vertical: ev
city: Florianopolis
audience: b2b
goal: lead_gen
channels: linkedin,x
publish: auto
```

### Required credentials

- Slack OAuth credential
- Google Sheets OAuth credential
- LinkedIn credential
- X/Twitter credential

### Google Sheet columns

Use a sheet with these columns:

- `campaign_id`
- `created_at`
- `vertical`
- `audience`
- `city`
- `goal`
- `publish_mode`
- `publish_linkedin`
- `publish_x`
- `landing_url`
- `linkedin_post`
- `x_post`
- `instagram_caption`
- `whatsapp_copy`

## Implementation order for today

1. Import the workflow JSON into n8n.
2. Connect Slack, Google Sheets, LinkedIn, and X credentials.
3. Create the Slack channel `#growth-marketing`.
4. Prepare the Google Sheet with the columns above.
5. Run the workflow in `draft` mode with one test brief.
6. Verify the drafts, then switch the first test to `publish: auto`.
7. Save the best-performing prompt format as the team standard.

## KPI scoreboard

Track these metrics every week:

- number of briefs processed
- draft approval rate
- LinkedIn CTR
- X engagement
- WhatsApp click rate
- lead form starts
- lead form completions
- city-level conversion rate

## The operating principle

Do not try to sell "solar" or "EV" as commodity infrastructure. Sell trust, speed, proof, and local relevance. When those four are visible, the market responds.
