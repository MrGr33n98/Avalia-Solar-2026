# GTM Tag Matrix

## Scope
This matrix describes the recommended Google Tag Manager setup for the current analytics runtime.

## Current Operating Mode
- `GTM` is loaded in [layout.tsx](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/layout.tsx).
- `GA4 direct` is also loaded in [layout.tsx](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/layout.tsx).
- `Consent Mode` is initialized in [GoogleTagManager.tsx](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/components/GoogleTagManager.tsx).
- Event forwarding happens in [index.ts](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/lib/analytics/index.ts).

## Hard Rules
1. Do not create GA4 Configuration or GA4 Event tags in GTM while `NEXT_PUBLIC_GA_MEASUREMENT_ID` remains active in the app.
2. Use GTM now for media tags, remarketing, and pixel orchestration.
3. Use GTM built-in `Page View` triggers for pageview-based tags. The app does not push `page_view` into `dataLayer`.
4. Use `event` plus `original_event` filters for custom event triggers. Do not key only on `event`.
5. Ignore legacy alias events for GA4. Only use them for media pixels when there is no clean canonical alternative.

## Variables
| ID | GTM Type | Key | Use Now | Notes |
| --- | --- | --- | --- | --- |
| `VAR-001` | Built-in | `Page URL` | yes | use for all pageview tags |
| `VAR-002` | Built-in | `Page Path` | yes | use for company profile page filters |
| `VAR-003` | Built-in | `Referrer` | yes | optional attribution context |
| `VAR-004` | Data Layer Variable | `original_event` | yes | required for filtered custom event triggers |
| `VAR-005` | Data Layer Variable | `event_id` | yes | debugging and dedupe analysis |
| `VAR-006` | Data Layer Variable | `session_id` | yes | analytics session context |
| `VAR-007` | Data Layer Variable | `company_id` | yes | company-scoped conversion tags |
| `VAR-008` | Data Layer Variable | `company_name` | yes | optional pixel payload |
| `VAR-009` | Data Layer Variable | `category_id` | yes | category-scoped payloads |
| `VAR-010` | Data Layer Variable | `search_term` | yes | search telemetry tags |
| `VAR-011` | Data Layer Variable | `results_count` | yes | search result quality |
| `VAR-012` | Data Layer Variable | `cta_type` | yes | CTA detail where available |
| `VAR-013` | Data Layer Variable | `cta_location` | yes | CTA detail where available |
| `VAR-014` | Data Layer Variable | `item_id` | yes | mapped GA-style item id |
| `VAR-015` | Data Layer Variable | `item_name` | yes | mapped GA-style item name |
| `VAR-016` | Data Layer Variable | `item_category` | yes | mapped GA-style item category |
| `VAR-017` | Data Layer Variable | `metric_name` | optional | web vitals or perf tags |
| `VAR-018` | Data Layer Variable | `metric_value` | optional | web vitals or perf tags |
| `VAR-019` | Data Layer Variable | `gtm_timestamp` | yes | debugging only |

## Triggers
| ID | Trigger | Type | Event / Condition | Use Now | Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `TRG-001` | `pv_all_pages` | Page View | All Pages | yes | high | base trigger for pageview media tags |
| `TRG-002` | `pv_company_profile_pages` | Page View | Some Page Views: `Page Path contains /companies/` | yes | medium | safe for page-scoped remarketing |
| `TRG-003` | `ce_search` | Custom Event | `event = search` and `original_event matches search_performance|search_submitted|search_no_results` | yes | high | clean enough for media audiences |
| `TRG-004` | `ce_company_card_click` | Custom Event | `event = select_item` and `original_event = company_card_click` | yes | high | canonical search/list click signal |
| `TRG-005` | `ce_whatsapp_contact` | Custom Event | `event = contact` and `original_event = whatsapp_click` | yes | high | preferred WhatsApp conversion trigger |
| `TRG-006` | `ce_quote_request_legacy` | Custom Event | `event = quote_request_cta_clicked` | optional | medium | legacy helper, use only for micro-conversion |
| `TRG-007` | `ce_wizard_started` | Custom Event | `event = begin_checkout` and `original_event = wizard_started` | yes | high | clean funnel start |
| `TRG-008` | `ce_wizard_progress` | Custom Event | `event = checkout_progress` and `original_event = wizard_step_completed` | optional | high | step progression only |
| `TRG-009` | `ce_wizard_success` | Custom Event | `event = wizard_success` | yes | high | current best GTM lead success trigger |
| `TRG-010` | `ce_web_vital` | Custom Event | `event = web_vital` | optional | high | observability only |
| `TRG-011` | `ce_profile_view_legacy` | Custom Event | `event = company_profile_viewed` | optional | medium | usable for pixels, never for GA4 while app GA is direct |
| `TRG-012` | `ce_cta_generic_legacy` | Custom Event | `event = cta_clicked` | no | low | generic alias, too noisy |
| `TRG-013` | `ce_whatsapp_legacy_alias` | Custom Event | `event = whatsapp_cta_clicked` | no | low | ignore, prefer `TRG-005` |
| `TRG-014` | `ce_lead_created_canonical` | Custom Event | `event = lead_created` | future | low | not a reliable frontend GTM signal today |
| `TRG-015` | `ce_review_created_canonical` | Custom Event | `event = review_created` | future | low | backend-centric, not GTM-ready today |

## Tags
| ID | Tag Name | GTM Type | Trigger | Use Now | Confidence | Consent | Destination | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TAG-001` | `conversion_linker_all_pages` | Conversion Linker | `TRG-001` | yes | high | `ad_storage` | Google Ads | always-on base tag when paid media is active |
| `TAG-002` | `google_ads_remarketing_all_pages` | Google Ads Remarketing | `TRG-001` | optional | high | `ad_storage`, `ad_user_data` | Google Ads | safe pageview audience tag |
| `TAG-003` | `google_ads_remarketing_company_profiles` | Google Ads Remarketing | `TRG-002` | optional | medium | `ad_storage`, `ad_user_data` | Google Ads | company profile audience |
| `TAG-004` | `google_ads_conversion_whatsapp_click` | Google Ads Conversion | `TRG-005` | optional | high | `ad_storage`, `ad_user_data` | Google Ads | strongest contact-intent click |
| `TAG-005` | `google_ads_conversion_quote_click_legacy` | Google Ads Conversion | `TRG-006` | optional | medium | `ad_storage`, `ad_user_data` | Google Ads | use only if quote-click is a tracked micro-conversion |
| `TAG-006` | `google_ads_conversion_verified_lead` | Google Ads Conversion | `TRG-009` | yes | high | `ad_storage`, `ad_user_data` | Google Ads | current best GTM lead conversion |
| `TAG-007` | `meta_pixel_pageview` | Meta Pixel | `TRG-001` | optional | high | `ad_storage`, `ad_user_data`, `ad_personalization` | Meta | base pageview pixel |
| `TAG-008` | `meta_pixel_viewcontent_company_profile` | Meta Pixel | `TRG-011` | optional | medium | `ad_storage`, `ad_user_data`, `ad_personalization` | Meta | use legacy company profile event until canonical cleanup lands |
| `TAG-009` | `meta_pixel_contact_whatsapp` | Meta Pixel | `TRG-005` | optional | high | `ad_storage`, `ad_user_data`, `ad_personalization` | Meta | preferred contact event |
| `TAG-010` | `meta_pixel_initiatecheckout_wizard_start` | Meta Pixel | `TRG-007` | optional | high | `ad_storage`, `ad_user_data`, `ad_personalization` | Meta | maps lead wizard start |
| `TAG-011` | `meta_pixel_lead_wizard_success` | Meta Pixel | `TRG-009` | yes | high | `ad_storage`, `ad_user_data`, `ad_personalization` | Meta | current best Meta lead conversion |
| `TAG-012` | `ga4_config_do_not_enable_in_gtm` | GA4 Configuration | `TRG-001` | no | high | `analytics_storage` | GA4 | duplicate risk because GA4 already runs directly in app |
| `TAG-013` | `ga4_event_page_view_do_not_enable_in_gtm` | GA4 Event | `TRG-001` | no | high | `analytics_storage` | GA4 | duplicate risk with direct `gtagPageView` |
| `TAG-014` | `ga4_event_search_do_not_enable_in_gtm` | GA4 Event | `TRG-003` | no | high | `analytics_storage` | GA4 | duplicate risk with direct app event |
| `TAG-015` | `ga4_event_company_card_click_do_not_enable_in_gtm` | GA4 Event | `TRG-004` | no | high | `analytics_storage` | GA4 | duplicate risk with direct app event |
| `TAG-016` | `ga4_event_whatsapp_contact_do_not_enable_in_gtm` | GA4 Event | `TRG-005` | no | high | `analytics_storage` | GA4 | duplicate risk with direct app event |
| `TAG-017` | `ga4_event_quote_click_do_not_enable_in_gtm` | GA4 Event | `TRG-006` | no | medium | `analytics_storage` | GA4 | duplicate plus legacy alias risk |
| `TAG-018` | `ga4_event_wizard_start_do_not_enable_in_gtm` | GA4 Event | `TRG-007` | no | high | `analytics_storage` | GA4 | duplicate risk with direct app event |
| `TAG-019` | `ga4_event_wizard_success_do_not_enable_in_gtm` | GA4 Event | `TRG-009` | no | high | `analytics_storage` | GA4 | duplicate risk with direct app event |
| `TAG-020` | `preview_event_logger` | Custom HTML | `TRG-003`, `TRG-004`, `TRG-005`, `TRG-006`, `TRG-007`, `TRG-009`, `TRG-011` | preview only | high | none | GTM Preview | debug helper only, never publish to production |

## Recommended Publish Order
1. `TAG-001`
2. `TAG-002` and/or `TAG-007` if paid media is active
3. `TAG-004`, `TAG-006`, `TAG-009`, `TAG-011`
4. `TAG-003`, `TAG-005`, `TAG-008`, `TAG-010` only if marketing wants those secondary signals

## Explicit Do Not Publish List
- Any GA4 tag in GTM while the app still renders `GoogleAnalytics`.
- Any trigger based only on `cta_clicked`.
- Any trigger based on `whatsapp_cta_clicked`.
- Any production tag that ignores consent checks.

## Cleanup Needed Before GTM Can Own GA4
1. Remove direct GA4 ownership from [GoogleTagManager.tsx](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/components/GoogleTagManager.tsx).
2. Replace legacy helper emissions in [track-cta.ts](/c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/lib/analytics/track-cta.ts).
3. Emit canonical `profile_view`, `cta_click`, `lead_created`, and `review_created` into `dataLayer`.
4. Re-test WhatsApp to ensure only one clean GTM event remains.
