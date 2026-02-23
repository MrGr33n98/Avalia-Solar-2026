ActiveAdmin.register SectorRating do
  menu label: 'Avaliações Setoriais', priority: 4

  actions :index, :show, :destroy
  permit_params :status, :comment

  filter :company
  filter :user
  filter :status, as: :select, collection: SectorRating.statuses.keys
  filter :created_at

  index do
    selectable_column
    id_column
    column :company
    column :user
    column :status
    column :total_score
    column :created_at
    actions
  end

  show do
    attributes_table do
      row :company
      row :user
      row(:homologation) { |rating| rating.homologation }
      row(:technical_quality) { |rating| rating.technical_quality }
      row(:safety) { |rating| rating.safety }
      row(:consultancy) { |rating| rating.consultancy }
      row :total_score
      row :status
      row :comment
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
