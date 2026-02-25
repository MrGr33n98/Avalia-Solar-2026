ActiveAdmin.register Product do
  belongs_to :company, optional: true, finder: :find_by_slug_or_id!

  # Your existing permit_params
  permit_params :name, :description, :price, :image_url, :company_id, category_ids: []

  # Explicitly define filters to avoid the error
  filter :name
  filter :description
  filter :price
  filter :company
  filter :created_at
  # Remove the automatic categories filter that's causing the error
  remove_filter :categories

  controller do
    def scoped_collection
      scope = super.includes(:company)
      # If we're in a nested route, super already filtered by parent
      return scope if parent?

      if params[:company_id]
        company = Company.find_by_slug_or_id!(params[:company_id])
        scope.where(company_id: company.id)
      else
        scope
      end
    end

    def build_new_resource
      super.tap do |product|
        if parent?
          product.company = parent
        else
          company_param = params[:company_id] || params.dig(:product, :company_id)
          if company_param.present?
            company = Company.find_by_slug_or_id!(company_param)
            product.company_id ||= company.id
          end
        end
      end
    end
  end

  form do |f|
    f.object.company_id ||= params[:company_id] if params[:company_id]
    f.inputs do
      f.input :name
      f.input :description
      f.input :price
      f.input :image_url
      f.input :company, collection: Company.all

      # Add categories select2
      f.input :categories, as: :select, multiple: true, input_html: { class: 'select2-input' },
                           collection: Category.all.order(:name)
    end
    f.actions
  end

  # Rest of your ActiveAdmin configuration...
end
