# frozen_string_literal: true

module Chat
  class CompanyRecommendationService
    attr_reader :vertical, :answers, :session_id

    def initialize(vertical:, answers:, session_id: nil)
      @vertical = vertical
      @answers = answers || {}
      @session_id = session_id
    end

    def call
      recommendations = fetch_companies
      sanitized_results = sanitize_results(recommendations)
      
      {
        recommendations: sanitized_results,
        fallback_reason: determine_fallback_reason(recommendations),
        total: sanitized_results.size
      }
    end

    private

    def fetch_companies
      companies = Company.active.includes(:categories, :profile, :reviews)
                          .where(vertical: vertical)
      
      companies = filter_by_location(companies)
      companies = filter_by_category(companies)
      
      ranked_companies = companies.map do |company|
        score = calculate_score(company)
        { company: company, score: score }
      end.sort_by { |item| -item[:score] }
      
      ranked_companies.first(5).map { |item| item[:company] }
    end

    def filter_by_location(companies)
      city = answers['city'] || answers['location_city']
      state = answers['state'] || answers['location_state']
      
      if city.present? && state.present?
        companies.where(city: city, state: state)
                 .or(Company.active.where(vertical: vertical).where(state: state))
      elsif state.present?
        companies.where(state: state)
      else
        companies
      end
    end

    def filter_by_category(companies)
      category_need = answers['category_or_need'] || answers['solution_type']
      return companies if category_need.blank?
      
      category_ids = Category.where("LOWER(name) LIKE ?", "%#{category_need}%").pluck(:id)
      if category_ids.any?
        companies.joins(:categories).where(categories: { id: category_ids })
      else
        companies
      end
    end

    def calculate_score(company)
      score = 0
      
      # Localização
      score += 30 if company.city == (answers['city'] || answers['location_city'])
      score += 15 if company.state == (answers['state'] || answers['location_state'])
      
      # Categoria
      category_need = answers['category_or_need'] || answers['solution_type']
      if category_need.present? && company.categories.any?
        exact_match = company.categories.any? { |cat| cat.name.downcase.include?(category_need.downcase) }
        score += exact_match ? 25 : 10
      end
      
      # Verificação
      score += 15 if company.verified?
      
      # Avaliações
      avg_rating = company.average_rating
      reviews_count = company.reviews_count
      
      if avg_rating >= 4.5
        score += 15
      elsif avg_rating >= 4.0
        score += 10
      end
      
      if reviews_count >= 50
        score += 15
      elsif reviews_count >= 10
        score += 10
      end
      
      # Plano
      if company.premium? || ['pro', 'enterprise'].include?(company.plan_tier&.downcase)
        score += 10
      end
      
      # Perfil completo
      score += 10 if company.profile_complete?
      
      # WhatsApp ativo
      score += 5 if company.whatsapp_number.present?
      
      # Imagens/projetos
      score += 5 if company.projects_count.to_i > 0
      
      # Conteúdo extra
      score += 3 if company.faq.present? || company.description.present?
      
      score
    end

    def sanitize_results(companies)
      companies.map do |company|
        {
          id: company.id,
          slug: company.slug,
          name: company.name,
          logo_url: company.logo_url,
          city: company.city,
          state: company.state,
          categories: company.categories.pluck(:name),
          vertical: company.vertical,
          average_rating: company.average_rating,
          reviews_count: company.reviews_count,
          verified: company.verified?,
          premium: company.premium?,
          plan_tier: company.plan_tier,
          profile_url: "/empresas/#{company.slug}",
          whatsapp_url: company.whatsapp_number ? "https://wa.me/#{sanitize_phone(company.whatsapp_number)}" : nil,
          quote_enabled: true,
          comparison_enabled: true,
          short_reason: generate_recommendation_reason(company)
        }
      end
    end

    def sanitize_phone(phone)
      phone.gsub(/\D/, '')
    end

    def generate_recommendation_reason(company)
      reasons = []
      
      if company.city == (answers['city'] || answers['location_city'])
        reasons << "Atendimento na sua cidade"
      end
      
      if company.verified?
        reasons << "Empresa verificada"
      end
      
      if company.average_rating.to_f >= 4.5
        reasons << "Excelente avaliação"
      elsif company.average_rating.to_f >= 4.0
        reasons << "Boa avaliação"
      end
      
      if company.premium?
        reasons << "Destaque na região"
      end
      
      reasons.join(' · ') || "Compatível com sua busca"
    end

    def determine_fallback_reason(companies)
      if companies.empty?
        city = answers['city'] || answers['location_city']
        state = answers['state'] || answers['location_state']
        
        if city.present?
          "Não encontrei empresas exatamente em #{city}, mas busquei opções no estado."
        elsif state.present?
          "Ainda não temos empresas cadastradas para esta busca em #{state}."
        else
          "Para buscar empresas mais compatíveis, preciso saber sua cidade e o tipo de serviço."
        end
      else
        nil
      end
    end
  end
end
