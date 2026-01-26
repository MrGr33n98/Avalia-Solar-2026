class CompanySerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :name, :description, :website,
             :slug,
             :state, :city, :address, :phone, :whatsapp,
             :email_public, :featured, :verified,
             :media_upload_allowed,
             :rating_avg, :rating_count,
             :banner_url, :logo_url,
             :created_at, :updated_at,
             :founded_year, :employees_count,
             :instagram, :facebook, :linkedin,
             :cta_whatsapp_enabled, :cta_whatsapp_url,
             :whatsapp_enabled, :whatsapp_url,
             :effect, :media_upload_allowed,
             :faqs,
             :financing_enabled,
             :financing_feature_allowed,
             :financing_tab_visible,
             :financing_profile,
             :financing_partners,
             :financing_offers




  def banner_url
    generate_attachment_url(object.banner)
  end

  def logo_url
    generate_attachment_url(object.logo)
  end

  def cta_whatsapp_enabled
    object.respond_to?(:whatsapp_enabled) ? !!object.whatsapp_enabled : false
  end

  def cta_whatsapp_url
    object.respond_to?(:whatsapp_url) ? object.whatsapp_url : nil
  end

  def effect
    object.respond_to?(:effect) ? !!object.effect : false
  end

  def faqs
    object.company_faqs.published_only.ordered.map do |faq|
      faq.as_json(only: %i[id question answer status position])
    end
  end

  def financing_enabled
    object.respond_to?(:financing_enabled) ? !!object.financing_enabled : false
  end

  def media_upload_allowed
    if object.respond_to?(:media_upload_allowed?)
      object.media_upload_allowed?
    elsif object.respond_to?(:media_upload_allowed)
      !!object.media_upload_allowed
    else
      false
    end
  end

  def financing_feature_allowed
    object.respond_to?(:financing_feature_allowed?) ? !!object.financing_feature_allowed? : false
  end

  def financing_tab_visible
    financing_enabled && financing_feature_allowed
  end

  def financing_profile
    return unless financing_tab_visible
    profile = object.company_financing_profile
    return unless profile

    profile.as_json(
      only: %i[
        id title subtitle disclaimer cta_label cta_url currency status
        default_amount_cents min_amount_cents max_amount_cents
        default_down_payment_percent min_down_payment_percent max_down_payment_percent
        default_term_months min_term_months max_term_months
        default_interest_rate_monthly min_interest_rate_monthly max_interest_rate_monthly
        grace_months_enabled max_grace_months amortization_type show_bank_logos show_fee_inputs
      ]
    )
  end

  def financing_partners
    return [] unless financing_tab_visible

    object.company_financing_partners.active.ordered.map do |partner|
      partner.as_json(only: %i[id name partner_type website priority position active badge]).merge(
        logo_url: generate_attachment_url(partner.logo)
      )
    end
  end

  def financing_offers
    return [] unless financing_tab_visible

    object.company_financing_offers.active.ordered.map do |offer|
      offer.as_json(
        only: %i[
          id name offer_type term_months interest_rate_monthly
          min_down_payment_percent grace_months amortization_type
          notes active position
        ]
      )
    end
  end

  private

  def generate_attachment_url(attachment)
    return nil unless attachment.attached?

    begin
      # Use rails_blob_url for Active Storage attachments with full URL
      # Force host to localhost:3001 if not set correctly in config
      options = { only_path: false }
      options[:host] = 'localhost' if Rails.env.development?
      options[:port] = 3001 if Rails.env.development?
      
      Rails.application.routes.url_helpers.rails_blob_url(attachment, options)
    rescue StandardError => e
      Rails.logger.error("Error generating attachment URL for company #{object.id}: #{e.message}")
      nil
    end
  end
end
