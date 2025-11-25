class Category < ApplicationRecord
  has_one_attached :banner
  has_and_belongs_to_many :companies
  
  def banner_url
    if banner.attached?
      # Make sure to use the full URL with host for external access
      Rails.application.routes.url_helpers.rails_blob_url(
        banner, 
        host: Rails.application.config.action_mailer.default_url_options[:host]
      )
    end
  end
  
  def as_json(options = {})
    super(options.merge(
      methods: [:banner_url]
    ))
  end
end