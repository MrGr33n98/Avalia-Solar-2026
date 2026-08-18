ActiveAdmin.register CreatorTreeBlock do
  menu label: 'Creator Tree', parent: 'Reviews'
  permit_params :active

  includes :reviewer, :company, :publication
  filter :reviewer
  filter :block_type, as: :select, collection: CreatorTreeBlock::TYPES
  filter :active

  index do
    selectable_column
    id_column
    column('Creator') { |block| block.reviewer.user.name }
    column :block_type
    column :title
    column :active
    column :clicks_count
    column :position
    actions
  end

  form do |f|
    f.inputs do
      f.input :active
    end
    f.actions
  end
end