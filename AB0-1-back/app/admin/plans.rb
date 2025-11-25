ActiveAdmin.register Plan do
  permit_params :name, :description, :price, :features_json

  # Fix the filters section - remove any reference to 'features'
  filter :name
  filter :description
  filter :price
  filter :created_at
  filter :updated_at

  index do
    selectable_column
    id_column
    column :name
    column :description
    column :price
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :name
      f.input :description
      f.input :price
      f.input :features_json, as: :text, input_html: { rows: 6 }, hint: 'JSON de funcionalidades (ex: {"max_products": 20, "has_analytics": true})'
    end
    f.actions
  end
  controller do
    def update
      coerce_features_json
      super
    end
    def create
      coerce_features_json
      super
    end
    private
    def coerce_features_json
      raw = params[:plan][:features_json]
      if raw.is_a?(String) && raw.present?
        begin
          params[:plan][:features_json] = JSON.parse(raw)
        rescue JSON::ParserError
          params[:plan][:features_json] = {}
        end
      end
    end
  end
end
