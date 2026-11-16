ActiveAdmin.register Plan do
  menu label: 'Planos (Catálogo)', priority: 18

  permit_params do
    permitted = %i[name description price plan_tier_template change_reason stripe_product_id stripe_price_id_monthly
                   stripe_price_id_yearly is_public display_order]
    # Allow features_json keys explicitly
    # Feature changes go through the validated virtual form fields only.
    # Allow dynamic feature fields hash
    permitted << { plan_feature_fields: {} }
    permitted
  end

  FEATURE_GROUP_LABELS = {
    'public_profile' => 'Perfil Público',
    'brand_hero' => 'Carrossel institucional da Brand Page',
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
    brand_hero
    conversion
    trust
    content
    marketplace_behavior
    insights
  ].freeze

  FEATURE_GROUP_DESCRIPTIONS = {
    'public_profile' => 'Configurações de exibição do perfil da empresa para visitantes.',
    'brand_hero' => 'Controle comercial do carrossel institucional: habilitar e definir até três banners por empresa. Não são anúncios patrocinados.',
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
      group = PlanFeatureCatalog.feature_definition(key)[:group]
      group == 'analytics' ? 'insights' : group
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
      row('Stripe Price ID — 6 meses') { resource.stripe_price_id_monthly.presence || 'Não configurado' }
      row('Stripe Price ID — 12 meses') { resource.stripe_price_id_yearly.presence || 'Não configurado' }
      row('Exibir no /pricing') { resource.is_public ? '✅ Sim' : '❌ Não' }
      row('Ordem de exibição') { resource.display_order }
      row('Data de Criação') { resource.created_at }
      row('Última Atualização') { resource.updated_at }
    end

    panel "Origem dos preços" do
      attributes_table do
        row("Catálogo anual") { number_to_currency(resource.price, unit: "R$ ", separator: ",", delimiter: ".") }
        row("Stripe — 6 meses") { resource.stripe_price_id_monthly.presence || "Não configurado" }
        row("Stripe — 12 meses") { resource.stripe_price_id_yearly.presence || "Não configurado" }
        row("Fonte efetiva") { resource.stripe_price_id_monthly.present? ? "Stripe Prices configurados" : "Catálogo local" }
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

    panel 'Histórico de Alterações do Plano' do
      audits = resource.plan_configuration_audits.includes(:admin_user).order(created_at: :desc).limit(15)
      if audits.any?
        table_for audits do
          column('Data', &:created_at)
          column('Administrador') { |audit| audit.admin_user&.email || 'Conta removida' }
          column('Motivo') { |audit| audit.change_reason.presence || 'Não informado' }
          column('Antes') { |audit| pre JSON.pretty_generate(audit.before_state) }
          column('Depois') { |audit| pre JSON.pretty_generate(audit.after_state) }
        end
      else
        para 'Nenhuma alteração auditada até o momento.'
      end
    end

    active_admin_comments
  end

  form title: 'Editar Configuração de Plano' do |f|
    view_helpers = f.template.helpers
    selected_tier = f.object.plan_tier_template.presence || f.object.inferred_plan_tier
    tier_defaults = PlanFeatureCatalog.defaults_for_tier(selected_tier)
    preview_flags = PlanFeatureCatalog.normalize(
      f.object.persisted? ? f.object.feature_flags : tier_defaults,
      plan_tier: selected_tier
    )
    defaults_by_tier = PlanFeatureCatalog::PLAN_TIERS.index_with do |tier|
      PlanFeatureCatalog.defaults_for_tier(tier)
    end
    grouped_features = PlanFeatureCatalog.known_keys.group_by do |key|
      group = PlanFeatureCatalog.feature_definition(key)[:group]
      group == 'analytics' ? 'insights' : group
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
      state = definition[:type] == :integer ? 'CONFIGURADO' :
                (ActiveModel::Type::Boolean.new.cast(current_value) ? 'ATIVO' : 'BLOQUEADO')
      hint = render_feature_hint.call(key, definition, default_value)
      field_defaults = defaults_by_tier.transform_values { |defaults| defaults[key] }
      input_metadata = {
        plan_feature_input: 'true',
        plan_feature_key: key,
        plan_feature_type: definition[:type].to_s,
        plan_feature_original: current_value.nil? ? '' : current_value.to_s,
        plan_feature_defaults: field_defaults.to_json
      }

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
            view_helpers.content_tag(:span, state, class: 'plan-feature-state',
                                    data: { plan_feature_state: 'true' })
          )

          if definition[:type] == :integer
            view_helpers.concat(view_helpers.label_tag(input_id, 'Valor numérico', class: 'label'))
            view_helpers.concat(
              view_helpers.number_field_tag(
                input_name,
                current_value,
                id: input_id,
                min: 0,
                max: key == 'brand_hero_slides_limit' ? 3 : nil,
                step: 1,
                placeholder: default_value || '0',
                data: input_metadata
              )
            )
          else
            checked = ActiveModel::Type::Boolean.new.cast(current_value)
            view_helpers.concat(view_helpers.hidden_field_tag(input_name, '0', id: nil))
            view_helpers.concat(
              view_helpers.label_tag(input_id, class: 'label') do
                view_helpers.capture do
                  view_helpers.concat(
                    view_helpers.check_box_tag(input_name, '1', checked, id: input_id, data: input_metadata)
                  )
                  view_helpers.concat(' Ativar')
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
              hint: 'Selecionar não altera as funcionalidades. Use Aplicar padrão para substituir os valores.'
      text_node(
        view_helpers.button_tag('Aplicar padrão selecionado',
                                type: 'button', id: 'plan-apply-template',
                                class: 'plan-template-apply')
      )
    end

    f.inputs 'Auditoria da Alteração' do
      f.input :change_reason, label: 'Justificativa (opcional)',
              hint: 'Registrada no histórico sempre que os dados do plano forem alterados.'
    end

    f.inputs 'Integração Stripe (Faturamento)' do
      f.input :stripe_product_id, label: 'Stripe Product ID', hint: 'Ex: prod_XXXX'
      f.input :stripe_price_id_monthly, label: 'Stripe Price ID — 6 meses',
                    hint: 'Price usado para cobrança a cada 6 meses.'
      f.input :stripe_price_id_yearly, label: 'Stripe Price ID — 12 meses',
                   hint: 'Price usado para cobrança a cada 12 meses.'
      f.input :is_public, as: :boolean, label: 'Exibir publicamente no site (/pricing)'
      f.input :display_order, label: 'Ordem de exibição', hint: 'Menor número aparece primeiro no carrossel.'
    end

    feature_groups.each do |group_key, feature_keys|
      f.inputs(FEATURE_GROUP_LABELS[group_key] || group_key.to_s.humanize) do
        para 'Alterações afetam empresas vinculadas a este plano.', class: 'inline-hints'
        # Formtastic/Arbre does not render a SafeBuffer returned by the block
        # unless it is explicitly appended to the component tree.
        text_node(
          view_helpers.safe_join(
            [
              if FEATURE_GROUP_DESCRIPTIONS[group_key].present?
                view_helpers.content_tag(:p, FEATURE_GROUP_DESCRIPTIONS[group_key], class: 'inline-hints')
              end,
              render_feature_group.call(feature_keys)
            ].compact
          )
        )
      end
    end

    f.inputs 'Resumo da Configuração Resultante' do
      text_node(
        view_helpers.content_tag(
          :div, '',
          id: 'plan-feature-summary',
          class: 'plan-feature-summary',
          role: 'status',
          aria: { live: 'polite' },
          data: { plan_tier: selected_tier, plan_company_count: f.object.persisted? ? f.object.companies.count : 0 }
        )
      )
      para 'O resumo e a lista de alterações são atualizados ao marcar os campos.', class: 'inline-hints'
    end

    f.actions
  end
  controller do
    before_action :capture_plan_configuration, only: :update
    after_action :audit_plan_configuration, only: :update

    private

    def plan_configuration_snapshot(plan)
      {
        'name' => plan.name,
        'description' => plan.description,
        'price' => plan.price.to_s,
        'stripe_product_id' => plan.stripe_product_id,
        'stripe_price_id_monthly' => plan.stripe_price_id_monthly,
        'stripe_price_id_yearly' => plan.stripe_price_id_yearly,
        'is_public' => plan.is_public,
        'display_order' => plan.display_order,
        'features_json' => plan.feature_flags
      }
    end

    def capture_plan_configuration
      @plan_configuration_before = plan_configuration_snapshot(resource)
    end

    def audit_plan_configuration
      return if @plan_configuration_before.blank? || !response.redirect?

      updated = Plan.find_by(id: params[:id])
      return unless updated

      after = plan_configuration_snapshot(updated)
      return if after == @plan_configuration_before

      PlanConfigurationAudit.create!(
        plan: updated,
        admin_user: current_admin_user,
        before_state: @plan_configuration_before,
        after_state: after,
        change_reason: params.dig(:plan, :change_reason).to_s.truncate(300)
      )
    rescue StandardError => e
      Rails.logger.error("[PlanAudit] Failed to record update for plan=#{params[:id]}: #{e.class}: #{e.message}")
      # Do not leak params or backtraces to the browser.
    end
  end
end
