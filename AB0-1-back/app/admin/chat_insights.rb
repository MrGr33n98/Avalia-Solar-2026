# frozen_string_literal: true

ActiveAdmin.register ChatInsight do
  menu false

  actions :index, :show, :destroy

  filter :insight_type, as: :select, collection: ChatInsight::INSIGHT_TYPES
  filter :vertical, as: :select, collection: ChatLead::VERTICALS
  filter :city
  filter :state
  filter :title
  filter :confidence_score
  filter :created_at

  scope :all, default: true
  scope :high_confidence

  index do
    selectable_column
    id_column
    column :insight_type do |i|
      status_tag i.insight_type.humanize, class: 'light'
    end
    column :title
    column :vertical do |i|
      status_tag i.vertical, class: i.vertical == 'solar' ? 'ok' : 'warning' if i.vertical.present?
    end
    column :location do |i|
      [i.city, i.state].compact.join('/') if i.city.present?
    end
    column :volume
    column :confidence_score do |i|
      "#{i.confidence_score * 100}%" if i.confidence_score.present?
    end
    column :created_at
    actions
  end

  show do
    attributes_table do
      row :id
      row :insight_type
      row :title
      row :summary do |i|
        div style: 'white-space: pre-wrap;' do
          i.summary
        end
      end
      row :vertical
      row :city
      row :state
      row :volume
      row :confidence_score do |i|
        "#{i.confidence_score * 100}%" if i.confidence_score.present?
      end
      row :source_period_start
      row :source_period_end
      row :created_at
      row :updated_at
      row :metadata do |i|
        pre { JSON.pretty_generate(i.metadata) } if i.metadata.present?
      end
    end
  end
end
