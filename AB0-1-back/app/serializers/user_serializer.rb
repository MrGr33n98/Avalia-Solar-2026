class UserSerializer < ActiveModel::Serializer
  attributes :id, :email, :name, :company_id, :created_at, :approved_by_admin, :city, :state, :phone, :avatar_url
  
  attribute :company_name do
    object.company&.name
  end

  def avatar_url
    return unless object.avatar.attached?
    
    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
    
    Rails.application.routes.url_helpers.rails_storage_proxy_url(object.avatar, options)
  rescue
    nil
  end
end
