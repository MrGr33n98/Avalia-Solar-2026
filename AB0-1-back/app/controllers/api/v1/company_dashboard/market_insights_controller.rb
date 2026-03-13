# app/controllers/api/v1/company_dashboard/market_insights_controller.rb
module Api
  module V1
    module CompanyDashboard
      class MarketInsightsController < Api::V1::BaseController
        before_action :authenticate_company_user_or_admin!
        before_action :set_company

        def index
          # Identifica a categoria principal da empresa
          category_id = @company.category_id
          category_name = @company.category&.name || "Sua Categoria"

          # 1. Leads totais da categoria (últimos 30 dias)
          market_leads_scope = Lead.where(created_at: 30.days.ago..Time.current)
          market_leads_scope = market_leads_scope.where(category_id: category_id) if category_id

          total_market_leads = market_leads_scope.count
          
          # 2. Meus leads na categoria
          my_leads_count = market_leads_scope.where(company_id: @company.id).count

          # 3. Oportunidades (Leads que não foram para mim)
          opportunities_count = total_market_leads - my_leads_count

          # 4. Amostra de Oportunidades (Leads recentes da categoria)
          # Se não for premium, o frontend vai borrar os detalhes
          recent_opportunities = market_leads_scope
                                  .where.not(company_id: @company.id)
                                  .order(created_at: :desc)
                                  .limit(10)
                                  .map do |lead|
                                    {
                                      id: lead.id,
                                      city: lead.city || "Local não identificado",
                                      state: lead.state,
                                      product_vertical: lead.product_vertical,
                                      created_at: lead.created_at,
                                      # Dados sensíveis que serão borrados no frontend se não for premium
                                      name: lead.name,
                                      email: lead.email,
                                      phone: lead.phone
                                    }
                                  end

          render json: {
            category_name: category_name,
            stats: {
              total_market_leads: total_market_leads,
              my_leads_count: my_leads_count,
              opportunities_count: opportunities_count,
              market_share_percent: total_market_leads.positive? ? ((my_leads_count.to_f / total_market_leads) * 100).round(1) : 0
            },
            opportunities: recent_opportunities,
            is_premium: @company.has_paid_plan? || @company.plan_status == 'active'
          }
        end

        private

        def set_company
          @company = if current_user.admin? && params[:company_id].present?
                       Company.find(params[:company_id])
                     else
                       current_user.company
                     end

          render_error_response(status: :not_found, message: 'Empresa não encontrada') unless @company
        end
      end
    end
  end
end
