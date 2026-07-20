class FinancialInstitutionSerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :short_name, :official_url,
             :active, :display_order, :featured, :logo_url,
             :created_at, :updated_at

  has_many :financing_options, serializer: FinancingOptionSerializer
  
  # Inclui os banners que pertencem à instituição, mas para não dar loading em todos
  # os campos talvez seja melhor um serializer específico de banner
  has_many :banners

  def financing_options
    object.financing_options.active_only.valid_now.ordered
  end

  def banners
    object.banners.currently_active.order(priority: :asc)
  end
end
