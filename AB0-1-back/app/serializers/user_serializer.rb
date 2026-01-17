class UserSerializer < ActiveModel::Serializer
  attributes :id, :email, :name, :company_id, :created_at, :approved_by_admin, :city, :state, :phone, :avatar_url
  
  attribute :company_name do
    object.company&.name
  end

  def avatar_url
    return unless object.avatar.attached?
    
    Rails.application.routes.url_helpers.rails_blob_url(
      object.avatar, 
      host: Rails.application.config.action_controller.default_url_options[:host] || 'localhost:3000'
    )
  rescue
    nil
  end
end
