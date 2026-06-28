# frozen_string_literal: true

class Api::V1::LeadWizardsController < Api::V1::BaseController
  # GET /api/v1/lead_wizards/resolve?category_id=...&preferred_company_id=...
  def resolve
    category_id = params[:category_id].presence
    preferred_company_id = params[:preferred_company_id].presence

    return render json: { error: 'category_id is required' }, status: :bad_request if category_id.blank?

    schema = LeadWizard::Resolver.resolve(
      category_id: category_id,
      preferred_company_id: preferred_company_id
    )

    render json: schema
  end
end
