ActiveAdmin.register PendingChange do
  actions :index, :show

  scope :all
  scope :pending
  scope :approved
  scope :rejected

  filter :created_at
  filter :user
  filter :change_type, as: :select, collection: -> { PendingChange.change_types.keys }
  filter :status, as: :select, collection: -> { PendingChange.statuses.keys }
  filter :company

  index do
    selectable_column
    id_column
    column :company
    column :user
    column :change_type
    column :status
    column('Preview') do |pc|
      if pc.change_type == 'categories'
        limit = pc.data&.dig('category_limit') || {}
        {
          action: pc.data&.dig('action'),
          category_ids: pc.data&.dig('category_ids'),
          plan_tier: limit['plan_tier'] || limit[:plan_tier],
          limit: limit['limit'] || limit[:limit],
          projected_count: limit['projected_count'] || limit[:projected_count],
          commercial_approval: pc.data&.dig('requires_commercial_approval')
        }
      elsif pc.change_type == 'company_info' && pc.data&.dig('service_area_limit').present?
        limit = pc.data&.dig('service_area_limit') || {}
        {
          plan_tier: limit['plan_tier'] || limit[:plan_tier],
          states: "#{limit['projected_states_count'] || limit[:projected_states_count]}/#{limit['states_limit'] || limit[:states_limit]}",
          cities: "#{limit['projected_cities_count'] || limit[:projected_cities_count]}/#{limit['cities_limit'] || limit[:cities_limit]}",
          commercial_approval: pc.data&.dig('requires_commercial_approval')
        }
      else
        pc.data&.slice('action', 'video_id', 'url', 'thumbnail_url')
      end
    end
    column :created_at
    actions defaults: true do |pc|
      if pc.status == 'pending'
        item 'Aprovar', approve_admin_pending_change_path(pc), method: :patch, class: 'member_link'
        item 'Rejeitar', reject_admin_pending_change_path(pc), method: :patch, class: 'member_link'
      end
    end
  end

  show do
    attributes_table do
      row :company
      row :user
      row :change_type
      row :status
      row('Aprovação comercial') { |pc| pc.data&.dig('requires_commercial_approval') ? 'Sim' : 'Não' }
      row('Limite de categorias') { |pc| pc.data&.dig('category_limit') }
      row('Limite de abrangência') { |pc| pc.data&.dig('service_area_limit') }
      row :data
      row :created_at
      row :updated_at
    end
    active_admin_comments
  end

  member_action :approve, method: :patch do
    resource.with_lock do
      resource.transaction do
        resource.update!(
          status: 'approved',
          approved_at: Time.current,
          approved_by: current_admin_user,
          approved_ip: request.remote_ip,
          approved_user_agent: request.user_agent
        )
        resource.apply_changes!
      end
    end
    redirect_to resource_path, notice: 'Mudança aprovada e aplicada.'
  end

  member_action :reject, method: :patch do
    resource.update!(
      status: 'rejected',
      rejected_at: Time.current,
      rejected_ip: request.remote_ip,
      rejected_user_agent: request.user_agent
    )
    redirect_to resource_path, alert: 'Mudança rejeitada.'
  end
end
