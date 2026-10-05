# frozen_string_literal: true

ActiveAdmin.register MarketplaceProposal do
  menu label: 'Propostas do marketplace', priority: 8
  actions :all, except: %i[new create edit update destroy]

  filter :reference
  filter :status, as: :select, collection: MarketplaceProposal::STATUSES
  filter :company
  filter :lead
  filter :created_at

  index do
    selectable_column
    id_column
    column :reference
    column :company
    column :lead
    column :status do |proposal|
      status_tag proposal.status
    end
    column :total_cents do |proposal|
      number_to_currency(proposal.total_cents.to_i / 100.0, unit: 'R$ ', separator: ',', delimiter: '.')
    end
    column :current_version_number
    column :created_at
    actions
  end

  show do
    attributes_table do
      row :id
      row :reference
      row :status
      row :company
      row :lead
      row :lead_distribution
      row :buyer_user
      row :total_cents do |proposal|
        number_to_currency(proposal.total_cents.to_i / 100.0, unit: 'R$ ', separator: ',', delimiter: '.')
      end
      row :expires_at
      row :published_at
      row :accepted_at
      row :created_at
      row :updated_at
    end

    panel 'Versão atual' do
      version = resource.current_version
      if version
        attributes_table_for version do
          row :number
          row :status
          row :title
          row :summary
          row :total_cents do |current|
            number_to_currency(current.total_cents.to_i / 100.0, unit: 'R$ ', separator: ',', delimiter: '.')
          end
          row :valid_until
        end
        table_for version.items.order(:position, :id) do
          column :name
          column :description
          column :quantity
          column :unit
          column :unit_price_cents
          column :total_cents
        end
      else
        para 'Nenhuma versão criada.'
      end
    end

    panel 'Linha do tempo' do
      table_for resource.events.order(occurred_at: :desc) do
        column :event_type
        column :actor
        column :occurred_at
        column :metadata
      end
    end
  end

  member_action :close_after_selection, method: :post do
    resource.update!(status: 'closed_after_selection')
    resource.record_event('proposal.closed_after_selection')
    redirect_to resource_path(resource), notice: 'Proposta encerrada.'
  end

  action_item :close_after_selection, only: :show, if: proc { !%w[accepted declined closed_after_selection].include?(resource.status) } do
    link_to 'Encerrar após seleção', close_after_selection_admin_marketplace_proposal_path(resource), method: :post
  end
end
