module Dashboard
  class CategoriesController < BaseController
    def index
      @company = current_user.company
      @categories = @company.categories.order(:name)
      @pending_requests = @company.pending_changes.pending.where(change_type: 'categories')
    end

    def request_category
      company = current_user.company
      name = params[:category_name].to_s.strip

      if name.blank?
        redirect_to dashboard_categories_path, alert: 'Informe o nome da categoria.'
        return
      end

      company.pending_changes.create!(
        user: current_user,
        change_type: 'categories',
        status: 'pending',
        data: { action: 'request', name: name }
      )

      Analytics::TrackEventService.call(
        company_id: company.id,
        event_type: 'category_request_created',
        user: current_user,
        metadata: { category_name: name }
      )

      redirect_to dashboard_categories_path, notice: 'Solicitacao enviada.'
    end
  end
end
