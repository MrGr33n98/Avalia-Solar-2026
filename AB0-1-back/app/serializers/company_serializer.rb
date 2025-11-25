class CompanySerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :name, :description, :website,
             :state, :city, :address, :phone, :whatsapp,
             :email_public, :featured, :verified,
             :rating_avg, :rating_count,
             :banner_url, :logo_url,
             :created_at, :updated_at,
             :founded_year, :employees_count,
             :instagram, :facebook, :linkedin,
             :cta_whatsapp_enabled, :cta_whatsapp_url,
             :whatsapp_enabled, :whatsapp_url




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

  private

  def generate_attachment_url(attachment)
    return nil unless attachment.attached?

    begin
      # Use rails_blob_url for Active Storage attachments with full URL
      Rails.application.routes.url_helpers.rails_blob_url(attachment, only_path: false)
    rescue StandardError => e
      Rails.logger.error("Error generating attachment URL for company #{object.id}: #{e.message}")
      nil
    end
  end
end
