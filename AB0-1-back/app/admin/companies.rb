require 'csv'

brazil_states = Locations::BrLocations.states.map do |state|
  [state['name'], state['acronym']]
end.freeze

brazil_capitals = Locations::CoverageNormalizer::BRAZIL_CAPITALS.map do |capital|
  ["#{capital[:city]} / #{capital[:state]}", capital[:city]]
end.freeze

ActiveAdmin.register Company do
  # Scopes
  scope :all
  scope :pending_review
  scope :approved
  scope :rejected
  scope :suspended

  # Actions
  action_item :approve, only: :show, if: proc { resource.moderation_pending_review? || resource.moderation_draft? } do
    link_to 'Approve', approve_admin_company_path(resource), method: :put, class: 'member_link'
  end

  action_item :reject, only: :show, if: proc { resource.moderation_pending_review? || resource.moderation_approved? } do
    link_to 'Reject', reject_admin_company_path(resource), method: :put, class: 'member_link'
  end

  action_item :suspend, only: :show, if: proc { resource.moderation_approved? } do
    link_to 'Suspend', suspend_admin_company_path(resource), method: :put, class: 'member_link'
  end

  action_item :add_product, only: :show do
    link_to 'Adicionar Produto', new_admin_product_path(company_id: resource.id)
  end


  # === GEO: Ação de geocodificação manual ===
  member_action :geocodificar, method: :put do
    if ENV['SEARCH_GEO_ENABLED'] == 'true'
      GeocodeCompanyJob.perform_later(resource.id, force: true)
      resource.update_columns(geocoding_status: 'pending')
      redirect_to resource_path, notice: '✅ Geocodificação enfileirada! Aguarde alguns instantes e recarregue a página.'
    else
      redirect_to resource_path, alert: '⚠️ SEARCH_GEO_ENABLED está desativado. Ative nas variáveis de ambiente.'
    end
  end

  action_item :geocodificar, only: :show do
    link_to '📍 Geocodificar', geocodificar_admin_company_path(resource), method: :put,
                                                                         data: { confirm: 'Enfileirar geocodificação para esta empresa?' }
  end

  member_action :suspend, method: :put do
    resource.update(moderation_status: :suspended)
    redirect_to resource_path, notice: 'Company suspended!'
  end

  batch_action :approve do |ids|
    batch_action_collection.find(ids).each do |company|
      company.approve!(current_admin_user)
    end
    redirect_to collection_path, alert: 'The companies have been approved.'
  end

  permit_params do
    permitted = [
      :name, :slug, :website, :phone, :address,
      :state, :city, :banner, :logo, :verified_badge, :featured, :verified,
      :priority_score, :sponsored,
      :cnpj, :email, :whatsapp,
      :working_hours, :payment_methods,
      :certifications, :status, :founded_year, :employees_count,
      :awards, :partner_brands, :coverage_states, :coverage_cities,
      :latitude, :longitude, :minimum_ticket, :maximum_ticket,
      :response_time_sla, :languages,
      :email_public, :phone_alt, :facebook, :instagram,
      :linkedin, :description,
      :moderation_status, :rejected_reason, :financing_enabled, :financing_tab_visible,
      :active_admin, :p2p_chat_enabled, :seo_title, :seo_description, :meta_description, :seo_keywords,
      { project_types: [], services_offered: [], niche_tags: [], coverage_state_codes: [], coverage_city_names: [], category_ids: [], badge_ids: [], media_assets: [], financing_options_attributes: %i[id financial_institution_id credit_line target_audience max_term_months grace_period_months interest_rate_percent active _destroy],
        company_buttons_attributes: %i[id label url active position button_type _destroy],
        company_faqs_attributes: %i[id question answer status position _destroy],
        company_financing_partners_attributes: %i[id name partner_type website priority position active badge logo _destroy],
        company_members_attributes: %i[id user_id role _destroy],
        company_sector_questions_attributes: %i[id prompt weight order enabled _destroy] }
    ]
    permitted << :effect if Company.column_names.include?('effect')
    permitted << :plan_id if Company.column_names.include?('plan_id')
    permitted << :plan_status if Company.column_names.include?('plan_status')
    permitted << :social_proof_enabled if Company.column_names.include?('social_proof_enabled')
    permitted << :whatsapp_enabled
    permitted << :whatsapp_url
    permitted << :sector_ratings_enabled
    if Company.column_names.include?('whatsapp_button_style_json') || Company.new.respond_to?(:whatsapp_button_style_json)
      permitted + [{ whatsapp_button_style_json: %i[
        variant bg_color text_color border_color
        hover_bg_color icon_color rounded_px
      ] }]
    else
      permitted
    end
  end


  sidebar 'Diagnóstico de Selos & Badges', only: %i[show edit] do
    v_state = resource.feature_access.dig('verified_product', 'state') || 'locked'
    h_state = resource.feature_access.dig('highlight_badges', 'state') || 'locked'

    attributes_table_for resource do
      row('Verificada (Campo)') { status_tag(resource.verified? ? 'Ativo (Sim)' : 'Inativo (Não)', class: resource.verified? ? 'ok' : 'error') }
      row('Destaque (Campo)') { status_tag(resource.featured? ? 'Ativo (Sim)' : 'Inativo (Não)', class: resource.featured? ? 'ok' : 'warning') }
      row('Plano Atual') { resource.plan&.name || 'Sem plano (Free)' }
      row('Selo Verificado (Feature)') { status_tag(v_state, class: v_state == 'enabled' ? 'ok' : 'error') }
      row('Badge Destaque (Feature)') { status_tag(h_state, class: h_state == 'enabled' ? 'ok' : 'error') }
    end
    div class: 'inline-hints', style: 'margin-top: 10px; font-size: 11px; color: #64748b;' do
      '💡 Para exibir o selo no site: 1) Marque "Verified = Sim" E 2) Vincule um Plano Pago (Pro/Enterprise) que libere verified_product.'
    end
  end

  sidebar 'Social Proof status', only: %i[show edit] do
    plan_name = resource.plan&.name || 'No plan'
    plan_price = resource.plan&.price.to_f
    eligibility = resource.can_use_social_proof? ? 'Eligible' : 'Not eligible'

    attributes_table_for resource do
      row('Plan') { "#{plan_name} (#{plan_price.positive? ? "R$ #{format('%.2f', plan_price)}" : 'free'})" }
      row('Plan status') { resource.respond_to?(:plan_status) ? resource.plan_status.to_s : 'n/a' }
      row('Feature toggle') { resource.respond_to?(:social_proof_enabled) ? resource.social_proof_enabled : false }
      row('Eligibility') { eligibility }
    end
  end

  sidebar 'Plan access preview', only: %i[show edit] do
    group_labels = {
      'public_profile' => 'Perfil Publico',
      'conversion' => 'Conversao',
      'trust' => 'Prova Social e Destaque',
      'content' => 'Conteudo',
      'insights' => 'Inteligencia e Dados',
      'marketplace_behavior' => 'Experiencia Competitiva'
    }
    access = resource.feature_access || {}
    enabled_count = access.values.count { |entry| entry['state'] == 'enabled' }
    locked_count = access.values.count { |entry| entry['state'] == 'locked' }
    hidden_count = access.values.count { |entry| entry['state'] == 'hidden' }

    attributes_table_for resource do
      row('Plan') { resource.plan&.name || 'No plan' }
      row('Tier') { status_tag(resource.inferred_plan_tier) }
      row('Enabled') { enabled_count }
      row('Locked') { locked_count }
      row('Hidden') { hidden_count }
    end

    access.group_by { |_feature, entry| entry['group'] || 'other' }.each do |group_key, entries|
      panel(group_labels[group_key] || group_key.to_s.humanize) do
        table_for entries.sort_by(&:first) do
          column('Feature') { |(feature, _entry)| feature.to_s.humanize }
          column('State') { |(_feature, entry)| status_tag(entry['state']) }
          column('Value') do |(_feature, entry)|
            entry['value'].nil? ? status_tag('unset', class: 'warning') : entry['value'].inspect
          end
        end
      end
    end
  end

  form html: { multipart: true } do |f|
    f.semantic_errors(*f.object.errors.attribute_names)
    safe_preview = lambda do |attachment, max_width:, empty_text:|
      next content_tag(:span, empty_text) unless attachment.attached?

      begin
        image_tag(
          url_for(attachment),
          style: "max-width: #{max_width}px; display: block; margin-top: 10px"
        )
      rescue StandardError => e
        Rails.logger.warn("[Admin::Companies] Preview indisponivel attachment=#{attachment.name} company_id=#{f.object.id} error=#{e.class} #{e.message}")
        content_tag(:span, 'Arquivo anexado, mas pre-visualizacao indisponivel no momento.')
      end
    end

    f.inputs 'Basic Information' do
      f.input :name
      f.input :slug,
              hint: 'Identificador único na URL (slug). Cuidado ao alterar para não quebrar links externos indexados ou compartilhados.'
      f.input :description
      f.input :moderation_status, as: :select, collection: Company.moderation_statuses.keys
      f.input :rejected_reason, input_html: { rows: 3 }
      f.input :status, as: :select, collection: %w[active inactive pending blocked]
      f.input :featured
      f.input :verified
      f.input :sponsored, label: 'Patrocinado (Topo do ranking)'
      f.input :priority_score, label: 'Score de Prioridade', hint: 'Maior score = topo do ranking'
      f.input :active_admin, as: :boolean, label: 'Ativar orçamentos (recurso pago)'
      f.input :p2p_chat_enabled, as: :boolean, label: 'Habilitar Chat com Clientes (estilo OLX)'
      if Company.column_names.include?('effect')
        f.input :effect, as: :boolean, label: 'Ativar efeito elétrico no card', input_html: {
          'data-controller': 'effect',
          'data-effect-target': 'checkbox',
          'data-action': 'change->effect#toggleFromCheckbox'
        }
      end

      if Company.column_names.include?('effect')
        f.inputs 'Visual Effects Preview' do
          li do
            div class: 'company-card admin-preview',
                data: { controller: 'effect', 'effect-active-value': f.object.effect } do
              ''
            end
          end
        end
      end
    end

    f.inputs 'SEO & Metadados' do
      seo_description_value = f.object.seo_description.presence || f.object.meta_description

      f.input :seo_title,
              label: 'Título SEO (Meta Title)',
              hint: "Ideal: 30-60 caracteres. Atual: #{f.object.seo_title&.length || 0}. Se vazio, usará o nome da empresa."
      f.input :seo_description,
              label: 'Descrição SEO (Meta Description)',
              as: :text,
              input_html: { rows: 3, value: seo_description_value },
              hint: "Ideal: 70-160 caracteres. Atual: #{seo_description_value&.length || 0}. Se vazio, o frontend usará a descrição institucional."
      f.input :seo_keywords,
              label: 'Palavras-chave (SEO Keywords)',
              hint: "Separe por vírgulas. Ex: energia solar, instalador, [cidade]"
    end

    f.inputs 'Contact & Location' do
      f.input :email
      f.input :email_public
      f.input :phone
      f.input :phone_alt
      f.input :whatsapp
      f.input :address
      f.input :state,
              label: 'Estado',
              as: :select,
              include_blank: 'Selecione um estado',
              collection: brazil_states.map { |name, code| ["#{name} (#{code})", code] },
              input_html: { 'data-selected': f.object.state, required: true, 'aria-label': 'Estado' }
      f.input :city,
              label: 'Cidade',
              as: :select,
              include_blank: 'Selecione um estado primeiro',
              collection: [],
              input_html: { 'data-selected': f.object.city, required: true, disabled: true, 'aria-label': 'Cidade' }
      f.input :latitude, hint: 'Coordenada geográfica (preenchida automaticamente via geocoding)'
      f.input :longitude, hint: 'Coordenada geográfica (preenchida automaticamente via geocoding)'
      f.input :geocoding_status, as: :select,
                                 collection: Company::GEOCODING_STATUSES,
                                 hint: 'Status: pending | success | city_fallback | failed'
      f.input :geocoded_at, as: :string, input_html: { disabled: true },
                            hint: 'Data do último geocoding (automático)'
    end

    f.inputs 'Business Details' do
      columns do
        column do
          f.input :cnpj,
                  required: false,
                  input_html: { required: false, autocomplete: 'off', style: 'width: 90%' },
                  hint: 'Opcional'
          f.input :founded_year, input_html: { style: 'width: 90%' }
          f.input :employees_count, input_html: { style: 'width: 90%' }
        end
        column do
          f.input :working_hours, input_html: { placeholder: 'ex: Seg a Sex, 08h às 18h', style: 'width: 90%' }
          f.input :response_time_sla, label: 'SLA de Resposta',
                                      input_html: { placeholder: 'ex: 24h', style: 'width: 90%' }
          f.input :payment_methods, label: 'Formas de Pagamento',
                                    input_html: { placeholder: 'ex: Cartão, Pix, Boleto', style: 'width: 90%' }
          f.input :languages, as: :string, label: 'Idiomas',
                              input_html: { placeholder: 'ex: Português, Inglês', style: 'width: 90%' }
          columns do
            column do
              f.input :minimum_ticket, as: :number, label: 'Ticket Mínimo (R$)', input_html: { style: 'width: 80%' }
            end
            column do
              f.input :maximum_ticket, as: :number, label: 'Ticket Máximo (R$)', input_html: { style: 'width: 80%' }
            end
          end
        end
      end
    end

    f.inputs 'Especialidades & Tags' do
      columns do
        column span: 1 do
          f.input :project_types,
                  as: :check_boxes,
                  collection: Company::PROJECT_TYPES,
                  label: 'Tipos de Projetos',
                  wrapper_html: { class: 'company-checkbox-group' }
        end
        column span: 1 do
          f.input :niche_tags,
                  as: :check_boxes,
                  collection: Company::NICHE_TAGS,
                  label: 'Tags de Nicho',
                  wrapper_html: { class: 'company-checkbox-group' }
        end
        column span: 2 do
          f.input :services_offered,
                  as: :check_boxes,
                  collection: Company::SERVICES_OFFERED,
                  label: 'Serviços Oferecidos',
                  wrapper_html: { class: 'company-checkbox-group' }
        end
      end
    end

    f.inputs 'Opções de Financiamento' do
      f.has_many :financing_options, allow_destroy: true, heading: false, new_record: 'Adicionar Opção' do |fo|
        fo.input :financial_institution_id, as: :select, collection: FinancialInstitution.ordered.map { |fi| [fi.name, fi.id] }, label: 'Instituição (banco com logo)'
        fo.input :credit_line, label: 'Linha de Crédito'
        fo.input :target_audience, as: :select, collection: %w[PF PJ Rural], label: 'Público Alvo'
        fo.input :interest_rate_percent, label: 'Taxa de Juros (%)', input_html: { step: 0.01 }
        fo.input :max_term_months, label: 'Prazo Máximo (meses)'
        fo.input :grace_period_months, label: 'Carência (meses)'
        fo.input :active, label: 'Ativo'
      end
    end

    f.inputs 'Parceiros de Financiamento' do
      f.has_many :company_financing_partners, allow_destroy: true, heading: false, new_record: 'Adicionar Parceiro' do |fp|
        fp.input :name, label: 'Nome do Banco/Parceiro'
        fp.input :website, label: 'Website'
        fp.input :logo, as: :file, label: 'Logo do Parceiro', hint: (fp.object.logo.attached? ? image_tag(url_for(fp.object.logo), style: 'max-width: 120px;') : 'Nenhuma imagem selecionada')
        fp.input :partner_type, label: 'Tipo'
        fp.input :badge, label: 'Selo'
        fp.input :priority, label: 'Prioridade'
        fp.input :position, label: 'Posição'
        fp.input :active, label: 'Ativo'
      end
    end

    f.inputs 'Financiamento (nova aba)' do
      f.input :financing_enabled, label: 'Habilitar Financiamento Premium'
      f.input :financing_tab_visible, label: 'Exibir aba de financiamento'
      f.template.concat(
        f.template.content_tag(:p, 'Configurações detalhadas (perfil, parceiros, ofertas) estão no menu Financiamento.')
      )
    end

    columns do
      column do
        f.inputs 'Área de Abrangência' do
          legacy_states = Locations::CoverageNormalizer.unrecognized_states(f.object.coverage_states)
          legacy_cities = Locations::CoverageNormalizer.unrecognized_cities(f.object.coverage_cities)
          if legacy_states.any? || legacy_cities.any?
            f.template.concat(
              f.template.content_tag(
                :p,
                "Entradas legadas preservadas: #{(legacy_states + legacy_cities).join(', ')}",
                class: 'inline-hints'
              )
            )
          end
          f.input :coverage_state_codes,
                  as: :check_boxes,
                  collection: brazil_states.map { |name, code| ["#{name} (#{code})", code] },
                  label: 'Estados atendidos',
                  hint: 'Salva UFs canônicas em coverage_states, sem alterar o estado principal.'
          f.input :coverage_city_names,
                  as: :select,
                  collection: brazil_capitals,
                  input_html: { multiple: true, class: 'select2-input' },
                  label: 'Capitais e cidades atendidas',
                  hint: 'Salva cidades canônicas em coverage_cities. Valores legados desconhecidos são preservados.'
        end
      end
      column do
        f.inputs 'Certifications & More' do
          f.input :certifications, input_html: { rows: 2 }
          f.input :awards, input_html: { rows: 2 }
          f.input :partner_brands, input_html: { rows: 2 }
        end
      end
    end

    f.inputs 'Social Media' do
      f.input :website
      f.input :facebook
      f.input :instagram
      f.input :linkedin
    end

    f.inputs 'Media & Visual Assets' do
      f.input :logo, as: :file,
                     hint: safe_preview.call(f.object.logo, max_width: 100, empty_text: 'PNG, JPG, SVG ou WEBP (Max 5MB)')

      f.input :banner, as: :file,
                       hint: safe_preview.call(f.object.banner, max_width: 300, empty_text: 'Recomendado: 1200x400 (Max 10MB)')

      f.input :verified_badge, as: :file,
                               hint: safe_preview.call(f.object.verified_badge, max_width: 100, empty_text: 'PNG, JPG ou WEBP (Max 2MB). Selo customizado exibido no widget e perfil.')

      f.input :media_assets, as: :file, input_html: { multiple: true },
                             hint: 'Envie uma ou mais imagens para a galeria. Formatos: JPG, PNG, SVG ou WEBP (Max 15MB por arquivo)'

      if f.object.media_assets.attached?
        f.template.concat(
          f.template.content_tag(:div, class: 'media-gallery-preview') do
            f.object.media_assets.map do |asset|
              f.template.content_tag(:div, style: 'display: inline-block; margin: 5px;') do
                f.template.image_tag(url_for(asset), style: 'max-width: 100px; height: auto; border: 1px solid #ddd;')
              rescue StandardError => e
                Rails.logger.warn("[Admin::Companies] Preview indisponivel media_asset=#{asset.id} company_id=#{f.object.id} error=#{e.class} #{e.message}")
                f.template.content_tag(:span, 'Preview indisponivel')
              end
            end.join.html_safe
          end
        )
      end
    end

    f.inputs 'CTAs' do
      f.input :whatsapp_enabled, as: :boolean, label: 'Ativar botão WhatsApp'
      f.input :whatsapp_url, label: 'URL do WhatsApp (ex: https://wa.me/...)'
    end

    if f.object.respond_to?(:whatsapp_button_style_json)
      f.inputs 'WhatsApp – Estilos do Botão' do
        styles = f.object.whatsapp_button_style_json || {}
        f.input :variant, as: :select,
                          input_html: { name: 'company[whatsapp_button_style_json][variant]' },
                          collection: [%w[Sólido solid], %w[Contorno outline]],
                          include_blank: false,
                          selected: styles['variant'] || 'solid',
                          label: 'Estilo'
        f.input :bg_color, as: :string,
                           input_html: { type: 'color', name: 'company[whatsapp_button_style_json][bg_color]', value: styles['bg_color'] || '#16a34a' },
                           label: 'Cor de fundo'
        f.input :hover_bg_color, as: :string,
                                 input_html: { type: 'color', name: 'company[whatsapp_button_style_json][hover_bg_color]', value: styles['hover_bg_color'] || '#15803d' },
                                 label: 'Cor de fundo (hover)'
        f.input :text_color, as: :string,
                             input_html: { type: 'color', name: 'company[whatsapp_button_style_json][text_color]', value: styles['text_color'] || '#ffffff' },
                             label: 'Cor do texto'
        f.input :border_color, as: :string,
                               input_html: { type: 'color', name: 'company[whatsapp_button_style_json][border_color]', value: styles['border_color'] || '#16a34a' },
                               label: 'Cor da borda'
        f.input :icon_color, as: :string,
                             input_html: { type: 'color', name: 'company[whatsapp_button_style_json][icon_color]', value: styles['icon_color'] || '#ffffff' },
                             label: 'Cor do ícone'
        f.input :rounded_px, as: :number,
                             input_html: { name: 'company[whatsapp_button_style_json][rounded_px]', value: styles['rounded_px'] || 12, min: 0, max: 32 },
                             label: 'Arredondamento (px)'
      end
    end

    if Company.column_names.include?('plan_id') || Company.column_names.include?('plan_status')
      f.inputs 'Plano' do
        if Company.column_names.include?('plan_id')
          f.input :plan_id, as: :select, collection: Plan.all.map { |p| [p.name, p.id] }, include_blank: true
        end
        if Company.column_names.include?('plan_status')
          f.input :plan_status, as: :select, collection: %w[active inactive trial expired]
        end

        if f.object.persisted?
          access = f.object.feature_access || {}
          enabled_count = access.values.count { |entry| entry['state'] == 'enabled' }
          locked_count = access.values.count { |entry| entry['state'] == 'locked' }
          hidden_count = access.values.count { |entry| entry['state'] == 'hidden' }

          f.template.concat(
            f.template.content_tag(:div, class: 'admin-plan-preview') do
              f.template.safe_join(
                [
                  f.template.content_tag(:p, "Tier resolvido: #{f.object.inferred_plan_tier}", class: 'inline-hints'),
                  f.template.content_tag(
                    :p,
                    "Enabled: #{enabled_count} | Locked: #{locked_count} | Hidden: #{hidden_count}",
                    class: 'inline-hints'
                  )
                ]
              )
            end
          )
        end
      end
    end

    if Company.column_names.include?('social_proof_enabled')
      f.inputs 'Configuracoes de Prova Social' do
        f.input :social_proof_enabled,
                as: :boolean,
                label: 'Habilitar prova social real'
        f.template.concat(
          f.template.content_tag(
            :p,
            'Disponivel apenas para empresas com plano pago elegivel.'
          )
        )
      end

      f.inputs 'Configurações de Avaliações Setoriais' do
        f.input :sector_ratings_enabled,
                as: :boolean,
                label: 'Habilitar perguntas customizadas para avalição setorial'
        f.has_many :company_sector_questions, allow_destroy: true, new_record: 'Adicionar pergunta' do |q|
          q.input :prompt
          q.input :weight
          q.input :order
          q.input :enabled
        end
      end
    end

    f.inputs 'FAQ da Empresa' do
      f.has_many :company_faqs, allow_destroy: true, new_record: 'Adicionar FAQ' do |cf|
        cf.input :question
        cf.input :answer
        cf.input :status, as: :select, collection: CompanyFaq.statuses.keys
        cf.input :position
      end
    end

    f.inputs 'Membros da Empresa' do
      f.has_many :company_members, allow_destroy: true, heading: false, new_record: 'Adicionar Membro' do |m|
        m.input :user, collection: User.where(role: 'company').order(:name)
        m.input :role, as: :select, collection: CompanyMember.roles.keys
      end
    end

    f.inputs 'Categories' do
      f.input :categories, as: :select, multiple: true, input_html: { class: 'select2-input' },
                           collection: Category.all.order(:name)
    end

    f.inputs 'Gestão de Selos, Verificação & Badges' do
      f.input :verified, label: 'Empresa Verificada (Ativa Selo Verde no Perfil)', hint: '💡 Ativa a tag visual. Para exibir publicamente, o Plano da empresa também deve liberar a funcionalidade verified_product (Ex: Plano Pro).'
      f.input :featured, label: 'Empresa em Destaque (Ativa Insígnia DESTAQUE PREMIUM)', hint: '💡 Ativa a tag de topo. Requer que o Plano da empresa possua a funcionalidade highlight_badges liberada.'
      f.input :badges, as: :check_boxes, label: 'Medalhas & Reconhecimentos Globais da Plataforma', collection: Badge.active.order(:name)
    end

    f.inputs 'Botoes Personalizados' do
      f.has_many :company_buttons, allow_destroy: true, heading: false, sortable: :position, sortable_start: 1 do |cb|
        cb.input :label, label: 'Texto do Botão'
        cb.input :url, label: 'URL de Destino'
        cb.input :button_type, as: :select,
                               collection: [['Primário (Azul)', 'primary'], ['WhatsApp (Verde)', 'whatsapp'], ['Secundário (Outline)', 'secondary'], ['Custom', 'custom']], include_blank: false
        cb.input :active, label: 'Ativo'
      end
    end

    f.actions
  end

  show do
    panel 'Moderation Details' do
      attributes_table_for resource do
        row :moderation_status do |company|
          status_tag company.moderation_status, class: "status_#{company.moderation_status}"
        end
        row :submitted_at
        row :approved_at
        row :approved_by
        row :rejected_reason
      end
    end

    panel 'Analytics' do
      attributes_table_for resource do
        row :profile_views_count
        row :cta_clicks_count
        row :whatsapp_clicks_count
      end
    end

    panel 'Social Proof & Reviews 2.0' do
      # Calculate aggregates from reviews metadata cache
      # Map to hash explicitly to avoid nil issues
      stats = resource.reviews.approved.pluck(:metadata).map { |m| m || {} }
      total_reads = stats.sum { |m| m['read_count'].to_i }
      total_clicks = stats.sum { |m| m['cta_clicks'].to_i }

      attributes_table_for resource do
        row 'Total de Leituras de Mini Cases' do
          status_tag total_reads, class: 'info'
        end
        row 'Total de Cliques de Interesse (Review CTA)' do
          status_tag total_clicks, class: 'ok'
        end
        row 'Taxa de Conversão de Social Proof' do
          total_reads.positive? ? "#{(total_clicks.to_f / total_reads * 100).round(2)}%" : '0%'
        end
        row 'Score Médio de Prova Social' do
          resource.reviews.approved.average(:rating).to_f.round(2)
        end
      end
    end

    panel 'Configuração do ICP (Ideal Customer Profile)' do
      if resource.company_icp_profile.present?
        details class: 'icp-collapsible-details', open: true do
          summary style: 'cursor: pointer; font-weight: bold; padding: 6px 12px; outline: none; display: flex; align-items: center; gap: 8px; background: #f4f4f4; border: 1px solid #e2e2e2; border-radius: 4px; select-none: none;' do
            span '⚙️ Parâmetros Ativos de Qualificação (Clique para minimizar)'
          end
          
          div style: 'margin-top: 15px; border-top: 1px solid #e9e9e9; padding-top: 15px;' do
            attributes_table_for resource.company_icp_profile do
              row :strictness_level do |p|
                status_tag p.strictness_level, class: "status_#{p.strictness_level}"
              end
              row :auto_reject_out_of_icp do |p|
                status_tag (p.auto_reject_out_of_icp ? 'sim' : 'não'), class: (p.auto_reject_out_of_icp ? 'ok' : 'info')
              end
              row :notify_only_high_match do |p|
                status_tag (p.notify_only_high_match ? 'sim' : 'não'), class: (p.notify_only_high_match ? 'ok' : 'info')
              end
              row :min_monthly_bill do |p|
                number_to_currency(p.min_monthly_bill, unit: 'R$ ', separator: ',', delimiter: '.')
              end
              row :min_system_kwp do |p|
                "#{p.min_system_kwp} kWp" if p.min_system_kwp
              end
              row :min_ev_chargers_count
              row :target_audiences do |p|
                Array(p.target_audiences).join(', ')
              end
              row :preferred_roof_types do |p|
                Array(p.preferred_roof_types).join(', ')
              end
              row :ev_charger_types do |p|
                Array(p.ev_charger_types).join(', ')
              end
              row :nationwide do |p|
                status_tag (p.nationwide ? 'nacional' : 'regional'), class: (p.nationwide ? 'ok' : 'info')
              end
              row :target_states do |p|
                Array(p.target_states).join(', ')
              end
              row :target_cities do |p|
                Array(p.target_cities).join(', ')
              end
            end
          end
        end
      else
        div class: 'blank_slate_container' do
          span class: 'blank_slate' do
            'Esta empresa ainda não configurou as regras de ICP.'
          end
        end
      end
    end

    if Company.column_names.include?('effect')
      panel 'Visual Effect Preview' do
        div class: 'company-card admin-preview', 'data-controller': 'effect',
            'data-effect-active-value': resource.effect do
        end
      end
    end
    attributes_table do
      row :name
      row :cnpj
      row :email
      row :website
      row :phone
      row :whatsapp
      row :address
      row :state
      row :city
      row :working_hours
      row :payment_methods
      row :project_types do |company|
        if company.project_types.is_a?(Array)
          div style: 'display: flex; gap: 5px; flex-wrap: wrap;' do
            company.project_types.each do |pt|
              span pt, class: 'status_tag', style: 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;'
            end
          end
        else
          company.project_types
        end
      end
      row :services_offered do |company|
        services = Array(company.services_offered).select { |s| Company::SERVICES_OFFERED.include?(s) }
        if services.any?
          div style: 'display: flex; gap: 5px; flex-wrap: wrap;' do
            services.each do |service|
              span service, class: 'status_tag',
                            style: 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;'
            end
          end
        else
          span 'Nenhum serviço selecionado ou válido', style: 'color: #999; font-style: italic;'
        end
      end
      row :featured
      row :verified
      row :social_proof_enabled if Company.column_names.include?('social_proof_enabled')
      row :status
      row :average_rating
      row :reviews_count
      row :categories do |company|
        company.categories.pluck(:name).join(', ')
      end
      row :badges do |company|
        div style: 'display: flex; gap: 10px; flex-wrap: wrap;' do
          company.badges.each do |badge|
            if badge.image.attached?
              div title: badge.name do
                image_tag url_for(badge.image), style: 'height: 40px; width: auto;'
              end
            else
              span badge.name
            end
          end
        end
      end
      row :banner do |company|
        if company.banner.attached?
          begin
            image_tag(url_for(company.banner), style: 'max-width: 300px')
          rescue StandardError
            content_tag(:span, 'Banner anexado, mas preview indisponivel')
          end
        else
          content_tag(:span, 'Sem banner')
        end
      end
      row :logo do |company|
        if company.logo.attached?
          begin
            image_tag(url_for(company.logo), style: 'max-width: 200px')
          rescue StandardError
            content_tag(:span, 'Logo anexado, mas preview indisponivel')
          end
        else
          content_tag(:span, 'Sem logo')
        end
      end
      row :verified_badge do |company|
        if company.verified_badge.attached?
          begin
            image_tag(url_for(company.verified_badge), style: 'max-width: 100px')
          rescue StandardError
            content_tag(:span, 'Selo anexado, mas preview indisponivel')
          end
        else
          content_tag(:span, 'Sem selo customizado')
        end
      end
    end

    panel 'Coverage & Certifications' do
      columns do
        column do
          attributes_table_for resource do
            row :coverage_states
            row :coverage_cities
          end
        end
        column do
          attributes_table_for resource do
            row :certifications do |c|
              simple_format(c.certifications) if c.certifications.present?
            end
            row :awards do |c|
              simple_format(c.awards) if c.awards.present?
            end
            row :partner_brands do |c|
              simple_format(c.partner_brands) if c.partner_brands.present?
            end
          end
        end
      end
    end

    panel 'Galeria' do
      columns do
        column do
          panel 'Imagens' do
            if resource.media_assets.attached?
              ul do
                resource.media_assets.each do |img|
                  li do
                    image_tag(url_for(img), style: 'max-width: 120px; height: auto;')
                  rescue StandardError
                    content_tag(:span, 'Preview indisponivel')
                  end
                end
              end
            else
              status_tag 'Sem imagens'
            end
          end
        end
        column do
          panel 'Vídeos' do
            vids = resource.company_videos.where(status: 'published')
            if vids.any?
              ul do
                vids.each do |v|
                  li do
                    if v.thumbnail_url.present?
                      span(image_tag(v.thumbnail_url, style: 'max-width: 120px; height: auto;'))
                    end
                    text_node " #{v.provider} – #{v.video_id}"
                  end
                end
              end
            else
              status_tag 'Sem vídeos'
            end
          end
        end
      end
    end

    panel 'Produtos' do
      table_for resource.products do
        column :id
        column :name
        column :price
        column :created_at
        column 'Ações' do |product|
          links = []
          links << link_to('Ver', admin_product_path(product))
          links << link_to('Editar', edit_admin_product_path(product))
          safe_join(links, ' | ')
        end
      end
      div class: 'mt-2' do
        link_to 'Adicionar Produto', new_admin_product_path(company_id: resource.id), class: 'button'
      end
    end

    panel 'Histórico de Alterações' do
      table_for resource.versions.reorder(created_at: :desc).limit(10) do
        column :event
        column :whodunnit do |v|
          if v.whodunnit
            user = User.find_by(id: v.whodunnit)
            user ? link_to(user.name, admin_user_path(user)) : v.whodunnit
          end
        end
        column :created_at
        column :changes do |v|
          v.changeset.map { |k, val| "#{k}: #{val[0]} -> #{val[1]}" }.join('<br>').html_safe if v.changeset
        end
        column :actions do |v|
          if v.event == 'update'
            link_to 'Rollback', rollback_admin_company_path(resource, version_id: v.id), method: :put,
                                                                                         data: { confirm: 'Deseja reverter para esta versão?' }
          end
        end
      end
    end

    active_admin_comments
  end

  member_action :rollback, method: :put do
    version = PaperTrail::Version.find(params[:version_id])
    if version.reify.save
      redirect_to resource_path, notice: "Empresa revertida para a versão de #{version.created_at}"
    else
      redirect_to resource_path, alert: 'Falha ao reverter versão.'
    end
  end

  filter :name
  filter :state
  filter :city
  filter :featured
  filter :verified
  filter :status
  filter :created_at
  filter :categories

  index do
    selectable_column
    id_column
    column :name
    column :cnpj
    column :state
    column :city
    column :status do |company|
      status_tag company.status
    end
    column :priority_score
    column :rating_avg
    column :reviews_count
    column :leads_count
    column :moderation_status do |company|
      status_tag company.moderation_status, class: "status_#{company.moderation_status}"
    end
    column :featured
    column :verified
    if Company.column_names.include?('effect')
      column(:effect) do |company|
        status_tag(company.effect ? 'On' : 'Off',
                   class: company.effect ? 'ok' : 'warning')
      end
    end
    column :plan_status if Company.column_names.include?('plan_status')
    column :plan if Company.reflect_on_association(:plan)
    column :created_at
    actions
  end

  scope('Pendentes') { |scope| scope.where(status: 'pending') }

  member_action :approve, method: :put do
    resource.transaction do
      raise ActiveRecord::RecordInvalid, resource unless resource.approve!(current_admin_user)

      resource.update!(status: 'active')

      # FIX #5: Unificar aprovação de empresa e usuário criador no ActiveAdmin
      owner_member = resource.company_members.find_by(role: 'owner')
      if owner_member&.user
        user = owner_member.user
        user.update!(
          status: 'active',
          approved_by_admin: true
        )
        # Se o usuário ainda não foi confirmado, envia as instruções agora que foi aprovado
        user.send_confirmation_instructions unless user.confirmed?
      end
    end

    begin
      CompanyMailer.registration_approved(resource).deliver_later
    rescue StandardError => e
      Rails.logger.error("[Admin::Companies] registration_approved failed company_id=#{resource.id} error=#{e.class} #{e.message}")
      flash[:alert] = 'Empresa aprovada, mas nao foi possivel enfileirar o email.'
    end
    redirect_to resource_path(resource), notice: 'Empresa aprovada com sucesso! E-mail enviado.'
  rescue ActiveRecord::RecordInvalid => e
    redirect_to resource_path(resource), alert: "Não foi possível aprovar: #{e.record.errors.full_messages.join(', ')}"
  end

  member_action :reject, method: :put do
    # Simple rejection without reason for button click, or redirect to a form
    # Here we just reject. If reason is needed, we should probably have a form.
    # For now, let's assume rejection is generic or pass a param.
    # If the user wants a reason, we need an input.
    # We can use a simple input dialog via JS or a separate page.
    # Given the complexity, let's just reject.
    # User asked for: "Sistema de aprovação/reprovação com campo para justificativa"
    # ActiveAdmin doesn't support input in member_action easily without custom page.
    # We will just update status to blocked/rejected and maybe send a generic reason or "Motivo não informado".

    # Better approach: Redirect to a form or use input.
    # Let's try to grab a reason if passed, otherwise default.

    reason = params[:reason].presence || 'Informações inconsistentes'
    resource.transaction do
      raise ActiveRecord::RecordInvalid, resource unless resource.reject!(current_admin_user, reason)

      resource.update!(status: 'blocked') # or inactive
    end

    begin
      CompanyMailer.registration_rejected(resource, reason).deliver_later
    rescue StandardError => e
      Rails.logger.error("[Admin::Companies] registration_rejected failed company_id=#{resource.id} error=#{e.class} #{e.message}")
      flash[:alert] = 'Empresa reprovada, mas nao foi possivel enfileirar o email.'
    end
    redirect_to resource_path(resource), notice: 'Empresa reprovada. E-mail enviado.'
  rescue ActiveRecord::RecordInvalid => e
    redirect_to resource_path(resource), alert: "Não foi possível reprovar: #{e.record.errors.full_messages.join(', ')}"
  end

  action_item :approve, only: :show do
    if resource.status == 'pending'
      link_to 'Aprovar Cadastro', approve_admin_company_path(resource), method: :put, class: 'member_link'
    end
  end

  action_item :reject, only: :show do
    if resource.status == 'pending'
      # Using a simple prompt for reason via javascript would be ideal but hard in pure ruby
      # We will just link to the action
      link_to 'Reprovar Cadastro',
              reject_admin_company_path(resource),
              method: :put,
              class: 'member_link js-reject-company',
              data: {
                behavior: 'reject-company',
                url: reject_admin_company_path(resource),
                prompt: 'Motivo da reprovação:'
              }
    end
  end

  controller do
    def scoped_collection
      super.includes(:categories, :plan)
    end

    def find_resource
      scoped_collection.find_by(id: params[:id]) ||
        scoped_collection.find_by(slug: params[:id]) ||
        super
    end

    def update
      # Verificar se há upload de arquivos
      has_file_uploads = params[:company] && (
        params[:company][:banner].present? ||
        params[:company][:logo].present? ||
        params[:company][:media_assets].present?
      )

      if has_file_uploads
        # Verificar se storage está configurado corretamente
        begin
          service = ActiveStorage::Blob.service
          # Tenta acessar o serviço para garantir que está configurado
          service.class.name
        rescue ArgumentError => e
          if e.message.include?('missing keyword')
            flash[:error] =
              'Credenciais do storage não configuradas. Configure SPACES_ACCESS_KEY_ID e SPACES_SECRET_ACCESS_KEY no .env ou use ACTIVE_STORAGE_SERVICE=local'
            redirect_to edit_admin_company_path(resource) and return
          end
          raise
        end
      end

      super
    rescue ArgumentError => e
      unless e.message.include?('unable to sign request') || e.message.include?('missing keyword') || e.message.include?('credentials')
        raise
      end

      Rails.logger.error "[Upload Error] Missing storage credentials: #{e.message}"
      flash[:error] =
        'Erro de credenciais: Configure SPACES_ACCESS_KEY_ID e SPACES_SECRET_ACCESS_KEY ou use storage local'
      redirect_to edit_admin_company_path(resource)
    rescue StandardError => e
      Rails.logger.error "[Company Update Error] #{e.class}: #{e.message}"
      Rails.logger.error e.backtrace.first(10).join("\n")

      flash[:error] = "Erro ao atualizar empresa: #{e.message}"
      redirect_to edit_admin_company_path(resource)
    end

    def destroy
      company = find_resource

      if company.destroy
        redirect_to collection_path, notice: 'Empresa excluida com sucesso.'
      else
        errors = company.errors.full_messages.presence || ['existem dependencias vinculadas']
        redirect_to resource_path(company), alert: "Nao foi possivel excluir a empresa: #{errors.join(', ')}"
      end
    rescue ActiveRecord::RecordNotFound
      redirect_to collection_path, alert: 'Empresa nao encontrada.'
    rescue ActiveRecord::InvalidForeignKey => e
      Rails.logger.error("[Admin::Companies] Destroy failed for company_id=#{params[:id]}: #{e.class} #{e.message}")
      redirect_to collection_path, alert: 'Nao foi possivel excluir a empresa porque existem registros vinculados.'
    rescue StandardError => e
      Rails.logger.error("[Admin::Companies] Unexpected destroy error for company_id=#{params[:id]}: #{e.class} #{e.message}")
      redirect_to collection_path, alert: 'Erro inesperado ao excluir a empresa.'
    end
  end

  batch_action :ativar, confirm: 'Ativar empresas selecionadas?' do |ids|
    activated = 0
    errors = []

    batch_action_collection.where(id: ids).find_each do |company|
      company.update!(status: 'active')
      activated += 1
    rescue ActiveRecord::RecordInvalid => e
      errors << "#{company.id}: #{e.record.errors.full_messages.join(', ')}"
    end

    notice = "Empresas ativadas: #{activated}"
    if errors.any?
      redirect_to collection_path, notice: notice, alert: errors.take(10).join(' | ')
    else
      redirect_to collection_path, notice: notice
    end
  end

  batch_action :reject_with_reason, form: {
    reason: :text
  }, confirm: 'Rejeitar empresas selecionadas?' do |ids, inputs|
    companies = batch_action_collection.where(id: ids)
    rejected = 0
    errors = []
    reason = inputs[:reason].presence || 'Informações inconsistentes'

    companies.find_each do |company|
      company.update!(status: 'blocked')
      CompanyMailer.registration_rejected(company, reason).deliver_later
      rejected += 1
    rescue ActiveRecord::RecordInvalid => e
      errors << "#{company.id}: #{e.record.errors.full_messages.join(', ')}"
    end

    notice = "#{rejected} empresas reprovadas."
    if errors.any?
      redirect_to collection_path, notice: notice, alert: errors.take(10).join(' | ')
    else
      redirect_to collection_path, notice: notice
    end
  end

  action_item :import_csv, only: :index do
    link_to 'Importar CSV', import_csv_form_admin_companies_path
  end

  collection_action :import_csv_form, method: :get do
    form_html = <<~HTML
      <div class="panel">
        <h3>Importar Empresas via CSV</h3>
        <form action="#{import_csv_admin_companies_path}" method="post" enctype="multipart/form-data">
          <input type="hidden" name="authenticity_token" value="#{form_authenticity_token}">
          <p>
            <input type="file" name="csv_file" accept=".csv" required>
          </p>
          <p>
            <button type="submit" class="button">Importar</button>
          </p>
        </form>
      </div>
    HTML
    render html: form_html.html_safe
  end

  collection_action :import_csv, method: :post do
    file = params[:csv_file]
    redirect_to admin_companies_path, alert: 'Arquivo não enviado.' and return if file.nil?

    created = 0
    updated = 0
    invalid = 0
    errors = []

    CSV.foreach(file.path, headers: true).with_index(2) do |row, line_number|
      raw_name = row['name'] || row['nome']
      name = raw_name.to_s.strip
      if name.blank?
        errors << "linha #{line_number}: nome ausente"
        invalid += 1
        next
      end

      raw_state = row['state'] || row['uf'] || row['sigla_uf']
      raw_city = row['city'] || row['cidade'] || row['municipio']
      state = raw_state.to_s.strip.upcase
      city = raw_city.to_s.strip.gsub(/\s+/, ' ')

      if state.present? && !Locations::BrLocations.valid_state?(state)
        errors << "linha #{line_number}: estado inválido"
        invalid += 1
        next
      end

      if city.present? && !Locations::BrLocations.valid_city?(state, city)
        errors << "linha #{line_number}: cidade inválida para o estado #{state}"
        invalid += 1
        next
      end

      cnpj_raw = row['cnpj'].to_s.strip
      cnpj_digits = cnpj_raw.gsub(/\D/, '')
      email_raw = row['email'].to_s.strip
      email = email_raw.downcase
      force_pending = cnpj_digits.blank? && email.blank? && !(name.present? && state.present? && city.present?)

      company =
        if cnpj_digits.present?
          Company.find_by(cnpj: cnpj_digits) || Company.find_by(cnpj: cnpj_raw) || Company.new(cnpj: cnpj_raw.presence || cnpj_digits)
        elsif email.present?
          Company.find_by(email: email) || Company.new(email: email)
        elsif name.present? && state.present? && city.present?
          Company.find_by(name: name, state: state, city: city) || Company.new
        else
          Company.new
        end

      was_new = company.new_record?

      raw_status = row['status'].to_s.strip.downcase
      status = Company.statuses.key?(raw_status) ? raw_status : 'pending'
      if raw_status.present? && status == 'pending'
        errors << "linha #{line_number}: status inválido, definido como pending"
      end
      status = 'pending' if force_pending

      attrs = {
        name: name,
        description: row['description'] || 'Empresa importada',
        website: row['website'],
        phone: row['phone'],
        address: row['address'],
        state: state.presence,
        city: city.presence,
        cnpj: cnpj_raw.presence || cnpj_digits.presence,
        email: email.presence,
        whatsapp: row['whatsapp'],
        status: status,
        featured: %w[true 1 yes sim].include?((row['featured'] || '').to_s.downcase),
        verified: %w[true 1 yes sim].include?((row['verified'] || '').to_s.downcase),
        whatsapp_enabled: %w[true 1 yes sim].include?((row['whatsapp_enabled'] || '').to_s.downcase),
        whatsapp_url: row['whatsapp_url']
      }

      cats = (row['categories'] || '').to_s.split(',').map(&:strip).reject(&:blank?)
      existing_categories = cats.any? ? Category.where(name: cats) : Category.none
      missing_categories = cats - existing_categories.pluck(:name)
      errors << "linha #{line_number}: categorias ausentes: #{missing_categories.join(', ')}" if missing_categories.any?

      company.assign_attributes(attrs)
      company.categories = existing_categories if cats.any?

      if attrs[:status] == 'active' && !company.ready_for_activation?
        company.status = 'pending'
        errors << "linha #{line_number}: status active inválido, definido como pending"
      end

      if company.save
        was_new ? created += 1 : updated += 1
      else
        errors << "linha #{line_number}: #{company.errors.full_messages.join(', ')}"
        invalid += 1
      end
    end

    notice_msg = "Importação concluída: #{created} criadas, #{updated} atualizadas, #{invalid} inválidas"
    if errors.any?
      redirect_to admin_companies_path, notice: notice_msg, alert: errors.take(10).join(' | ')
    else
      redirect_to admin_companies_path, notice: notice_msg
    end
  end
end
