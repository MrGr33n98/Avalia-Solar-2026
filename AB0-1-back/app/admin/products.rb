ActiveAdmin.register Product do
  belongs_to :company, optional: true

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
      params[:company_id] ? scope.where(company_id: params[:company_id]) : scope
    end

    def build_new_resource
      super.tap do |product|
        company_param = params[:company_id] || params.dig(:product, :company_id)
        product.company_id ||= company_param if company_param.present?
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

      # Add categories checkbox
      f.input :categories, as: :check_boxes
    end
    f.actions
  end

  # Rest of your ActiveAdmin configuration...
end
