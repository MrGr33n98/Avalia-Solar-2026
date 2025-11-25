ActiveAdmin.register ForumAnswer do
  # Update the permitted parameters to match your model's fields
  permit_params :forum_question_id, :user_id, :answer, :status, :requested_at

  index do
    selectable_column
    id_column
    column :forum_question
    column :user
    column :answer
    column :status
    column :requested_at
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :forum_question
      f.input :user
      f.input :answer # Changed from content to answer
      f.input :status
      f.input :requested_at
    end
    f.actions
  end
end
