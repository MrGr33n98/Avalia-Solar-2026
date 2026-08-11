ActiveAdmin.register PaperTrail::Version, as: 'AuditLog' do
  menu false

  actions :index, :show

  index do
    id_column
    column :item_type
    column :item do |v|
      if v.item
        begin
          link_to "#{v.item_type} ##{v.item_id}", auto_url_for(v.item)
        rescue StandardError
          "#{v.item_type} ##{v.item_id}"
        end
      else
        "#{v.item_type} ##{v.item_id} (Deleted)"
      end
    end
    column :event
    column :whodunnit
    column :created_at
    actions
  end

  filter :item_type
  filter :item_id, as: :numeric
  filter :event, as: :select, collection: %w[create update destroy]
  filter :whodunnit
  filter :created_at

  show do
    attributes_table do
      row :item_type
      row :item
      row :event
      row :whodunnit
      row :created_at
      row :object do |v|
        pre v.object
      end
      row :object_changes do |v|
        pre v.object_changes
      end
    end
  end

  csv do
    column :id
    column :item_type
    column :item_id
    column :event
    column :whodunnit
    column :created_at
    column :object_changes
  end
end
