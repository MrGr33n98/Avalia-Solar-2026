require 'csv'

brazil_states = Locations::BrLocations.states.map do |state|
  [state['name'], state['acronym']]
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

  controller do
    def find_resource
      scoped_collection.find_by_slug_or_id!(params[:id])
    end
  end

  action_item :add_product, only: :show do
    link_to 'Adicionar Produto', new_admin_product_path(company_id: resource.id)
  end

  member_action :suspend, method: :put do
    resource.update(moderation_status: :suspended)
    redirect_to resource_path, notice: "Company suspended!"
  end

  batch_action :approve do |ids|
    batch_action_collection.find(ids).each do |company|
      company.approve!(current_admin_user)
    end
    redirect_to collection_path, alert: "The companies have been approved."
  end

  permit_params do
  permitted = [
    :name, :website, :phone, :address,
    :state, :city, :banner, :logo, :verified_badge, :featured, :verified,
    :cnpj, :email, :whatsapp,
    :working_hours, :payment_methods,
    :certifications, :status, :founded_year, :employees_count,
    :awards, :partner_brands, :coverage_states, :coverage_cities,
    :latitude, :longitude, :minimum_ticket, :maximum_ticket,
    :response_time_sla, :languages,
    :email_public, :phone_alt, :facebook, :instagram,
    :linkedin, :description,
    :moderation_status, :rejected_reason, :financing_enabled, :financing_tab_visible,
    :active_admin,
    project_types: [], services_offered: [], category_ids: [], media_assets: [],
    financing_options_attributes: [:id, :institution_name, :credit_line, :target_audience, :max_term_months, :grace_period_months, :interest_rate_percent, :active, :_destroy],
    company_buttons_attributes: [:id, :label, :url, :active, :position, :button_type, :_destroy],
    company_faqs_attributes: [:id, :question, :answer, :status, :position, :_destroy],
    company_members_attributes: [:id, :user_id, :role, :_destroy],
    company_sector_questions_attributes: %i[id prompt weight order enabled _destroy]
  ]
  permitted << :effect if Company.column_names.include?('effect')
  permitted << :plan_id if Company.column_names.include?('plan_id')
  permitted << :plan_status if Company.column_names.include?('plan_status')
  permitted << :social_proof_enabled if Company.column_names.include?('social_proof_enabled')
  permitted << :whatsapp_enabled
  permitted << :whatsapp_url
  permitted << :sector_ratings_enabled
  if Company.column_names.include?('whatsapp_button_style_json') || Company.new.respond_to?(:whatsapp_button_style_json)
    permitted + [whatsapp_button_style_json: [
      :variant, :bg_color, :text_color, :border_color,
      :hover_bg_color, :icon_color, :rounded_px
    ]]
  else
    permitted
  end
end


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
    column :moderation_status do |company|
      status_tag company.moderation_status, class: "status_#{company.moderation_status}"
    end
    column :featured
    column :social_proof_enabled if Company.column_names.include?('social_proof_enabled')
    column :created_at
    actions
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

  form html: { multipart: true } do |f|
    f.semantic_errors *f.object.errors.attribute_names
    safe_preview = lambda do |attachment, max_width:, empty_text:|
      unless attachment.attached?
        next content_tag(:span, empty_text)
      end

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
      f.input :description
      f.input :moderation_status, as: :select, collection: Company.moderation_statuses.keys
      f.input :rejected_reason, input_html: { rows: 3 }
      f.input :status, as: :select, collection: %w[active inactive pending blocked]
      f.input :featured
      f.input :verified
      f.input :active_admin, as: :boolean, label: 'Ativar orçamentos (recurso pago)'
    if Company.column_names.include?('effect')
      f.input :effect, as: :boolean, label: 'Ativar efeito elétrico no card', input_html: { 
        'data-controller': 'effect', 
        'data-effect-target': 'checkbox', 
        'data-action': 'change->effect#toggleFromCheckbox' 
      }
    end

    if Company.column_names.include?('effect')
      f.inputs 'Visual Effects Preview' do
        f.template.concat(
          f.template.content_tag(
            :div,
            '',
            class: 'company-card admin-preview',
            data: { controller: 'effect', 'effect-active-value': f.object.effect }
          )
        )
      end
    end
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
      f.input :latitude
      f.input :longitude
    end

    f.inputs 'Business Details' do
      f.input :cnpj,
              required: false,
              input_html: { required: false, autocomplete: 'off' },
              hint: 'Opcional'
      f.input :founded_year
      f.input :employees_count
      f.input :project_types, as: :check_boxes, collection: Company::PROJECT_TYPES, label: 'Tipos de Projetos'
      f.input :services_offered, as: :check_boxes, collection: Company::SERVICES_OFFERED, label: 'Serviços Oferecidos'
      f.input :working_hours
      f.input :payment_methods
      f.input :minimum_ticket
      f.input :maximum_ticket
      f.input :response_time_sla
      f.input :languages
    end

    f.inputs 'Opções de Financiamento' do
      f.has_many :financing_options, allow_destroy: true, heading: false, new_record: 'Adicionar Opção' do |fo|
        fo.input :institution_name, label: 'Instituição'
        fo.input :credit_line, label: 'Linha de Crédito'
        fo.input :target_audience, as: :select, collection: %w[PF PJ Rural], label: 'Público Alvo'
        fo.input :interest_rate_percent, label: 'Taxa de Juros (%)', input_html: { step: 0.01 }
        fo.input :max_term_months, label: 'Prazo Máximo (meses)'
        fo.input :grace_period_months, label: 'Carência (meses)'
        fo.input :active, label: 'Ativo'
      end
    end

    f.inputs 'Financiamento (nova aba)' do
      f.input :financing_enabled, label: 'Habilitar Financiamento Premium'
      f.input :financing_tab_visible, label: 'Exibir aba de financiamento'
      f.template.concat(
        f.template.content_tag(:p, 'Configurações detalhadas (perfil, parceiros, ofertas) estão no menu Financiamento.')
      )
    end

    f.inputs 'Coverage & Certifications' do
      f.input :coverage_states
      f.input :coverage_cities
      f.input :certifications
      f.input :awards
      f.input :partner_brands
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
                begin
                  f.template.image_tag(url_for(asset), style: 'max-width: 100px; height: auto; border: 1px solid #ddd;')
                rescue StandardError => e
                  Rails.logger.warn("[Admin::Companies] Preview indisponivel media_asset=#{asset.id} company_id=#{f.object.id} error=#{e.class} #{e.message}")
                  f.template.content_tag(:span, 'Preview indisponivel')
                end
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
                collection: [['Sólido', 'solid'], ['Contorno', 'outline']],
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
      f.input :categories, as: :select, multiple: true, input_html: { class: 'select2-input' }, collection: Category.all.order(:name)
    end

    f.inputs 'Botões Personalizados' do
      f.has_many :company_buttons, allow_destroy: true, heading: false, sortable: :position, sortable_start: 1 do |cb|
        cb.input :label, label: 'Texto do Botão'
        cb.input :url, label: 'URL de Destino'
        cb.input :button_type, as: :select, collection: [['Primário (Azul)', 'primary'], ['WhatsApp (Verde)', 'whatsapp'], ['Secundário (Outline)', 'secondary'], ['Custom', 'custom']], include_blank: false
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

    if Company.column_names.include?('effect')
      panel 'Visual Effect Preview' do
        div class: 'company-card admin-preview', 'data-controller': 'effect', 'data-effect-active-value': resource.effect do
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
      row :project_types
      row :services_offered
      row :certifications
      row :featured
      row :verified
      row :social_proof_enabled if Company.column_names.include?('social_proof_enabled')
      row :status
      row :average_rating
      row :reviews_count
      row :categories do |company|
        company.categories.pluck(:name).join(', ')
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

    panel 'Galeria' do
      columns do
        column do
          panel 'Imagens' do
            if resource.media_assets.attached?
              ul do
                resource.media_assets.each do |img|
                  li do
                    begin
                      image_tag(url_for(img), style: 'max-width: 120px; height: auto;')
                    rescue StandardError
                      content_tag(:span, 'Preview indisponivel')
                    end
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
          link_to 'Rollback', rollback_admin_company_path(resource, version_id: v.id), method: :put, data: { confirm: 'Deseja reverter para esta versão?' } if v.event == 'update'
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
      redirect_to resource_path, alert: "Falha ao reverter versão."
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
    column :state
    column :city
    column :featured
    column :verified
    column(:effect) { |company| status_tag(company.effect ? 'On' : 'Off', class: company.effect ? 'ok' : 'warning') } if Company.column_names.include?('effect')
    column :status
    column :plan_status if Company.column_names.include?('plan_status')
    column :plan if Company.reflect_on_association(:plan)
    column :created_at
    actions
  end

  scope('Pendentes') { |scope| scope.where(status: 'pending') }

  member_action :approve, method: :put do
    resource.transaction do
      unless resource.approve!(current_admin_user)
        raise ActiveRecord::RecordInvalid.new(resource)
      end
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
    redirect_to resource_path(resource), notice: "Empresa aprovada com sucesso! E-mail enviado."
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
    
    reason = params[:reason].presence || "Informações inconsistentes"
    resource.transaction do
      unless resource.reject!(current_admin_user, reason)
        raise ActiveRecord::RecordInvalid.new(resource)
      end
      resource.update!(status: 'blocked') # or inactive
    end

    begin
      CompanyMailer.registration_rejected(resource, reason).deliver_later
    rescue StandardError => e
      Rails.logger.error("[Admin::Companies] registration_rejected failed company_id=#{resource.id} error=#{e.class} #{e.message}")
      flash[:alert] = 'Empresa reprovada, mas nao foi possivel enfileirar o email.'
    end
    redirect_to resource_path(resource), notice: "Empresa reprovada. E-mail enviado."
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
          if e.message.include?("missing keyword")
            flash[:error] = "Credenciais do storage não configuradas. Configure SPACES_ACCESS_KEY_ID e SPACES_SECRET_ACCESS_KEY no .env ou use ACTIVE_STORAGE_SERVICE=local"
            redirect_to edit_admin_company_path(resource) and return
          end
          raise
        end
      end

      super
    rescue ArgumentError => e
      if e.message.include?("unable to sign request") || e.message.include?("missing keyword") || e.message.include?("credentials")
        Rails.logger.error "[Upload Error] Missing storage credentials: #{e.message}"
        flash[:error] = "Erro de credenciais: Configure SPACES_ACCESS_KEY_ID e SPACES_SECRET_ACCESS_KEY ou use storage local"
        redirect_to edit_admin_company_path(resource)
      else
        raise
      end
    rescue => e
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
      begin
        company.update!(status: 'active')
        activated += 1
      rescue ActiveRecord::RecordInvalid => e
        errors << "#{company.id}: #{e.record.errors.full_messages.join(', ')}"
      end
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
  }, confirm: "Rejeitar empresas selecionadas?" do |ids, inputs|
    companies = batch_action_collection.where(id: ids)
    rejected = 0
    errors = []
    reason = inputs[:reason].presence || 'Informações inconsistentes'

    companies.find_each do |company|
      begin
        company.update!(status: 'blocked')
        CompanyMailer.registration_rejected(company, reason).deliver_later
        rejected += 1
      rescue ActiveRecord::RecordInvalid => e
        errors << "#{company.id}: #{e.record.errors.full_messages.join(', ')}"
      end
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
    if file.nil?
      redirect_to admin_companies_path, alert: 'Arquivo não enviado.' and return
    end

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
      errors << "linha #{line_number}: status inválido, definido como pending" if raw_status.present? && status == 'pending'
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

      cats = (row['categories'] || '').to_s.split(',').map { |c| c.strip }.reject(&:blank?)
      existing_categories = cats.any? ? Category.where(name: cats) : Category.none
      missing_categories = cats - existing_categories.pluck(:name)
      if missing_categories.any?
        errors << "linha #{line_number}: categorias ausentes: #{missing_categories.join(', ')}"
      end

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
