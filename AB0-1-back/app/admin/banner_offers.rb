ActiveAdmin.register BannerOffer do
  permit_params :name, :price_cents, :currency, :duration_days, :rules_json, :active

  index do
    selectable_column
    id_column
    column :name
    column :price_cents
    column :currency
    column :duration_days
    column :active
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :name
      f.input :price_cents
      f.input :currency
      f.input :duration_days
      f.input :rules_json, as: :text, input_html: { rows: 8 },
                           hint: 'JSON (ex: {"positions":["navbar"],"requires_moderation":true})'
      f.input :active
    end
    f.actions
  end

  controller do
    def create
      coerce_rules_json
      super
    end

    def update
      coerce_rules_json
      super
    end

    private

    def coerce_rules_json
      raw = params[:banner_offer][:rules_json]
      return unless raw.is_a?(String) && raw.present?

      params[:banner_offer][:rules_json] = begin
        JSON.parse(raw)
      rescue StandardError
        {}
      end
    end
  end
end
