class UserSerializer < ActiveModel::Serializer
  attributes :id,
             :email,
             :name,
             :role,
             :status,
             :company_id,
             :created_at,
             :approved_by_admin,
             :city,
             :state,
             :phone,
             :avatar_url

  attribute :company_name do
    object.company&.name
  end

  def avatar_url
    object.avatar_url
  end
end
