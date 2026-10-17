banner_position_options = [
  ['Hero Principal da Home (1330×230 px)', 'home_hero'],
  ['Topo Home (Legado 1200×160)', 'home_top'],
  ['Navbar (Topo Global)', 'navbar'],
  ['Sidebar legado/global', 'sidebar'],
  ['Topo Categorias', 'categories_top'],
  ['Topo Empresas', 'companies_top'],
  ['Rodapé Empresas', 'companies_footer'],
  ['Rodapé Artigo (Blog)', 'article_footer_cta'],
  ['Busca - Topo', 'search_top'],
  ['Busca - Meio dos Resultados', 'search_mid'],
  ['Categoria — Filtro lateral 300×250', 'categories_filter_sidebar'],
  ['Categoria — Coluna direita 300×600', 'categories_right_rail'],
  ['Empresas — Coluna direita 300×600', 'companies_right_rail'],
  ['Perfil Empresa - Inline (Sobre)', 'company_profile_about_inline'],
  ['Perfil Empresa - Carrossel (Relacionadas)', 'company_profile_related_carousel'],
  ['Perfil Empresa - Sidebar Patrocinada', 'company_profile_sidebar_sponsored'],
  ['Compare - Hero da Página', 'compare_hero'],
  ['Compare - Topo', 'compare_page_top'],
  ['Compare - Inline (Meio)', 'compare_page_inline'],
  ['Compare - Sidebar', 'compare_page_sidebar'],
  ['Compare - Bottom (Rodapé)', 'compare_page_bottom'],
  ['Comparação - Barra Flutuante (Patrocínio)', 'comparison_floating_bar'],
  ['Simulador de Financiamento - Micro Banner', 'financing_simulator_micro_banner']
].freeze

def safe_banner_image_tag(record, style: 'max-height: 80px; max-width: 160px; object-fit: contain; background: #f8fafc; border-radius: 4px;')
  return nil unless record.respond_to?(:image) && record.image.attached? && record.image.persisted?

  url = begin
    Rails.application.routes.url_helpers.rails_blob_path(record.image, only_path: true)
  rescue StandardError
    nil
  end
  return nil unless url.present?

  image_tag(url, style: style)
rescue StandardError
  nil
end

def safe_banner_mobile_image_tag(record, style: 'max-height: 80px; max-width: 160px; object-fit: contain; background: #f8fafc; border-radius: 4px;')
  return nil unless record.respond_to?(:image_mobile) && record.image_mobile.attached? && record.image_mobile.persisted?

  url = begin
    Rails.application.routes.url_helpers.rails_blob_path(record.image_mobile, only_path: true)
  rescue StandardError
    nil
  end
  return nil unless url.present?

  image_tag(url, style: style)
rescue StandardError
  nil
end

ActiveAdmin.register Banner do
  menu false
  permit_params do
    allowed = %i[title alt_text image image_mobile company_id financial_institution_id financing_option_id link active sponsored banner_type position
                 start_date end_date moderation_status priority rejected_reason width height slot_key
                 headline subtitle cta_label cta_href cta_enabled theme cta_variant
                 hero_background_color hero_text_color cta_background_color cta_text_color
                 overlay_variant creative_mode object_position_desktop_x object_position_desktop_y
                 object_position_mobile_x object_position_mobile_y whole_banner_clickable creative_version]
    if Banner.column_names.include?('target_states')
      allowed << :target_states
    end
    if Banner.column_names.include?('target_cities')
      allowed << :target_cities
    end
    allowed << { category_ids: [] }
    allowed
  end

  scope :all, default: true
  scope('Ativos agora', &:currently_active)
  scope('Aprovados') { |scope| scope.where(moderation_status: 'approved') }
  scope('Inativos') { |scope| scope.where(active: false) }
  scope('Agendados') { |scope| scope.where('start_date > ?', Time.current) }
  scope('Expirados') { |scope| scope.where('end_date < ?', Time.current) }

  index title: 'Gerenciamento de Banners' do
    selectable_column
    id_column
    column :title
    column :image do |banner|
      safe_banner_image_tag(banner)
    end
    column 'Status Operacional' do |banner|
      if !banner.active
        status_tag 'Inativo', class: 'important'
      elsif banner.moderation_status != 'approved'
        status_tag banner.moderation_status, class: 'warning'
      elsif banner.start_date && banner.start_date > Time.current
        status_tag 'Agendado', class: 'yes'
      elsif banner.end_date && banner.end_date < Time.current
        status_tag 'Expirado', class: 'important'
      else
        status_tag 'Ativo Agora', class: 'ok'
      end
    end
    column('Público-alvo', sortable: false) { |banner| [Array(banner.target_states).presence&.join(', '), Array(banner.target_cities).presence&.join(', '), banner.category&.name].compact.presence&.join(' · ') || 'Global' }
    column :position
    column :slot_key
    column :company
    column 'Tamanho' do |banner|
      "#{banner.width || '-'}x#{banner.height || '-'}"
    end
    column :priority
    actions
  end

  form do |f|
    tabs do
      tab '1. Identificação & Posição' do
        f.inputs 'Dados Básicos' do
          f.input :title, label: 'Nome Interno da Campanha', hint: 'Usado internamente para identificação no Admin (ex: "Hero - Campanha Verão 2026").'
          f.input :banner_type, as: :select, collection: [
            ['Retangular Grande (Hero / Topo / Destaque)', 'rectangular_large'],
            ['Retangular Pequeno', 'rectangular_small']
          ], include_blank: false
          f.input :position, as: :select, collection: banner_position_options, include_blank: false,
                             hint: 'Selecione "Hero Principal da Home" para veiculação no banner topo da home.'
          f.input :slot_key, label: 'Slot Key (Opcional)', hint: 'Chave técnica para injeção específica.'
          f.inputs 'Dimensões (px)' do
            f.input :width, input_html: { id: 'banner_width' }, hint: 'Padrão sugerido para home_hero: 1330'
            f.input :height, input_html: { id: 'banner_height' }, hint: 'Padrão sugerido para home_hero: 230'
          end
        end
      end

      tab '2. Conteúdo & Ação (Hero)' do
        f.inputs 'Modo Criativo & Tipografia' do
          f.input :creative_mode, as: :select, collection: [
            ['Foto com Textos e CTA em HTML (Recomendado: SEO, Acessibilidade e Nitidez)', 'photo_with_html'],
            ['Arte Publicitária Completa (Image Only - texto já desenhado na imagem)', 'image_only']
          ], include_blank: false, hint: 'No modo "Foto com HTML", o título e subtítulo são exibidos com contraste garantido. No modo "Image Only", os textos visuais são ocultados na tela.'
          f.input :headline, label: 'Título Principal (Headline)', hint: 'Texto público principal de impacto (máx. 110 caracteres).'
          f.input :subtitle, as: :text, input_html: { rows: 2 }, label: 'Subtítulo / Contexto', hint: 'Mensagem de apoio e persuasão (máx. 180 caracteres).'
        end

        f.inputs 'Botão de Ação (CTA)' do
          f.input :cta_enabled, as: :boolean, label: 'Exibir Botão de Ação (CTA)?'
          f.input :cta_label, label: 'Texto do Botão', hint: 'Ex: "Simular Economia", "Ver Empresas Avaliadas" (máx. 36 caracteres).'
          f.input :cta_href, label: 'Link de Destino do Botão', hint: 'Caminho interno (/calculadora) ou URL externa (https://...).'
          f.input :whole_banner_clickable, as: :boolean, label: 'Tornar todo o banner clicável além do botão?'
          f.input :link, label: 'Link de Destino Alternativo (Legado)', hint: 'Usado como destino fallback caso cta_href esteja em branco.'
        end
      end

      tab '3. Aparência & Cores' do
        f.inputs 'Estilização Visual' do
          f.input :theme, as: :select, collection: [
            ['Tema Escuro (Texto Branco)', 'dark'],
            ['Tema Claro (Texto Escuro)', 'light']
          ], include_blank: false
          f.input :cta_variant, as: :select, collection: [
            ['Amarelo Solar (Destaque)', 'solar_yellow'],
            ['Azul Primário', 'primary_blue'],
            ['Contorno / Outline', 'outline'],
            ['Personalizado (usar cores HEX abaixo)', 'custom']
          ], include_blank: false
          f.input :overlay_variant, as: :select, collection: [
            ['Gradiente Suave à Esquerda (Recomendado)', 'left_soft'],
            ['Gradiente Forte à Esquerda (Mais contraste)', 'left_strong'],
            ['Sem Gradiente (Totalmente Transparente)', 'none']
          ], include_blank: false
        end

        f.inputs 'Cores Personalizadas (#RRGGBB)' do
          f.input :hero_background_color, label: 'Cor de Fundo Sólida (Opcional)', placeholder: '#0B132B', hint: 'Código HEX de 6 dígitos. Ex: #0B132B'
          f.input :hero_text_color, label: 'Cor do Título (Headline)', placeholder: '#FFFFFF', hint: 'Deixe vazio para herdar do tema.'
          f.input :cta_background_color, label: 'Fundo do Botão (Modo Personalizado)', placeholder: '#EAB308'
          f.input :cta_text_color, label: 'Texto do Botão (Modo Personalizado)', placeholder: '#0F172A'
        end
      end

      tab '4. Mídia Responsiva' do
        f.inputs 'Imagens Art-Directed' do
          f.input :image, as: :file, label: 'Imagem Principal Desktop (1330×230 px)',
                          hint: safe_banner_image_tag(f.object, style: 'max-height: 120px; border-radius: 6px;') || 'Recomendado: 1330×230 px (JPG, PNG ou WebP até 10 MB).',
                          input_html: { direct_upload: true, accept: 'image/*' }
          f.input :object_position_desktop_x, label: 'Ponto Focal Desktop X (%)', hint: '0 = Esquerda, 50 = Centro, 100 = Direita'
          f.input :object_position_desktop_y, label: 'Ponto Focal Desktop Y (%)', hint: '0 = Topo, 50 = Centro, 100 = Base'

          f.input :image_mobile, as: :file, label: 'Imagem Opcional Mobile (780×460 px)',
                                 hint: safe_banner_mobile_image_tag(f.object, style: 'max-height: 100px; border-radius: 6px;') || 'Opcional: formato vertical para smartphones (780×460 px).',
                                 input_html: { direct_upload: true, accept: 'image/*' }
          f.input :object_position_mobile_x, label: 'Ponto Focal Mobile X (%)', hint: '0 = Esquerda, 50 = Centro, 100 = Direita'
          f.input :object_position_mobile_y, label: 'Ponto Focal Mobile Y (%)', hint: '0 = Topo, 50 = Centro, 100 = Base'
          f.input :alt_text, label: 'Texto Alternativo da Imagem (Acessibilidade)', hint: 'Descreva objetivamente o conteúdo visual da imagem.'
        end
      end

      tab '5. Segmentação & Moderação' do
        f.inputs 'Segmentação Comercial' do
          f.input :company, label: 'Empresa Proprietária (Opcional)', hint: 'Se selecionado, o banner será vinculado à performance desta empresa.'
          f.input :financial_institution, label: 'Instituição Financeira (Opcional)'
          f.input :financing_option, label: 'Opção de Financiamento (Opcional)'
          f.input :categories, as: :check_boxes, collection: Category.order(:name), label: 'Categorias Alvo'
          if Banner.column_names.include?('target_states')
            f.input :target_states, as: :string,
                                    input_html: { value: Array(f.object.target_states).join(', ') },
                                    label: 'Estados Alvo (Sigla)', hint: 'Ex: SP, RJ'
          end
          if Banner.column_names.include?('target_cities')
            f.input :target_cities, as: :string,
                                    input_html: { value: Array(f.object.target_cities).join(', ') },
                                    label: 'Cidades Alvo', hint: 'Ex: São Paulo, Campinas'
          end
          f.input :sponsored, label: 'Banner Patrocinado / Anúncio Comercial?'
          f.input :priority, label: 'Prioridade de Rotação (1-1000)', hint: 'Valores menores têm prioridade.'
        end

        f.inputs 'Agendamento & Moderação' do
          f.input :moderation_status, as: :select, collection: Banner::MODERATION_STATUSES, include_blank: false,
                                      selected: f.object.new_record? ? 'approved' : f.object.moderation_status
          f.input :active, label: 'Ativo (Disponível para veiculação)'
          f.input :start_date, as: :datetime_picker, label: 'Início da Veiculação'
          f.input :end_date, as: :datetime_picker, label: 'Fim da Veiculação'
        end
      end
    end

    script do
      raw <<~JS
        (function() {
          function setDefaultsForPosition(position) {
            if (position === 'home_hero') return { w: 1330, h: 230 };
            if (position === 'home_top') return { w: 1200, h: 160 };
            if (position === 'navbar') return { w: 960, h: 100 };
            if (position === 'sidebar') return { w: 150, h: 125 };
            if (position === 'companies_footer' || position === 'article_footer_cta') return { w: 1200, h: 160 };
            if (position === 'search_top') return { w: 1200, h: 180 };
            if (position === 'search_mid') return { w: 1200, h: 160 };
            if (position === 'categories_filter_sidebar') return { w: 300, h: 250 };
            if (position === 'categories_right_rail' || position === 'companies_right_rail') return { w: 300, h: 600 };
            if (position === 'company_profile_about_inline' || position === 'company_profile_related_carousel') return { w: 1200, h: 160 };
            if (position === 'company_profile_sidebar_sponsored') return { w: 300, h: 600 };
            if (position === 'compare_hero') return { w: 1200, h: 300 };
            if (position === 'compare_page_top' || position === 'compare_page_inline' || position === 'compare_page_bottom') return { w: 1200, h: 160 };
            if (position === 'compare_page_sidebar') return { w: 300, h: 600 };
            if (position === 'comparison_floating_bar') return { w: 720, h: 120 };
            return { w: 600, h: 200 };
          }

          document.addEventListener('DOMContentLoaded', function() {
            var pos = document.getElementById('banner_position');
            var w = document.getElementById('banner_width');
            var h = document.getElementById('banner_height');

            if (pos) {
              pos.addEventListener('change', function() {
                if (w && h) {
                  var d = setDefaultsForPosition(pos.value);
                  w.value = d.w;
                  h.value = d.h;
                }
              });
            }
          });
        })();
      JS
    end
    f.actions
  end

  show do
    attributes_table do
      row :id
      row :title
      row :headline
      row :subtitle
      row :creative_mode
      row :alt_text
      row 'Status Operacional' do |banner|
        if !banner.active
          status_tag 'Inativo', class: 'important'
        elsif banner.moderation_status != 'approved'
          status_tag banner.moderation_status, class: 'warning'
        elsif banner.start_date && banner.start_date > Time.current
          status_tag 'Agendado', class: 'yes'
        elsif banner.end_date && banner.end_date < Time.current
          status_tag 'Expirado', class: 'important'
        else
          status_tag 'Ativo Agora', class: 'ok'
        end
      end
      row 'Imagem Desktop (1330×230)' do |banner|
        safe_banner_image_tag(banner, style: 'max-width: 100%; height: auto; border: 1px solid #eee; border-radius: 8px;')
      end
      row 'Imagem Mobile (780×460)' do |banner|
        safe_banner_mobile_image_tag(banner, style: 'max-width: 320px; height: auto; border: 1px solid #eee; border-radius: 8px;')
      end
      row :cta_label
      row :cta_href
      row :cta_enabled
      row :whole_banner_clickable
      row :theme
      row :cta_variant
      row :overlay_variant
      row :hero_background_color
      row :hero_text_color
      row :cta_background_color
      row :cta_text_color
      row :creative_version
      row :link do |banner|
        link_to banner.link, banner.link, target: '_blank' if banner.link.present?
      end
      row :position
      row('Status operacional') { |banner| banner.operational_status }
      row :slot_key
      row :company
      row :financial_institution
      row :financing_option
      row :categories do |banner|
        banner.categories.pluck(:name).join(', ')
      end
      if Banner.column_names.include?('target_states')
        row :target_states do |banner|
          Array(banner.target_states).join(', ')
        end
      end
      if Banner.column_names.include?('target_cities')
        row :target_cities do |banner|
          Array(banner.target_cities).join(', ')
        end
      end
      row :banner_type
      row :dimensions do |banner|
        "#{banner.width}x#{banner.height} px"
      end
      row :start_date
      row :end_date
      row :priority
      row :moderation_status
      row :approved_by_admin_user
      row :approved_at
      row :rejected_reason do |banner|
        banner.rejected_reason if banner.moderation_status == 'rejected'
      end
      row :created_at
      row :updated_at
    end

    panel 'HISTÓRICO DE AUDITORIA' do
      audit_logs = resource.banner_audit_logs.order(created_at: :desc).limit(20)
      if audit_logs.any?
        table_for audit_logs do
          column 'Data' do |log|
            log.created_at.strftime('%d/%m/%Y %H:%M:%S')
          end
          column 'Ação', :action
          column 'Responsável' do |log|
            log.actor ? "#{log.actor.class.name} ##{log.actor_id}" : 'Sistema'
          end
          column 'Alterações' do |log|
            pre JSON.pretty_generate(log.changes_json), style: 'max-height: 150px; overflow: auto; font-size: 11px;'
          end
          column 'IP', :ip_address
        end
      else
        div 'Nenhum registro de auditoria encontrado.', style: 'padding: 10px; color: #666;'
      end
    end

    panel 'PERFORMANCE' do
      begin
        perf = BannerAnalytics::PerformanceService.call(resource.id)
        metrics = perf[:metrics]
        
        attributes_table_for resource do
          row 'Impressões' do
            number_with_delimiter(metrics[:impressions], delimiter: '.')
          end
          row 'Cliques' do
            number_with_delimiter(metrics[:clicks], delimiter: '.')
          end
          row 'CTR' do
            "#{metrics[:ctr]}%"
          end
          row 'Leads' do
            number_with_delimiter(metrics[:leads], delimiter: '.')
          end
          row 'Taxa de Conversão' do
            "#{metrics[:conversion_rate]}%"
          end
          row 'Investimento' do
            number_to_currency(metrics[:investment], unit: 'R$ ', separator: ',', delimiter: '.')
          end
          row 'CPC' do
            number_to_currency(metrics[:cpc], unit: 'R$ ', separator: ',', delimiter: '.')
          end
        end
      rescue StandardError => e
        div "Erro ao carregar métricas: #{e.message}", class: 'flash flash_error'
      end
    end

    panel 'ADD-ONS ATIVOS' do
      active_subs = resource.banner_addon_subscriptions.where(status: 'active')
      if active_subs.any?
        table_for active_subs do
          column :banner_addon
          column :starts_at
          column :ends_at
          column '' do |sub|
            link_to 'Ver', admin_banner_addon_subscription_path(sub)
          end
        end
      else
        div 'Nenhum add-on ativo neste banner.', style: 'padding: 10px; color: #666;'
      end
    end
  end

  filter :title
  filter :headline
  filter :company
  filter :moderation_status
  filter :banner_type
  filter :position, as: :select, collection: banner_position_options
  filter :creative_mode, as: :select, collection: [['Foto com HTML', 'photo_with_html'], ['Image Only', 'image_only']]
  filter :categories
  filter :link
  filter :active
  filter :sponsored
  filter :slot_key
  filter :priority
  filter :start_date
  filter :end_date
  filter :created_at

  action_item :approve, only: :show do
    if resource.respond_to?(:moderation_status) && resource.moderation_status == 'submitted'
      link_to 'Aprovar Banner', approve_admin_banner_path(resource), method: :put
    end
  end

  action_item :reject, only: :show do
    if resource.respond_to?(:moderation_status) && resource.moderation_status == 'submitted'
      link_to 'Rejeitar Banner', reject_admin_banner_path(resource), method: :put
    end
  end

  controller do
    def update
      if params[:banner].present?
        params[:banner].delete(:image) if params[:banner][:image].blank?
        params[:banner].delete(:image_mobile) if params[:banner][:image_mobile].blank?
        params[:banner][:company_id] = nil if params[:banner][:company_id].blank?
        unless Banner.column_names.include?('target_states')
          params[:banner].delete(:target_states)
        end
        unless Banner.column_names.include?('target_cities')
          params[:banner].delete(:target_cities)
        end
        if params[:banner][:category_ids].is_a?(Array)
          params[:banner][:category_ids] = params[:banner][:category_ids].reject(&:blank?).map(&:to_i)
        end
      end
      super do |success, failure|
        success.html do
          if resource.saved_changes?
            resource.update_column(:creative_version, (resource.creative_version || 1) + 1)
            BannerAuditLog.create(
              auditable: resource,
              actor: current_admin_user,
              source: 'active_admin',
              action: 'update',
              changes_json: resource.saved_changes.except('updated_at', 'creative_version'),
              ip_address: request.remote_ip,
              metadata_json: { user_agent: request.user_agent }
            ) rescue nil
          end
          redirect_to resource_path(resource), notice: 'Banner atualizado com sucesso.'
        end
      end
    end

    def create
      if params[:banner].present?
        params[:banner].delete(:image_mobile) if params[:banner][:image_mobile].blank?
        params[:banner][:company_id] = nil if params[:banner][:company_id].blank?
        unless Banner.column_names.include?('target_states')
          params[:banner].delete(:target_states)
        end
        unless Banner.column_names.include?('target_cities')
          params[:banner].delete(:target_cities)
        end
        if params[:banner][:category_ids].is_a?(Array)
          params[:banner][:category_ids] = params[:banner][:category_ids].reject(&:blank?).map(&:to_i)
        end
      end
      super do |success, failure|
        success.html do
          BannerAuditLog.create(
            auditable: resource,
            actor: current_admin_user,
            source: 'active_admin',
            action: 'create',
            changes_json: resource.attributes.slice('title', 'position', 'headline', 'active', 'moderation_status'),
            ip_address: request.remote_ip,
            metadata_json: { user_agent: request.user_agent }
          ) rescue nil
          redirect_to resource_path(resource), notice: 'Banner criado com sucesso.'
        end
      end
    end
  end

  member_action :approve, method: :put do
    resource.approve!(current_admin_user)
    redirect_to resource_path(resource), notice: 'Banner aprovado.'
  end

  member_action :reject, method: :put do
    reason = params[:reason].presence || 'Reprovado na moderação'
    resource.reject!(current_admin_user, reason)
    redirect_to resource_path(resource), notice: 'Banner rejeitado.'
  end
end
