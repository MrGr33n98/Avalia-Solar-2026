# frozen_string_literal: true

class SeedStrictAnalyticsEventRegistry < ActiveRecord::Migration[7.0]
  EVENTS = (%w[
    page_view search web_vital micro_interaction landing_viewed category_selected
    chat_session_started chat_message_sent chat_message_failed chat_message_feedback chat_lead_form_triggered
    chat_lead_submitted mobivolt_guided_qualification_started mobivolt_guided_qualification_opened
    mobivolt_company_card_viewed mobivolt_company_profile_clicked mobivolt_whatsapp_clicked
    mobivolt_quote_request_clicked mobivolt_lead_optin_started mobivolt_compare_clicked mobivolt_lead_optin_completed
    profile_view company_profile_viewed company_card_click company_card_impression company_cta_clicked
    company_cta_impression company_share_click company_back_click company_tab_change company_sticky_quote_click
    whatsapp_click cta_click contact_request lead_created lead_success lead_submit_internal lead_open_internal
    lead_click_direct lead_dispatched lead_dossier_viewed wizard_started wizard_contact_submitted otp_verified
    review_created review_submitted review_dashboard_view review_dashboard_refresh review_delete_confirm review_edit_click
    comparison_add comparison_remove comparison_modal_opened comparison_modal_quote_click comparison_quote_click
    comparison_category_toggle banner_view banner_click banner_hover premium_banner_viewed premium_banner_clicked
    premium_banner_dismissed premium_banner_expanded premium_banner_carousel_viewed pricing_page_viewed
    pricing_cta_clicked pricing_hero_cta_clicked checkout_started checkout_completed plan_upgraded churn_intent
    product_viewed product_click product_impression product_tab_changed related_product_clicked compatibility_chip_clicked
    regional_page_view regional_data_exposed scroll_depth_reached roi_expand quick_filter_click filter_applied
    search_performed search_no_results search_submitted search_results_loaded search_error search_sort_changed
    search_filter_applied search_filters_cleared search_suggestion_clicked search_cleared search_tab_changed
    search_category_clicked search_article_clicked signup_gate_opened signup_gate_primary_clicked signup_gate_secondary_clicked
    identity_bridge_modal_opened identity_bridge_modal_closed identity_bridge_conversion_click home_calculator_consultation_click
    home_hero_experiment_exposed ranking_click trust_score_viewed newsletter_submit blog_article_click blog_bounce
    blog_category_click blog_comments_view blog_conversion blog_cta_click blog_engaged blog_filter_change blog_lead_form_error
    blog_lead_form_submit blog_lead_form_success blog_newsletter_popup_dismiss blog_newsletter_popup_open blog_post_view
    blog_read_complete blog_scroll_depth blog_search blog_session_end blog_social_share blog_time_milestone blog_time_on_page
    dashboard_viewed user_returned faq_interaction location_selected company_created company_registered
    company_profile_completed login_completed registration_completed user_logged_in user_registered email_confirmed
    social_login_completed consent_given consent_revoked financing_proposal_submitted first_profile_view_received
    first_cta_click_received
  ] + [
    'Dashboard Tab Viewed',
    'Product Action',
    'Quick Action Clicked',
    'Quick Lead Created',
    'Quick Lead Opened',
    'Quick Lead Verified',
    'Report Exported',
    'Theme Changed'
  ]).freeze

  def up
    return unless table_exists?(:event_definitions)

    EVENTS.each do |event_type|
      execute <<~SQL.squish
        INSERT INTO event_definitions (event_type, required_keys, pii_keys, description, enabled, created_at, updated_at)
        VALUES (#{connection.quote(event_type)}, '[]', '[]', 'Strict analytics registry seed', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (event_type) DO NOTHING
      SQL
    end
  end

  def down
    # Registry records are intentionally preserved to avoid breaking analytics during rollback.
  end
end
