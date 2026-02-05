ActiveAdmin.register Article do
  permit_params :title, :slug, :content, :excerpt, :meta_title, :meta_description, :published_at,
                :status, :featured, :category_id, :author_id, :product_id, :banner,
                :sponsored, :sponsored_label, :views_count,
                company_ids: []

  controller do
    rescue_from ActiveRecord::RecordNotFound do |e|
      Rails.logger.error("ActiveAdmin Article Not Found: #{e.message} | ID: #{params[:id]}")
      redirect_to admin_articles_path, alert: "Artigo não encontrado. O ID fornecido (#{params[:id]}) é inválido ou o artigo foi excluído."
    end

    def find_resource
      scoped_collection.friendly.find(params[:id])
    end
  end

  filter :title
  filter :status, as: :select, collection: [['Rascunho', 'draft'], ['Publicado', 'published']]
  filter :category
  filter :created_at

  index do
    selectable_column
    id_column
    column :title
    column :category
    column :product
    column :status do |article|
      status_tag article.status
    end
    column :sponsored
    column :sponsored_label
    column :published_at
    column :views_count
    column :banner do |article|
      if article.banner.attached?
        image_tag article.banner.variant(resize_to_limit: [120, 80])
      end
    end
    actions
  end

  show do
    attributes_table do
      row :title
      row :slug
      row :category
      row :product
      row :status do |article|
        status_tag article.status
      end
      row :sponsored
      row :sponsored_label
      row :published_at
      row :featured
      row :views_count
      row :excerpt
      row :content do |article|
        raw article.content
      end
      row :meta_description
      row :banner do |article|
        if article.banner.attached?
          image_tag article.banner.variant(resize_to_limit: [640, 360])
        else
          status_tag 'Sem imagem', :warning
        end
      end
    end
    active_admin_comments
  end

  form do |f|
    tabs do
      tab 'Conteúdo' do
        f.inputs 'Detalhes Principais' do
          f.input :title
          f.input :banner,
                  as: :file,
                  hint: f.object.banner.attached? ? image_tag(f.object.banner.variant(resize_to_limit: [320, 180]), height: '100') : 'Upload de imagem (JPEG, PNG ou GIF) até 5MB. Sugerido 1200x630px',
                  input_html: { accept: 'image/jpeg,image/png,image/gif' }
          f.input :slug, hint: 'Deixe em branco para gerar automaticamente a partir do título'
          f.input :category
          f.input :product
          f.input :status, as: :select, collection: [['Rascunho', 'draft'], ['Publicado', 'published']], include_blank: false
          f.input :published_at, as: :datepicker
          f.input :featured, label: 'Destaque?'
          f.input :sponsored, label: 'Patrocinado?'
          f.input :sponsored_label, hint: 'Ex.: Oferta patrocinada, Conteúdo de marca'
          f.input :author, as: :select, collection: AdminUser.all.collect { |u| [u.name || u.email, u.id] }, include_blank: true
        end

        f.inputs 'Texto' do
          f.input :excerpt, input_html: { rows: 3 }, hint: 'Resumo curto para listagens e cards'
          f.input :content, as: :quill_editor
        end
      end

      tab 'Relacionamentos' do
        f.inputs 'Empresas Relacionadas' do
          f.input :companies, as: :check_boxes, collection: Company.all
        end
      end

      tab 'SEO' do
        f.inputs 'Otimização para Buscas' do
          f.input :meta_title, hint: 'Título que aparece na aba do navegador e no Google (máx 60 chars)'
          f.input :meta_description, input_html: { rows: 3 }, hint: 'Descrição para resultados de busca (máx 160 chars)'
        end
      end
    end
    f.actions
  end
end
