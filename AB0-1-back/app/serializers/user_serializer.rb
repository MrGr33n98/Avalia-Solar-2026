class UserSerializer < ActiveModel::Serializer
  attributes :id,
             :email,
             :role,
             :status,
             :company_id,
             :created_at,
             :approved_by_admin,
             :city,
             :state,
             :phone,
             :avatar_url

  attribute :name do
    object.display_name
  end

  attribute :company_name do
    object.company&.name
  end

  attribute :crm_access do
    defined?(Sales::AuthorizationService) ? Sales::AuthorizationService.sales_access?(user: object) : false
  end

  attribute :sales_capabilities do
    defined?(Sales::AuthorizationService) ? Sales::AuthorizationService.permissions_for(user: object) : []
  end

  def avatar_url
    object.avatar_url
  end
end
