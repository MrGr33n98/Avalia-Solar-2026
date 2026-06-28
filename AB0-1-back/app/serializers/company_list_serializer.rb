class CompanyListSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :name, :description, :website,
             :slug, :state, :city, :address, :phone, :whatsapp,
             :featured, :verified,
             :rating_avg, :rating_count,
             :banner_url, :logo_url, :verified_badge_image_url, :verified_badge_url,
             :cta_whatsapp_enabled, :cta_whatsapp_url,
             :whatsapp_enabled, :whatsapp_url,
             :active_admin, :p2p_chat_enabled,
             :social_proof_enabled, :can_use_social_proof,
             :effect, :media_upload_allowed,
             :response_time_sla, :delivered_projects_score, :warranty_years,
             :coverage_cities, :coverage_states
end
