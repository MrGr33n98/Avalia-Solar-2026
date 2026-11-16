# frozen_string_literal: true

# The institutional carousel is NOT the sponsored Banner/Ads resource.
ActiveAdmin.register CompanyHeroSlide do
  menu label: 'Hero da Marca', priority: 12

  permit_params :company_id, :slot, :alt_text, :image

  filter :company
  filter :status, as: :select, collection: CompanyHeroSlide::STATUSES
  filter :slot

  index do
    selectable_column
    id_column
    column :company
    column :slot
    column :display_position
    column :revision
    column :status do |slide|
      status_tag slide.status
    end
    column :image do |slide|
      if slide.image.attached?
        image_tag(url_for(slide.image), width: 130, style: 'height: auto;')
      else
        'Sem imagem'
      end
    end
    column :updated_at
    actions
  end

  show do
    attributes_table do
      row :company
      row :slot
      row :display_position
      row :revision
      row :status
      row :source
      row :alt_text
      row :image_width
      row :image_height
      row :image_format
      row :image_bytes
      row :created_by_id
      row :reviewed_by_id
      row :approved_at
      row :published_at
      row :rejection_reason
      row :image do |slide|
        slide.image.attached? ? image_tag(url_for(slide.image), style: 'max-width: 600px; height: auto;') : 'Sem imagem'
      end
    end
    active_admin_comments
  end

  form html: { multipart: true } do |f|
    f.semantic_errors
    f.inputs 'Imagem institucional — até três posições (não é anúncio)' do
      if f.object.new_record?
        f.input :company, collection: Company.order(:name).limit(500)
        f.input :slot, as: :select, collection: [1, 2, 3]
      else
        f.input :company_id, input_html: { disabled: true }
        f.input :slot, input_html: { disabled: true }
      end
      f.input :image, as: :file,
              hint: 'PNG/JPEG/WebP, máximo 5 MB, mínimo 800×200; mesma proporção dos demais slides'
      f.input :alt_text, hint: 'Descrição objetiva da imagem (máximo 160 caracteres)'
    end
    f.actions
  end

  action_item :submit_for_review, only: :show, if: proc { %w[draft rejected].include?(resource.status) } do
    link_to 'Enviar para revisão', submit_admin_company_hero_slide_path(resource),
            method: :post, data: { confirm: 'Enviar imagem para moderação?' }
  end

  member_action :submit, method: :post do
    if %w[draft rejected].include?(resource.status) && resource.ready_for_publication?
      resource.update!(status: 'pending_review', rejection_reason: nil)
      redirect_to resource_path, notice: 'Revisão enviada para moderação.'
    else
      redirect_to resource_path, alert: 'Imagem inválida ou revisão não editável.'
    end
  end

  action_item :approve_and_publish, only: :show, if: proc { %w[pending_review approved].include?(resource.status) } do
    link_to 'Aprovar e publicar', approve_admin_company_hero_slide_path(resource),
            method: :post, data: { confirm: 'Publicar esta revisão no hero da empresa?' }
  end

  action_item :reject_slide, only: :show, if: proc { resource.status == 'pending_review' } do
    link_to 'Rejeitar', reject_admin_company_hero_slide_path(resource),
            method: :post, data: { confirm: 'Rejeitar esta revisão? Um motivo genérico será registrado.' }
  end

  action_item :archive_slide, only: :show, if: proc { %w[published draft rejected].include?(resource.status) } do
    link_to 'Arquivar (sem apagar mídia)', archive_admin_company_hero_slide_path(resource),
            method: :post, data: { confirm: 'Arquivar esta revisão? O banner legado permanece disponível.' }
  end

  member_action :approve, method: :post do
    ::BrandHero::Publisher.call(slide: resource, reviewer_id: current_admin_user.id)
    redirect_to resource_path, notice: 'Revisão publicada. O perfil público será revalidado.'
  rescue ::BrandHero::Publisher::InvalidPublication => e
    redirect_to resource_path, alert: e.message
  end

  member_action :reject, method: :post do
    if resource.status != 'pending_review'
      redirect_to resource_path, alert: 'Somente revisões pendentes podem ser rejeitadas.'
    else
      resource.update!(status: 'rejected', rejection_reason: params[:reason].presence || 'Rejeitado na moderação')
      redirect_to resource_path, notice: 'Revisão rejeitada e mantida para correção.'
    end
  end

  member_action :archive, method: :post do
    resource.update!(status: 'archived', archived_at: Time.current)
    redirect_to resource_path, notice: 'Revisão arquivada; o arquivo não foi excluído.'
  end

  controller do
    def create
      attrs = params.require(:company_hero_slide).permit(:company_id, :slot, :alt_text, :image)
      company = ::Company.find(attrs[:company_id])
      company.with_lock do
        slot = attrs[:slot].to_i
        revision = company.company_hero_slides.where(slot: slot).maximum(:revision).to_i + 1
        slide = company.company_hero_slides.new(
          slot: slot, display_position: slot, revision: revision, status: 'draft',
          source: 'admin', alt_text: attrs[:alt_text]
        )
        ::BrandHero::ImageIngest.call(slide: slide, upload: attrs[:image])
        slide.save!
        redirect_to admin_company_hero_slide_path(slide), notice: 'Revisão criada em rascunho.'
      end
    rescue ::BrandHero::ImageIngest::InvalidImage, ActiveRecord::RecordInvalid => e
      redirect_to new_admin_company_hero_slide_path, alert: e.message
    end

    def update
      slide = ::CompanyHeroSlide.find(params[:id])
      unless %w[draft rejected].include?(slide.status)
        return redirect_to resource_path, alert: 'Revisão publicada/pendente não pode ser sobrescrita.'
      end
      attrs = params.require(:company_hero_slide).permit(:alt_text, :image)
      ::BrandHero::ImageIngest.call(slide: slide, upload: attrs[:image]) if attrs[:image].present?
      slide.update!(alt_text: attrs[:alt_text], status: 'draft')
      redirect_to resource_path, notice: 'Rascunho atualizado.'
    rescue ::BrandHero::ImageIngest::InvalidImage, ActiveRecord::RecordInvalid => e
      redirect_to resource_path, alert: e.message
    end

    def destroy
      resource.update!(status: 'archived', archived_at: Time.current)
      redirect_to collection_path, notice: 'Revisão arquivada (arquivo preservado).'
    end
  end
end
