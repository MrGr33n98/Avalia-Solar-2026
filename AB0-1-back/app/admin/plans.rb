ActiveAdmin.register Plan do
  menu label: 'Planos (Catálogo)', priority: 18

  permit_params do
    permitted = %i[name description price plan_tier_template stripe_product_id stripe_price_id_monthly
                   stripe_price_id_yearly is_public display_order]
    # Allow features_json keys explicitly
    permitted << { features_json: PlanFeatureCatalog.known_keys }
    # Allow dynamic feature fields hash
    permitted << { plan_feature_fields: {} }
    permitted
  end

  FEATURE_GROUP_LABELS = {
    'public_profile' => 'Perfil Público',
    'conversion' => 'Conversão',
    'trust' => 'Prova Social e Destaque',
    'content' => 'Conteúdo',
    'insights' => 'Inteligência e Dados',
    'marketplace_behavior' => 'Experiência Competitiva',
    'operations' => 'Serviços e Operações (Setup)'
  }.freeze

  FEATURE_GROUP_ORDER = %w[
    operations
    public_profile
    conversion
    trust
    content
    marketplace_behavior
    insights
  ].freeze

  FEATURE_GROUP_DESCRIPTIONS = {
    'public_profile' => 'Configurações de exibição do perfil da empresa para visitantes.',
    'conversion' => 'Recursos voltados para transformar visitantes em leads qualificados.',
    'trust' => 'Sinais de credibilidade, badges e avaliações que geram confiança.',
    'content' => 'Gestão de ativos de mídia, downloads e materiais ricos.',
    'marketplace_behavior' => 'Controla como a empresa interage com concorrentes no ecossistema.',
    'insights' => 'Recursos de analytics, integração e inteligência de mercado.',
    'operations' => 'Configuração de custos iniciais e suporte de onboarding.'
  }.freeze

  filter :name, label: 'Nome'
  filter :description, label: 'Descrição'
  filter :price, label: 'Preço Anual'
  filter :created_at, label: 'Criado em'
  filter :updated_at, label: 'Atualizado em'

  action_item :manage_subscriptions, only: :index do
    link_to 'Gestão de Assinaturas (SaaS)', admin_subscription_plans_path
  end

  index title: 'Catálogo de Planos' do
    selectable_column
    id_column
    column('Nome') do |plan|
      div class: 'aa-entity-stack' do
        div class: 'aa-entity-title' do
          plan.name
        end
        div class: 'aa-entity-subtitle' do
          truncate(plan.description.presence || 'Plano sem observações internas.', length: 90)
        end
      end
    end
    column('Categoria/Tier') do |plan|
      status_tag(plan.inferred_plan_tier.upcase, class: "aa-status-pill aa-tier-#{plan.inferred_plan_tier}")
    end
    column 'Preço', :price do |plan|
      div class: 'aa-metric-stack' do
        div(class: 'aa-metric-value') { number_to_currency(plan.price, unit: 'R$', separator: ',', delimiter: '.') } +
          div(class: 'aa-metric-caption') { 'cobrança anual' }
      end
    end
    column('Setup') do |plan|
      div class: 'aa-entity-stack' do
        div(class: 'aa-entity-title aa-entity-title--sm') { plan.setup_info.presence || 'Configuração padrão' } +
          div(class: 'aa-entity-subtitle') { plan.full_implementation_summary.presence || 'Sem taxa adicional.' }
      end
    end
    column('Recursos Ativos') do |plan|
      div class: 'aa-inline-stat' do
        span(class: 'aa-inline-stat__value') { plan.enabled_feature_keys.count } +
          span(class: 'aa-inline-stat__label') { 'recursos' }
      end
    end
    column 'Criado em', :created_at
    actions
  end

  show title: proc { |p| "Plano: #{p.name}" } do
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
      row('Nome do Plano') { resource.name }
      row('Descrição Interna') { resource.description }
      row('Preço Anual') { number_to_currency(resource.price, unit: 'R$', separator: ',', delimiter: '.') }
      row('Configuração de Setup') { resource.full_implementation_summary }
      row('Tier Inferido') { status_tag(resource.inferred_plan_tier) }
      row('Total de Recursos') { resource.enabled_feature_keys.count }
      row('Stripe Product ID') { resource.stripe_product_id.presence || 'Não configurado' }
      row('Stripe Price ID Principal') { resource.stripe_price_id_monthly.presence || 'Não configurado' }
      row('Stripe Price ID Anual Alternativo') { resource.stripe_price_id_yearly.presence || 'Não configurado' }
      row('Exibir no /pricing') { resource.is_public ? '✅ Sim' : '❌ Não' }
      row('Ordem de exibição') { resource.display_order }
      row('Data de Criação') { resource.created_at }
      row('Última Atualização') { resource.updated_at }
    end

    panel "Origem dos preços" do
      attributes_table do
        row("Catálogo anual") { number_to_currency(resource.price, unit: "R$ ", separator: ",", delimiter: ".") }
        row("Stripe mensal") { resource.stripe_price_id_monthly.presence || "Não configurado" }
        row("Stripe anual") { resource.stripe_price_id_yearly.presence || "Não configurado" }
        row("Fonte efetiva") { resource.stripe_price_id_monthly.present? ? "Stripe Price ID Principal" : "Catálogo local" }
      end
    end

    panel 'Visualização dos Recursos (Features)' do
      attributes_table_for resource do
        row('Lista de Ativos') do
          enabled = resource.enabled_feature_keys.map do |key|
            PlanFeatureCatalog.feature_definition(key)[:label] || key.to_s.humanize
          end
          enabled.any? ? enabled.join(', ') : 'Nenhum recurso habilitado'
        end
        row('Dados Técnicos (JSON)') do
          pre JSON.pretty_generate(resource.feature_flags)
        end
      end
    end

    feature_groups.each do |group_key, feature_keys|
      panel(FEATURE_GROUP_LABELS[group_key] || group_key.to_s.humanize) do
        if FEATURE_GROUP_DESCRIPTIONS[group_key].present?
          para(FEATURE_GROUP_DESCRIPTIONS[group_key],
               class: 'inline-hints')
        end
        table_for feature_keys do
          column('Funcionalidade') { |key| PlanFeatureCatalog.feature_definition(key)[:label] || key.to_s.humanize }
          column('Explicação') { |key| PlanFeatureCatalog.feature_definition(key)[:description] }
          column('Valor Atual') do |key|
            value = resource.feature_flags[key]
            if value.nil?
              status_tag('Não definido', class: 'warning')
            elsif value == true
              status_tag('Habilitado', class: 'ok')
            elsif value == false
              status_tag('Bloqueado', class: 'error')
            else
              value.inspect
            end
          end
        end
      end
    end

    active_admin_comments
  end

  form title: 'Editar Configuração de Plano' do |f|
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
      PlanFeatureCatalog.feature_definition(key)[:label] || key.to_s.humanize
    end

    render_feature_hint = lambda do |_key, definition, default_value|
      hints = []
      unless default_value.nil?
        hints << "Padrão do Tier: #{if default_value == true
                                      'Habilitado'
                                    else
                                      (default_value == false ? 'Bloqueado' : default_value.inspect)
                                    end}"
      end
      hints << "Tipo: #{definition[:type]}"
      hints << "Comportamento: #{definition[:access_behavior]}"
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

      view_helpers.content_tag(
        :li,
        class: definition[:type] == :integer ? 'input integer optional plan-feature-item' : 'boolean input optional plan-feature-item'
      ) do
        view_helpers.capture do
          view_helpers.concat(
            view_helpers.content_tag(:h4, render_feature_label.call(key), class: 'plan-feature-title')
          )
          view_helpers.concat(
            view_helpers.content_tag(:p, definition[:description], class: 'feature-description-text')
          )
          view_helpers.concat(
            view_helpers.content_tag(:p, "Status: #{state == 'enabled' ? 'ATIVO' : 'BLOQUEADO'}", class: 'inline-hints')
          )

          if definition[:type] == :integer
            view_helpers.concat(view_helpers.label_tag(input_id, 'Valor numérico', class: 'label'))
            view_helpers.concat(
              view_helpers.number_field_tag(
                input_name,
                current_value,
                id: input_id,
                min: 0,
                step: 1,
                placeholder: default_value || '0'
              )
            )
          else
            checked = ActiveModel::Type::Boolean.new.cast(current_value)
            view_helpers.concat(view_helpers.hidden_field_tag(input_name, '0', id: nil))
            view_helpers.concat(
              view_helpers.label_tag(input_id, class: 'label') do
                view_helpers.capture do
                  view_helpers.concat(view_helpers.check_box_tag(input_name, '1', checked, id: input_id))
                  view_helpers.concat(' Ativar recurso para este plano')
                end
              end
            )
          end

          view_helpers.concat(view_helpers.content_tag(:p, hint, class: 'inline-hints'))
        end
      end
    end

    render_feature_group = lambda do |feature_keys|
      view_helpers.content_tag(
        :ol,
        view_helpers.capture do
          feature_keys.each do |key|
            view_helpers.concat(render_feature_field.call(key))
          end
        end,
        class: 'plan-feature-list'
      )
    end

    f.inputs 'Informações Básicas do Plano' do
      f.input :name, label: 'Nome do Plano'
      f.input :description, label: 'Descrição Interna', hint: 'Apenas para uso administrativo.'
      f.input :price, label: 'Preço Anual (R$)', hint: 'Use 0 para planos gratuitos.'
      f.input :plan_tier_template,
              as: :select,
              label: 'Template de Referência',
              collection: PlanFeatureCatalog::PLAN_TIERS.map { |tier| [tier.humanize, tier] },
              include_blank: false,
              selected: selected_tier,
              hint: 'A troca do template redefine os valores padrão abaixo.'
      nil
    end

    f.inputs 'Integração Stripe (Faturamento)' do
      f.input :stripe_product_id, label: 'Stripe Product ID', hint: 'Ex: prod_XXXX'
      f.input :stripe_price_id_monthly, label: 'Stripe Price ID Principal',
                                        hint: 'Use o price_ anual que será usado no checkout.'
      f.input :stripe_price_id_yearly, label: 'Stripe Price ID Anual Alternativo',
                                       hint: 'Opcional; mantenha vazio se o principal já for anual.'
      f.input :is_public, as: :boolean, label: 'Exibir publicamente no site (/pricing)'
      f.input :display_order, label: 'Ordem de exibição', hint: 'Menor número aparece primeiro no carrossel.'
    end

    feature_groups.each do |group_key, feature_keys|
      f.inputs(FEATURE_GROUP_LABELS[group_key] || group_key.to_s.humanize) do
      para "Alteração afeta empresas que usam este Plan. Confirme impacto antes de salvar.", class: "inline-hints"
        view_helpers.safe_join(
          [
            if FEATURE_GROUP_DESCRIPTIONS[group_key].present?
              view_helpers.content_tag(:p, FEATURE_GROUP_DESCRIPTIONS[group_key], class: 'inline-hints')
            end,
            render_feature_group.call(feature_keys)
          ].compact
        )
      end
    end

    f.inputs 'Resumo da Configuração Resultante' do
      enabled = preview_flags.each_with_object([]) do |(key, value), memo|
        next unless PlanFeatureCatalog.access_state_for(key, value) == 'enabled'

        label = render_feature_label.call(key)
        memo << (value.is_a?(Integer) ? "#{label}: #{value}" : label)
      end

      view_helpers.safe_join(
        [
          view_helpers.content_tag(:p, "Tier de Referência: #{selected_tier.upcase}", class: 'inline-hints'),
          view_helpers.content_tag(
            :p,
            "Total de itens liberados: #{enabled.any? ? enabled.join(', ') : 'Nenhum'}",
            class: 'inline-hints'
          )
        ]
      )
    end

    f.actions
  end

  controller do
    def update
      super
    rescue StandardError => e
      render plain: "ERRO FATAL: #{e.class} - #{e.message}\n\nParams:\n#{params.inspect}\n\n#{e.backtrace.first(15).join("\n")}",
             status: 500
    end

    def create
      super
    rescue StandardError => e
      render plain: "ERRO FATAL: #{e.class} - #{e.message}\n\nParams:\n#{params.inspect}\n\n#{e.backtrace.first(15).join("\n")}",
             status: 500
    end
  end
end
