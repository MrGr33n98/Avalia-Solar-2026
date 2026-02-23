ActiveAdmin.register Review do
  permit_params :company_id, :user_id, :rating, :comment, :status, :featured, :display_order, :verified, :reply, :replied_at

  scope :all, default: true
  scope :pending
  scope :approved
  scope :rejected
  scope :in_analysis

  filter :company
  filter :user
  filter :status, as: :select, collection: -> { Review.statuses.keys }
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

  index do
    selectable_column
    id_column
    column :company
    column 'Usuário', &:user
    column :rating
    column :status do |review|
      status_tag review.status
    end
    column :comment do |review|
      truncate(review.comment, length: 120)
    end
    column :featured
    column :display_order
    column :created_at
    column :updated_at
    actions defaults: true do |review|
      item 'Aprovar', approve_admin_review_path(review), method: :patch,
           data: { confirm: 'Confirma a aprovação desta avaliação?' } unless review.approved?
      item 'Rejeitar', reject_admin_review_path(review), method: :patch,
           data: { confirm: 'Deseja rejeitar esta avaliação?' } unless review.rejected?
      item 'Enviar para análise', analyze_admin_review_path(review), method: :patch,
           data: { confirm: 'Deseja mover esta avaliação para análise?' } unless review.in_analysis?
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
      row :featured
      row :display_order
      row :verified
      row :reply
      row :replied_at
      row :created_at
      row :updated_at
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
        begin
          ReviewDecisionService.new(review: review, admin_user: current_admin_user).public_send("#{action}!")
          processed += 1
        rescue StandardError => e
          errors << "##{review.id}: #{e.message}"
        end
      end

      { processed: processed, errors: errors }
    end
  end
end
