ActiveAdmin.register Review do
  permit_params :company_id, :user_id, :rating, :comment, :status, :featured, :display_order, :verified, :reply, :replied_at

  scope :all, default: true
  scope :pending
  scope :approved
  scope :rejected
  scope :in_analysis

  filter :company
  filter :status, as: :select, collection: -> { Review.statuses.keys }
  filter :rating
  filter :featured
  filter :created_at

  batch_action :approve do |ids|
    selected = batch_action_collection.where(id: ids)
    updated = selected.update_all(status: Review.statuses[:approved], updated_at: Time.current)
    redirect_to collection_path, notice: "#{updated} reviews approved."
  end

  batch_action :reject do |ids|
    selected = batch_action_collection.where(id: ids)
    updated = selected.update_all(status: Review.statuses[:rejected], updated_at: Time.current)
    redirect_to collection_path, notice: "#{updated} reviews rejected."
  end

  member_action :approve, method: :patch do
    resource.update(status: :approved)
    redirect_to resource_path, notice: 'Review approved.'
  end

  member_action :reject, method: :patch do
    resource.update(status: :rejected)
    redirect_to resource_path, notice: 'Review rejected.'
  end

  member_action :analyze, method: :patch do
    resource.update(status: :in_analysis)
    redirect_to resource_path, notice: 'Review moved to in_analysis.'
  end

  action_item :approve, only: :show, if: proc { !resource.approved? } do
    link_to 'Approve', approve_admin_review_path(resource), method: :patch
  end

  action_item :reject, only: :show, if: proc { !resource.rejected? } do
    link_to 'Reject', reject_admin_review_path(resource), method: :patch
  end

  action_item :analyze, only: :show, if: proc { !resource.in_analysis? } do
    link_to 'Analyze', analyze_admin_review_path(resource), method: :patch
  end

  index do
    selectable_column
    id_column
    column :company
    column :user
    column :rating
    column :status do |review|
      status_tag review.status
    end
    column :featured
    column :display_order
    column :created_at
    actions defaults: true do |review|
      item 'Approve', approve_admin_review_path(review), method: :patch unless review.approved?
      item 'Reject', reject_admin_review_path(review), method: :patch unless review.rejected?
      item 'Analyze', analyze_admin_review_path(review), method: :patch unless review.in_analysis?
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
  end

  controller do
    def scoped_collection
      super.includes(:company, :user)
    end
  end
end
