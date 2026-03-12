ActiveAdmin.register Plan do
  permit_params :name, :description, :price, :plan_tier_template, features_json: {}, plan_feature_fields: {}

  FEATURE_GROUP_LABELS = {
    'public_profile' => 'Perfil Publico',
    'conversion' => 'Conversao',
    'trust' => 'Prova Social e Destaque',
    'content' => 'Conteudo',
    'insights' => 'Inteligencia e Dados',
    'marketplace_behavior' => 'Experiencia Competitiva'
  }.freeze

  filter :name
  filter :description
  filter :price
  filter :created_at
  filter :updated_at

  index do
    selectable_column
    id_column
    column :name
    column('Tier') { |plan| status_tag(plan.inferred_plan_tier) }
    column :description
    column :price
    column('Features ativas') { |plan| plan.enabled_feature_keys.count }
    column :created_at
    actions
  end

  show do
    feature_groups = PlanFeatureCatalog.known_keys.group_by do |key|
      PlanFeatureCatalog.feature_definition(key)[:group]
    end

    attributes_table do
      row :id
      row :name
      row :description
      row :price
      row('Tier inferido') { status_tag(resource.inferred_plan_tier) }
      row('Features ativas') { resource.enabled_feature_keys.count }
      row :created_at
      row :updated_at
    end

    panel 'Resumo do plano' do
      attributes_table_for resource do
        row('Features habilitadas') do
          enabled = resource.enabled_feature_keys.map { |key| key.to_s.humanize }
          enabled.any? ? enabled.join(', ') : 'Nenhuma'
        end
        row('Payload canonico') do
          pre JSON.pretty_generate(resource.feature_flags)
        end
      end
    end

    feature_groups.each do |group_key, feature_keys|
      panel(FEATURE_GROUP_LABELS[group_key] || group_key.to_s.humanize) do
        table_for feature_keys do
          column('Feature') { |key| key.to_s.humanize }
          column('Tipo') { |key| PlanFeatureCatalog.feature_definition(key)[:type] }
          column('Valor') do |key|
            value = resource.feature_flags[key]
            value.nil? ? status_tag('unset', class: 'warning') : value.inspect
          end
          column('Acesso') do |key|
            definition = PlanFeatureCatalog.feature_definition(key)
            definition[:access_behavior].to_s
          end
        end
      end
    end

    active_admin_comments
  end

  form do |f|
    selected_tier = f.object.plan_tier_template.presence || f.object.inferred_plan_tier
    tier_defaults = PlanFeatureCatalog.defaults_for_tier(selected_tier)
    preview_flags =
      if f.object.persisted?
        f.object.feature_flags
      else
        tier_defaults
      end
    feature_groups = PlanFeatureCatalog.known_keys.group_by do |key|
      PlanFeatureCatalog.feature_definition(key)[:group]
    end

    render_feature_field = lambda do |key|
      definition = PlanFeatureCatalog.feature_definition(key)
      input_name = "plan[plan_feature_fields][#{key}]"
      input_id = "plan_plan_feature_fields_#{key}"
      current_value = preview_flags[key]
      default_value = tier_defaults[key]
      hint_parts = []
      hint_parts << "Default do tier: #{default_value.inspect}" unless default_value.nil?
      hint_parts << "Comportamento: #{definition[:access_behavior]}"
      hint = hint_parts.join(' | ')

      if definition[:type] == :integer
        f.template.content_tag(:li, class: 'input integer optional') do
          f.template.safe_join(
            [
              f.template.label_tag(input_id, key.to_s.humanize, class: 'label'),
              f.template.number_field_tag(
                input_name,
                current_value,
                id: input_id,
                min: 1,
                step: 1
              ),
              f.template.content_tag(:p, hint, class: 'inline-hints')
            ]
          )
        end
      else
        checked = ActiveModel::Type::Boolean.new.cast(current_value)
        f.template.content_tag(:li, class: 'boolean input optional') do
          f.template.safe_join(
            [
              f.template.hidden_field_tag(input_name, '0', id: nil),
              f.template.label_tag(input_id, class: 'label') do
                f.template.safe_join(
                  [
                    f.template.check_box_tag(input_name, '1', checked, id: input_id),
                    ' ',
                    f.template.content_tag(:span, key.to_s.humanize)
                  ]
                )
              end,
              f.template.content_tag(:p, hint, class: 'inline-hints')
            ]
          )
        end
      end
    end

    f.inputs 'Plano' do
      f.input :name
      f.input :description
      f.input :price
      f.input :plan_tier_template,
              as: :select,
              label: 'Template inicial',
              collection: PlanFeatureCatalog::PLAN_TIERS.map { |tier| [tier.humanize, tier] },
              include_blank: false,
              selected: selected_tier,
              hint: 'Define o bundle inicial. Depois ajuste feature por feature.'
    end

    feature_groups.each do |group_key, feature_keys|
      f.inputs(FEATURE_GROUP_LABELS[group_key] || group_key.to_s.humanize) do
        feature_keys.each do |key|
          f.template.concat(render_feature_field.call(key))
        end
      end
    end

    panel 'Preview do plano resultante' do
      attributes_table_for f.object do
        row('Tier considerado') { status_tag(selected_tier) }
        row('Features habilitadas') do
          enabled = preview_flags.select { |_key, value| value == true }.keys.map(&:humanize)
          enabled.any? ? enabled.join(', ') : 'Nenhuma'
        end
        row('Payload canonico') do
          pre JSON.pretty_generate(preview_flags)
        end
      end
    end

    f.actions
  end

  controller do
    def update
      coerce_plan_console_params
      super
    end

    def create
      coerce_plan_console_params
      super
    end

    private

    def coerce_plan_console_params
      raw_params = params[:plan]
      return unless raw_params.present?

      tier = raw_params[:plan_tier_template]
      feature_fields = raw_params.delete(:plan_feature_fields)

      raw_features =
        if feature_fields.present?
          feature_fields.respond_to?(:to_unsafe_h) ? feature_fields.to_unsafe_h : feature_fields.to_h
        else
          raw_params[:features_json]
        end

      normalized = PlanFeatureCatalog.normalize(raw_features || {}, plan_tier: tier)
      raw_params[:features_json] = normalized
      raw_params[:features] = normalized.to_json if Plan.column_names.include?('features')
    rescue StandardError
      raw_params[:features_json] = {}
    end
  end
end
