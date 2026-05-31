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
  ['Compare - Topo', 'compare_page_top'],
  ['Compare - Inline (Meio)', 'compare_page_inline'],
  ['Compare - Sidebar', 'compare_page_sidebar'],
  ['Compare - Bottom (Rodapé)', 'compare_page_bottom']
].freeze

ActiveAdmin.register Banner do
  permit_params :title, :image, :company_id, :link, :active, :sponsored, :banner_type, :position,
                :start_date, :end_date, :moderation_status, :priority, :rejected_reason,
                :width, :height, :slot_key, category_ids: []

  scope :all, default: true
  scope('Ativos agora') { |scope| scope.currently_active }
  scope('Aprovados') { |scope| scope.where(moderation_status: 'approved') }
  scope('Inativos') { |scope| scope.where(active: false) }
  scope('Agendados') { |scope| scope.where('start_date > ?', Time.current) }
  scope('Expirados') { |scope| scope.where('end_date < ?', Time.current) }

  index title: 'Gerenciamento de Banners' do
    selectable_column
    id_column
    column :title
    column :image do |banner|
      if banner.image.attached?
        image_tag url_for(banner.image),
                  style: "max-height: 80px; max-width: 160px; object-fit: contain; background: #f8fafc; border-radius: 4px;"
      end
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
          f.input :link, label: 'Link de Destino', placeholder: 'https://...'
          f.input :image, as: :file,
                          hint: f.object.image.attached? ? image_tag(url_for(f.object.image), style: 'max-height: 100px') : 'Upload da imagem (PNG, JPG, WebP)',
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
          f.input :sponsored, label: 'Banner Patrocinado?'
          f.input :priority, label: 'Prioridade (1-1000)', hint: 'Valores menores aparecem primeiro (ex: 1 > 10).'
        end
      end

      tab 'Agendamento & Moderação' do
        f.inputs 'Controle' do
          f.input :moderation_status, as: :select, collection: Banner::MODERATION_STATUSES, include_blank: false
          f.input :active, label: 'Ativo (Visível se aprovado)'
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
            if (position === 'compare_page_top' || position === 'compare_page_inline' || position === 'compare_page_bottom') return { w: 1200, h: 160 };
            if (position === 'compare_page_sidebar') return { w: 300, h: 600 };
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
        if banner.image.attached?
          image_tag url_for(banner.image),
                    style: "max-width: 100%; height: auto; border: 1px solid #eee; border-radius: 8px;"
        end
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
      row :rejected_reason if resource.moderation_status == 'rejected'
      row :created_at
      row :updated_at
    end
  end
  # Defina filtros apenas para atributos simples
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
