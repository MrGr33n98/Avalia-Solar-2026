ActiveAdmin.register Plan do
  menu label: 'Planos (Catalogo)', priority: 18

  permit_params :name, :description, :price, :plan_tier_template, features_json: {}, plan_feature_fields: {}

  FEATURE_GROUP_LABELS = {
    'public_profile' => 'Perfil Publico',
    'conversion' => 'Conversao',
    'trust' => 'Prova Social e Destaque',
    'content' => 'Conteudo',
    'insights' => 'Inteligencia e Dados',
    'marketplace_behavior' => 'Experiencia Competitiva'
  }.freeze

  FEATURE_GROUP_ORDER = %w[
    public_profile
    conversion
    trust
    content
    marketplace_behavior
    insights
  ].freeze

  FEATURE_GROUP_DESCRIPTIONS = {
    'public_profile' => 'Controle os blocos publicos exibidos no perfil da empresa.',
    'conversion' => 'Defina recursos comerciais e pontos de conversao do perfil.',
    'trust' => 'Gerencie sinais de confianca, destaque e prova social.',
    'content' => 'Libere ou bloqueie biblioteca de materiais e midia.',
    'marketplace_behavior' => 'Ajuste comportamento competitivo no marketplace.',
    'insights' => 'Configure analytics, leads e recursos avancados.'
  }.freeze

  filter :name
  filter :description
  filter :price
  filter :created_at
  filter :updated_at

  action_item :manage_subscriptions, only: :index do
    link_to 'Ir para SAAS - Gestao de planos', admin_subscription_plans_path
  end

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
    grouped_features = PlanFeatureCatalog.known_keys.group_by do |key|
      PlanFeatureCatalog.feature_definition(key)[:group]
    end
    feature_groups =
      FEATURE_GROUP_ORDER.each_with_object({}) do |group_key, memo|
        next unless grouped_features[group_key].present?
        memo[group_key] = grouped_features[group_key]
      end.merge(grouped_features.except(*FEATURE_GROUP_ORDER))

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
        para(FEATURE_GROUP_DESCRIPTIONS[group_key], class: 'inline-hints') if FEATURE_GROUP_DESCRIPTIONS[group_key].present?
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
    view_helpers = f.template.helpers
    selected_tier = f.object.plan_tier_template.presence || f.object.inferred_plan_tier
    tier_defaults = PlanFeatureCatalog.defaults_for_tier(selected_tier)
    preview_flags =
      if f.object.persisted?
        f.object.feature_flags
      else
        tier_defaults
      end
    grouped_features = PlanFeatureCatalog.known_keys.group_by do |key|
      PlanFeatureCatalog.feature_definition(key)[:group]
    end
    feature_groups =
      FEATURE_GROUP_ORDER.each_with_object({}) do |group_key, memo|
        next unless grouped_features[group_key].present?
        memo[group_key] = grouped_features[group_key]
      end.merge(grouped_features.except(*FEATURE_GROUP_ORDER))

    render_feature_label = lambda do |key|
      key.to_s.humanize
    end

    render_feature_hint = lambda do |key, definition, default_value|
      hints = []
      hints << "Default do tier: #{default_value.inspect}" unless default_value.nil?
      hints << "Tipo: #{definition[:type]}"
      hints << "Acesso: #{definition[:access_behavior]}"
      aliases = Array(definition[:aliases]).map(&:to_s)
      hints << "Aliases legados: #{aliases.join(', ')}" if aliases.any?
      hints.join(' | ')
    end

    render_feature_field = lambda do |key|
      definition = PlanFeatureCatalog.feature_definition(key)
      input_name = "plan[plan_feature_fields][#{key}]"
      input_id = "plan_plan_feature_fields_#{key}"
      current_value = preview_flags[key]
      default_value = tier_defaults[key]
      state = PlanFeatureCatalog.access_state_for(key, current_value)
      hint = render_feature_hint.call(key, definition, default_value)

      if definition[:type] == :integer
        view_helpers.content_tag(:li, class: 'input integer optional plan-feature-item') do
          view_helpers.safe_join(
            [
              view_helpers.content_tag(:h4, render_feature_label.call(key), class: 'plan-feature-title'),
              view_helpers.content_tag(:p, "Estado atual: #{state}", class: 'inline-hints'),
              view_helpers.label_tag(input_id, 'Valor', class: 'label'),
              view_helpers.number_field_tag(
                input_name,
                current_value,
                id: input_id,
                min: 1,
                step: 1,
                placeholder: default_value || 'Nao definido'
              ),
              view_helpers.content_tag(:p, hint, class: 'inline-hints')
            ]
          )
        end
      else
        checked = ActiveModel::Type::Boolean.new.cast(current_value)
        view_helpers.content_tag(:li, class: 'boolean input optional plan-feature-item') do
          view_helpers.safe_join(
            [
              view_helpers.content_tag(:h4, render_feature_label.call(key), class: 'plan-feature-title'),
              view_helpers.content_tag(:p, "Estado atual: #{state}", class: 'inline-hints'),
              view_helpers.hidden_field_tag(input_name, '0', id: nil),
              view_helpers.label_tag(input_id, class: 'label') do
                view_helpers.safe_join(
                  [
                    view_helpers.check_box_tag(input_name, '1', checked, id: input_id),
                    ' Habilitar'
                  ]
                )
              end,
              view_helpers.content_tag(:p, hint, class: 'inline-hints')
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
      nil
    end

    feature_groups.each do |group_key, feature_keys|
      f.inputs(FEATURE_GROUP_LABELS[group_key] || group_key.to_s.humanize) do
        if FEATURE_GROUP_DESCRIPTIONS[group_key].present?
          f.template.concat(
            view_helpers.content_tag(:p, FEATURE_GROUP_DESCRIPTIONS[group_key], class: 'inline-hints')
          )
        end

        feature_keys.each do |key|
          f.template.concat(render_feature_field.call(key))
        end
        nil
      end
    end

    f.inputs 'Preview do plano resultante' do
      f.template.concat(
        view_helpers.content_tag(:p, "Tier considerado: #{selected_tier}", class: 'inline-hints')
      )
      enabled = preview_flags.each_with_object([]) do |(key, value), memo|
        next unless PlanFeatureCatalog.access_state_for(key, value) == 'enabled'

        label = render_feature_label.call(key)
        memo << (value.is_a?(Integer) ? "#{label}: #{value}" : label)
      end
      f.template.concat(
        view_helpers.content_tag(
          :p,
          "Features habilitadas: #{enabled.any? ? enabled.join(', ') : 'Nenhuma'}",
          class: 'inline-hints'
        )
      )
      f.template.concat(
        view_helpers.content_tag(:details) do
          view_helpers.safe_join(
            [
              view_helpers.content_tag(:summary, 'Ver JSON do payload canonico'),
              view_helpers.content_tag(:pre, JSON.pretty_generate(preview_flags))
            ]
          )
        end
      )
      nil
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
