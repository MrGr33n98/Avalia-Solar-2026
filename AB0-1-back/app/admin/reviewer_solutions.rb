ActiveAdmin.register ReviewerSolution do
  menu label: 'Soluções de reviewers', parent: 'Reviews', priority: 2
  permit_params :user_id, :name, :solution_type, :category, :verified, :company_id, :status

  filter :user
  filter :solution_type, as: :select, collection: ReviewerSolution::TYPES
  filter :category
  filter :verified
  filter :status, as: :select, collection: ReviewerSolution::STATUSES
  filter :created_at

  index do
    selectable_column
    id_column
    column :user
    column :name
    column :solution_type
    column :category
    column :verified
    column :status
    column :created_at
    actions do |solution|
      item "Verificar", verify_admin_reviewer_solution_path(solution), method: :put unless solution.verified
      item "Rejeitar", reject_admin_reviewer_solution_path(solution), method: :put if solution.status == 'active'
      item "Desativar", deactivate_admin_reviewer_solution_path(solution), method: :put if solution.status != 'disabled'
    end
  end

  form do |f|
    f.inputs do
      f.input :user
      f.input :name
      f.input :solution_type, as: :select, collection: ReviewerSolution::TYPES
      f.input :category
      f.input :company_id
      f.input :verified
      f.input :status, as: :select, collection: ReviewerSolution::STATUSES
    end
    f.actions
  end
  member_action :verify, method: :put do
    old_status = resource.status
    resource.update!(verified: true, status: 'active')
    ReviewerSolutionEvent.create!(reviewer_solution: resource, actor: current_admin_user, action: 'verified', old_status: old_status, new_status: 'active')
    redirect_to resource_path(resource), notice: 'Solução verificada.'
  end

  member_action :reject, method: :put do
    old_status = resource.status
    resource.update!(verified: false, status: 'rejected')
    ReviewerSolutionEvent.create!(reviewer_solution: resource, actor: current_admin_user, action: 'rejected', old_status: old_status, new_status: 'rejected')
    redirect_to resource_path(resource), notice: 'Solução rejeitada.'
  end

  member_action :deactivate, method: :put do
    old_status = resource.status
    resource.update!(status: 'disabled')
    ReviewerSolutionEvent.create!(reviewer_solution: resource, actor: current_admin_user, action: 'deactivated', old_status: old_status, new_status: 'disabled')
    redirect_to resource_path(resource), notice: 'Solução desativada.'
  end

end
