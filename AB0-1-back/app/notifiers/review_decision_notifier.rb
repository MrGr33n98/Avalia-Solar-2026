class ReviewDecisionNotifier < ApplicationNotifier
  required_param :review
  required_param :previous_status
  required_param :new_status
  required_param :admin_name

  def message
    case params[:new_status].to_s
    when 'approved'
      "Sua avaliação foi aprovada por #{params[:admin_name]}."
    when 'rejected'
      "Sua avaliação foi rejeitada por #{params[:admin_name]}."
    else
      "Uma atualização foi realizada na sua avaliação por #{params[:admin_name]}."
    end
  end

  def url
    company = params[:review]&.company
    return nil unless company

    Rails.application.routes.url_helpers.company_path(company.slug || company.id)
  end
end
