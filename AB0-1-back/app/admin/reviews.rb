ActiveAdmin.register Review do
  menu label: 'Reviews', priority: 3
  permit_params :company_id, :user_id, :rating, :comment, :status, :featured, :display_order, :verified, :reply,
                :replied_at

  scope :all, default: true
  scope :pending
  scope :approved
  scope :rejected
  scope :in_analysis
  scope :contested

  filter :company
  filter :user
  filter :review_form
  filter :capture_flow_source, as: :select, collection: -> { Review.capture_flow_sources.keys }
  filter :status, as: :select, collection: -> { Review.statuses.keys }
  filter :verification_status, as: :select, collection: -> { Review.verification_statuses.keys }
  filter :rating
  filter :featured
  filter :created_at

  batch_action :approve do |ids|
    result = run_batch_decision(ids, :approve)
    message = "#{result[:processed]} reviews aprovadas."
    message += " Erros: #{result[:errors].join('; ')}" if result[:errors].any?
    redirect_to collection_path, notice: message
  end

  batch_action :reject do |ids|
    result = run_batch_decision(ids, :reject)
    message = "#{result[:processed]} reviews rejeitadas."
    message += " Erros: #{result[:errors].join('; ')}" if result[:errors].any?
    redirect_to collection_path, notice: message
  end

  member_action :approve, method: :patch do
    handle_review_decision(resource, :approve, 'Avaliação aprovada.')
  end

  member_action :reject, method: :patch do
    handle_review_decision(resource, :reject, 'Avaliação rejeitada.')
  end

  member_action :analyze, method: :patch do
    resource.update(status: :in_analysis)
    redirect_to resource_path, notice: 'Review set to análise.'
  end

  member_action :verify_manual, method: :patch do
    Reviews::WorkflowService.new(review: resource, actor: current_admin_user).verify!(
      status: 'manually_verified',
      notes: params[:notes]
    )
    redirect_to resource_path, notice: 'Avaliação verificada manualmente.'
  rescue Reviews::WorkflowService::WorkflowError, ActiveRecord::RecordInvalid => e
    redirect_to resource_path, alert: e.message
  end

  member_action :review_verification, method: :patch do
    Reviews::WorkflowService.new(review: resource, actor: current_admin_user).verify!(
      status: 'in_review',
      notes: params[:notes]
    )
    redirect_to resource_path, notice: 'Verificação enviada para análise.'
  rescue Reviews::WorkflowService::WorkflowError, ActiveRecord::RecordInvalid => e
    redirect_to resource_path, alert: e.message
  end

  member_action :reject_verification, method: :patch do
    Reviews::WorkflowService.new(review: resource, actor: current_admin_user).verify!(
      status: 'rejected',
      notes: params[:notes]
    )
    redirect_to resource_path, notice: 'Verificação rejeitada.'
  rescue Reviews::WorkflowService::WorkflowError, ActiveRecord::RecordInvalid => e
    redirect_to resource_path, alert: e.message
  end

  member_action :approve_media, method: :patch do
    media = resource.review_media.find(params[:media_id])
    media.update!(status: :ready, moderation_status: :approved, moderated_by: current_admin_user,
                  moderated_at: Time.current, rejected_reason: nil)
    ReviewAuditEvent.create!(review: resource, actor: current_admin_user,
                             event_type: 'media_moderation_changed',
                             previous_value: { media_id: media.id, status: 'rejected' },
                             new_value: { media_id: media.id, status: 'approved' })
    redirect_to resource_path, notice: 'Foto aprovada.'
  end

  member_action :reject_media, method: :patch do
    media = resource.review_media.find(params[:media_id])
    reason = params[:reason].presence || 'outro'
    previous_status = media.status
    media.update!(status: :rejected, moderation_status: :rejected, moderated_by: current_admin_user,
                  moderated_at: Time.current, rejected_reason: reason)
    ReviewAuditEvent.create!(review: resource, actor: current_admin_user,
                             event_type: 'media_moderation_changed',
                             previous_value: { media_id: media.id, status: previous_status },
                             new_value: { media_id: media.id, status: 'rejected', reason: reason })
    redirect_to resource_path, notice: 'Foto rejeitada.'
  end

  action_item :approve, only: :show, if: proc { !resource.approved? } do
    link_to 'Aprovar', approve_admin_review_path(resource), method: :patch,
                                                            data: { confirm: 'Confirma a aprovação desta avaliação?' }
  end

  action_item :reject, only: :show, if: proc { !resource.rejected? } do
    link_to 'Rejeitar', reject_admin_review_path(resource), method: :patch,
                                                            data: { confirm: 'Deseja rejeitar esta avaliação?' }
  end

  action_item :analyze, only: :show, if: proc { !resource.in_analysis? } do
    link_to 'Enviar para análise', analyze_admin_review_path(resource), method: :patch,
                                                                        data: { confirm: 'Mover esta avaliação para análise?' }
  end

  action_item :verify_manual, only: :show, if: proc { !resource.verification_manually_verified? } do
    link_to 'Verificar manualmente', verify_manual_admin_review_path(resource), method: :patch,
                                                                             data: { confirm: 'Confirmar verificação manual?' }
  end

  action_item :review_verification, only: :show, if: proc { !resource.verification_in_review? } do
    link_to 'Analisar verificação', review_verification_admin_review_path(resource), method: :patch
  end

  action_item :reject_verification, only: :show, if: proc { !resource.verification_rejected? } do
    link_to 'Rejeitar verificação', reject_verification_admin_review_path(resource), method: :patch,
                                                                                     data: { confirm: 'Rejeitar a verificação desta avaliação?' }
  end

  index do
    selectable_column
    id_column
    column :company
    column 'Usuário', &:user
    column :review_form
    column :capture_flow_source
    column :rating
    column :status do |review|
      status_tag review.status
    end
    column :verification_status do |review|
      status_tag review.verification_status
    end
    column :comment do |review|
      truncate(review.comment, length: 120)
    end
    column :featured
    column :display_order
    column 'Leituras' do |review|
      review.metadata&.[]('read_count') || 0
    end
    column 'Cliques CTA' do |review|
      review.metadata&.[]('cta_clicks') || 0
    end
    column :created_at
    column :updated_at
    actions defaults: true do |review|
      unless review.approved?
        item 'Aprovar', approve_admin_review_path(review), method: :patch,
                                                           data: { confirm: 'Confirma a aprovação desta avaliação?' }
      end
      unless review.rejected?
        item 'Rejeitar', reject_admin_review_path(review), method: :patch,
                                                           data: { confirm: 'Deseja rejeitar esta avaliação?' }
      end
      unless review.in_analysis?
        item 'Enviar para análise', analyze_admin_review_path(review), method: :patch,
                                                                       data: { confirm: 'Deseja mover esta avaliação para análise?' }
      end
    end
  end

  form do |f|
    f.semantic_errors(*f.object.errors.attribute_names)

    f.inputs 'Review data' do
      f.input :company
      f.input :user
      f.input :rating
      f.input :comment
      f.input :status, as: :select, collection: Review.statuses.keys
      f.input :verified
    end

    f.inputs 'Social proof settings' do
      if f.object.company&.can_use_social_proof?
        f.input :featured, label: 'Feature / pin'
        f.input :display_order, hint: 'Lower value appears first in social proof.'
      else
        para 'Feature / pin is available only for companies with eligible paid plans.'
      end
    end

    f.inputs 'Reply' do
      f.input :reply
      f.input :replied_at
    end

    f.actions
  end

  show do
    attributes_table do
      row :id
      row :company
      row :user
      row :rating
      row :comment
      row :status
      row :verification_status
      row :featured
      row :display_order
      row :verified
      row('Resposta ativa') { |review| review.active_reply }
      row('Respondida em') { |review| review.active_replied_at }
      row :created_at
      row :updated_at
    end
    panel 'Fotos da avaliação' do
      if resource.review_media.any?
        table_for resource.review_media.ordered do
          column('Preview') do |media|
            if media.file.attached?
              image_tag url_for(media.file), height: 80, style: 'object-fit: cover; border-radius: 6px;'
            else
              'Sem arquivo'
            end
          end
          column :status
          column :moderation_status
          column :sort_order
          column :byte_size
          column :created_at
          column 'Ações' do |media|
            if media.moderation_rejected?
              item 'Aprovar foto', approve_media_admin_review_path(resource, media_id: media.id), method: :patch
            else
              item 'Rejeitar foto', reject_media_admin_review_path(resource, media_id: media.id, reason: 'outro'), method: :patch
            end
          end
        end
      else
        para 'Nenhuma foto associada.'
      end
    end
    panel 'Histórico de decisões' do
      table_for resource.review_decision_logs.order(created_at: :desc) do
        column :admin_user
        column(:action) { |log| log.action.humanize }
        column :previous_status
        column :new_status
        column :notes
        column :created_at
      end
    end
    panel 'Trilha operacional' do
      table_for resource.review_audit_events.order(created_at: :desc) do
        column(:ator) { |event| event.actor_name }
        column(:evento) { |event| event.event_type.humanize }
        column :previous_value
        column :new_value
        column :created_at
      end
    end
  end

  sidebar 'Decisões recentes', only: :show do
    table_for resource.review_decision_logs.order(created_at: :desc).limit(5) do
      column :admin_user
      column(:action) { |log| log.action.humanize }
      column :created_at
    end
  end

  controller do
    def scoped_collection
      super.includes(:company, :user)
    end

    def handle_review_decision(review, action, success_message)
      ReviewDecisionService.new(
        review: review,
        admin_user: current_admin_user,
        notes: params[:notes],
        lock_version: params[:lock_version]
      ).public_send("#{action}!")

      redirect_to resource_path(review), notice: success_message
    rescue ReviewDecisionService::DecisionError => e
      redirect_to resource_path(review), alert: e.message
    rescue ActiveRecord::RecordInvalid => e
      redirect_to resource_path(review), alert: e.record.errors.full_messages.to_sentence
    end

    def run_batch_decision(ids, action)
      processed = 0
      errors = []

      Review.where(id: ids).order(:id).find_each do |review|
        ReviewDecisionService.new(review: review, admin_user: current_admin_user).public_send("#{action}!")
        processed += 1
      rescue StandardError => e
        errors << "##{review.id}: #{e.message}"
      end

      { processed: processed, errors: errors }
    end
  end
end
