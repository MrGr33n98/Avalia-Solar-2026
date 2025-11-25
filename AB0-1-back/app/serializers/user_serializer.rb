class UserSerializer < ActiveModel::Serializer
  attributes :id, :email, :name, :company_id, :created_at, :approved_by_admin
  
  # Adicionar informações da empresa se existir
  attribute :company_name do
    object.company&.name
  end
end
