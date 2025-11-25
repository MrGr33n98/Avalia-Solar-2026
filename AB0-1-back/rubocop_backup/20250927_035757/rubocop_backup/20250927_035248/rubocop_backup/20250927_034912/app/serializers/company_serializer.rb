class CompanySerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :name, :description, :website, :phone,
             :address, :created_at, :updated_at,
             :banner_url, :logo_url, :state, :city, :featured,
             :verified, :rating_avg, :rating_count, :working_hours,
             :payment_methods, :certifications

  attribute :ctas, if: -> { @instance_options[:include_ctas] }

  def banner_url
    generate_attachment_url(object.banner)
  end

  def logo_url
    generate_attachment_url(object.logo)
  end

  def ctas
    object.build_ctas
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
