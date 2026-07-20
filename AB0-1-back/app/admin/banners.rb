banner_position_options = [
  ['Navbar (Topo Global)', 'navbar'],
  ['Sidebar (Lateral genérica)', 'sidebar'],
  ['Topo Categorias', 'categories_top'],
  ['Topo Home', 'home_top'],
  ['Topo Empresas', 'companies_top'],
  ['Rodapé Empresas', 'companies_footer'],
  ['Rodapé Artigo (Blog)', 'article_footer_cta'],
  ['Busca - Topo', 'search_top'],
  ['Busca - Meio dos Resultados', 'search_mid'],
  ['Categorias - Lateral dos Filtros', 'categories_filter_sidebar'],
  ['Categorias - Coluna Direita', 'categories_right_rail'],
  ['Empresas - Coluna Direita', 'companies_right_rail'],
  ['Perfil Empresa - Inline (Sobre)', 'company_profile_about_inline'],
  ['Perfil Empresa - Carrossel (Relacionadas)', 'company_profile_related_carousel'],
  ['Perfil Empresa - Sidebar Patrocinada', 'company_profile_sidebar_sponsored'],
  ['Compare - Hero da Página', 'compare_hero'],
  ['Compare - Topo', 'compare_page_top'],
  ['Compare - Inline (Meio)', 'compare_page_inline'],
  ['Compare - Sidebar', 'compare_page_sidebar'],
  ['Compare - Bottom (Rodapé)', 'compare_page_bottom'],
  ['Comparação - Barra Flutuante (Patrocínio)', 'comparison_floating_bar']
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

ActiveAdmin.register Banner do
  permit_params do
    allowed = %i[title alt_text image company_id link active sponsored banner_type position
                 start_date end_date moderation_status priority rejected_reason width height slot_key]
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
      tab 'Geral & Criativo' do
        f.inputs 'Identificação' do
          f.input :title, label: 'Título do Banner (Interno)'
          f.input :alt_text, label: 'Texto alternativo da imagem',
                             hint: 'Descreva objetivamente a imagem para leitores de tela.'
          f.input :link, label: 'Link de Destino', placeholder: 'https://...'
          f.input :image, as: :file,
                          hint: safe_banner_image_tag(f.object, style: 'max-height: 100px;') || 'Upload da imagem (PNG, JPG, WebP)',
                          input_html: { direct_upload: true, accept: 'image/*' }
        end

        f.inputs 'Configurações de Layout' do
          f.input :banner_type, as: :select, collection: [
            ['Retangular Grande (6:1 / 4:1)', 'rectangular_large'],
            ['Retangular Pequeno', 'rectangular_small']
          ], include_blank: false

          f.input :position, as: :select, collection: banner_position_options, include_blank: false

          f.input :slot_key, label: 'Slot Key (Opcional)',
                             hint: 'Chave técnica para injeção em locais específicos (ex: home_hero, sponsored_v2)'

          f.inputs 'Dimensões (px)' do
            f.input :width, input_html: { id: 'banner_width' }, hint: 'Padrão sugerido pela posição'
            f.input :height, input_html: { id: 'banner_height' }, hint: 'Padrão sugerido pela posição'
          end
        end
      end

      tab 'Targeting (Segmentação)' do
        f.inputs 'Audiência' do
          f.input :company, label: 'Empresa Proprietária (Opcional)',
                            hint: 'Se selecionado, o banner será vinculado à performance desta empresa.'
          f.input :categories, as: :check_boxes, collection: Category.order(:name),
                               label: 'Exibir nestas categorias',
                               hint: 'Deixe vazio para exibição global (se a posição permitir).'
          if Banner.column_names.include?('target_states')
            f.input :target_states, as: :string,
                                    input_html: { value: Array(f.object.target_states).join(', ') },
                                    label: 'Estados Alvo (Sigla)',
                                    hint: 'Separe múltiplos estados por vírgula. Ex: SP, RJ. Deixe vazio para todos.'
          end
          if Banner.column_names.include?('target_cities')
            f.input :target_cities, as: :string,
                                    input_html: { value: Array(f.object.target_cities).join(', ') },
                                    label: 'Cidades Alvo',
                                    hint: 'Separe múltiplas cidades por vírgula. Ex: São Paulo, Campinas. Deixe vazio para todas.'
          end
          f.input :sponsored, label: 'Banner Patrocinado?'
          f.input :priority, label: 'Prioridade (1-1000)', hint: 'Valores menores aparecem primeiro (ex: 1 > 10).'
        end
      end

      tab 'Agendamento & Moderação' do
        f.inputs 'Controle' do
          f.input :moderation_status, as: :select, collection: Banner::MODERATION_STATUSES, include_blank: false, selected: f.object.new_record? ? 'approved' : f.object.moderation_status
          f.input :active, label: 'Ativo (Visível se aprovado)', input_html: { checked: f.object.new_record? ? true : (f.object.active.nil? ? true : f.object.active) }
          f.input :start_date, as: :datetime_picker, label: 'Início da Exibição'
          f.input :end_date, as: :datetime_picker, label: 'Fim da Exibição'
        end
      end
    end

    script do
      raw <<~JS
        (function() {
          function setDefaultsForPosition(position) {
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
      row :image do |banner|
        safe_banner_image_tag(banner, style: 'max-width: 100%; height: auto; border: 1px solid #eee; border-radius: 8px;')
      end
      row :link do |banner|
        link_to banner.link, banner.link, target: '_blank' if banner.link.present?
      end
      row :position
      row :slot_key
      row :company
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
  end

  filter :title
  filter :company
  filter :moderation_status
  filter :banner_type
  filter :position, as: :select, collection: banner_position_options
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
      super
    end

    def create
      if params[:banner].present?
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
      super
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
