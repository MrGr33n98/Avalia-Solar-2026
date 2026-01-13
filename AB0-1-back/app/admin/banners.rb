  ActiveAdmin.register Banner do
    permit_params :title, :image, :company_id, :link, :active, :sponsored, :banner_type, :position,
                  :start_date, :end_date, :moderation_status, :priority, :rejected_reason,
                  :width, :height, category_ids: []

    index do
      selectable_column
      id_column
      column :title
      column :image do |banner|
        if banner.image.attached?
          image_tag url_for(banner.image),
                    style: "max-height: #{[banner.height || 100, 120].min}px; max-width: 240px; object-fit: contain; background: #f8fafc; border-radius: 8px;"
        end
      end
      column :company
      column :moderation_status
      column :banner_type
      column :position
      column 'Tamanho' do |banner|
        "#{banner.width || '-'}x#{banner.height || '-'}"
      end
      column :start_date
      column :end_date
      column :active
      column :sponsored
      column :categories do |banner|
        banner.categories.order(:name).pluck(:name).join(', ')
      end
      column :link
      column :created_at
      actions
    end

    form do |f|
      f.inputs 'Detalhes do Banner' do
        f.input :title
        f.input :image, as: :file,
                        hint: f.object.image.attached? ? image_tag(url_for(f.object.image), style: 'max-height: 100px') : 'Arraste e solte a imagem aqui ou clique para selecionar',
                        input_html: {
                          direct_upload: true,
                          accept: 'image/*'
                        }
        f.input :banner_type, as: :select, collection: [
          ['Retangular Grande', 'rectangular_large'],
          ['Retangular Pequeno', 'rectangular_small']
        ]
        f.input :position, as: :select, collection: [
          %w[Navbar navbar],
          %w[Sidebar sidebar],
          ['Topo Categorias', 'categories_top'],
          ['Topo Home', 'home_top'],
          ['Topo Empresas', 'companies_top']
        ]

        f.inputs 'Tamanho (px)' do
          f.input :width, as: :number, input_html: { min: 1, step: 1, id: 'banner_width' },
                          hint: 'Largura máxima de exibição (padrão = metade do tamanho anterior).'
          f.input :height, as: :number, input_html: { min: 1, step: 1, id: 'banner_height' },
                          hint: 'Altura máxima de exibição (padrão = metade do tamanho anterior).'
        end

        f.input :company
        f.input :moderation_status, as: :select, collection: Banner::MODERATION_STATUSES, include_blank: false if Banner.const_defined?(:MODERATION_STATUSES)
        f.input :priority

        f.inputs 'Exibir em categorias' do
          f.input :categories, as: :check_boxes, collection: Category.order(:name),
                              hint: 'Se nenhuma categoria for selecionada, o banner pode ser tratado como global (dependendo do endpoint).'
        end

        f.input :link
        f.input :start_date, as: :datetime_select
        f.input :end_date, as: :datetime_select
        f.input :active
        f.input :sponsored
      end

      f.inputs 'Pré-visualização' do
        if f.object.image.attached?
          div id: 'banner_preview_wrapper', style: 'padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc;' do
            para 'Prévia respeitando o tamanho configurado (sem corte).', style: 'margin: 0 0 8px 0; color: #475569;'
            img id: 'banner_preview_image',
                src: url_for(f.object.image),
                style: "display:block; max-width: #{(f.object.width || 600)}px; max-height: #{(f.object.height || 200)}px; width: 100%; height: auto; object-fit: contain; border-radius: 10px; background: #ffffff;"
          end
        else
          para 'Faça upload de uma imagem para ver a prévia.', style: 'color: #64748b;'
        end

        script do
          raw <<~JS
            (function() {
              function setDefaultsForPosition(position) {
                // Defaults = half of previous sizes used historically in the project
                if (position === 'navbar') return { w: 960, h: 100 };
                if (position === 'sidebar') return { w: 150, h: 125 };
                return { w: 600, h: 200 }; // categories_top/home_top/companies_top and fallback
              }

              function syncPreview() {
                var img = document.getElementById('banner_preview_image');
                if (!img) return;
                var w = document.getElementById('banner_width');
                var h = document.getElementById('banner_height');
                var width = w && w.value ? parseInt(w.value, 10) : null;
                var height = h && h.value ? parseInt(h.value, 10) : null;
                if (width) img.style.maxWidth = width + 'px';
                if (height) img.style.maxHeight = height + 'px';
              }

              function maybeSetDefaultDimensions() {
                var pos = document.getElementById('banner_position');
                var w = document.getElementById('banner_width');
                var h = document.getElementById('banner_height');
                if (!pos || !w || !h) return;
                if (w.value || h.value) return; // don't override user input
                var d = setDefaultsForPosition(pos.value);
                w.value = d.w;
                h.value = d.h;
                syncPreview();
              }

              document.addEventListener('DOMContentLoaded', function() {
                maybeSetDefaultDimensions();

                var pos = document.getElementById('banner_position');
                var w = document.getElementById('banner_width');
                var h = document.getElementById('banner_height');

                if (pos) {
                  pos.addEventListener('change', function() {
                    // only set defaults when fields are empty to keep it predictable
                    if (w && h && !w.value && !h.value) {
                      var d = setDefaultsForPosition(pos.value);
                      w.value = d.w;
                      h.value = d.h;
                    }
                    syncPreview();
                  });
                }
                if (w) w.addEventListener('input', syncPreview);
                if (h) h.addEventListener('input', syncPreview);
              });
            })();
          JS
        end
      end
      f.actions
    end

    show do
      attributes_table do
        row :id
        row :title
        row :image do |banner|
          if banner.image.attached?
            image_tag url_for(banner.image),
                      style: "max-width: #{banner.width || 600}px; max-height: #{banner.height || 200}px; width: 100%; height: auto; object-fit: contain; background: #f8fafc; border-radius: 12px; padding: 8px;"
          end
        end
        row :company
        row :moderation_status
        row :approved_by_admin_user
        row :approved_at
        row :rejected_reason
        row :banner_type
        row :position
        row(:width) { |banner| banner.width || '-' }
        row(:height) { |banner| banner.height || '-' }
        row :start_date
        row :end_date
        row :categories do |banner|
          banner.categories.order(:name).pluck(:name).join(', ')
        end
        row :link
        row :active
        row :sponsored
        row :created_at
        row :updated_at
      end
    end
    # Defina filtros apenas para atributos simples
    filter :title
    filter :company
    filter :moderation_status
    filter :banner_type
    filter :position
    filter :categories
    filter :link
    filter :active
    filter :sponsored
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
