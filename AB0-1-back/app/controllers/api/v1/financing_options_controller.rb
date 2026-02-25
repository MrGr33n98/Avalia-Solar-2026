module Api
  module V1
    class FinancingOptionsController < BaseController
      before_action :set_company
      before_action :set_financing_option, only: %i[update destroy]

      def index
        options = @company.financing_options
        if params[:audience].present?
          normalized = normalize_audience(params[:audience])
          options = options.where(target_audience: normalized) if normalized.present?
        end
        options = options.active_only if ActiveModel::Type::Boolean.new.cast(params[:active])
        render json: options.map { |o| FinancingOptionSerializer.new(o).as_json }
      end

      def create
        option = @company.financing_options.new(financing_option_params)
        if option.save
          render json: FinancingOptionSerializer.new(option).as_json, status: :created
        else
          render json: { error: option.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def update
        if @financing_option.update(financing_option_params)
          render json: FinancingOptionSerializer.new(@financing_option).as_json
        else
          render json: { error: @financing_option.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def destroy
        @financing_option.destroy
        head :no_content
      end

      def compare
        ids = Array(params[:ids]).map(&:to_i).uniq
        options = @company.financing_options.where(id: ids)
        sorted = options.sort_by { |o| [o.interest_rate_percent || Float::INFINITY, -(o.max_term_months || 0)] }
        render json: { options: sorted.map { |o| FinancingOptionSerializer.new(o).as_json } }
      end

      def simulate
        amount = params[:amount].to_f
        months_param = params[:months].to_i
        audience_param = params[:audience]

        Rails.logger.info("[Financing] simulate START company_id=#{params[:company_id]} amount=#{amount} months=#{months_param} audience=#{audience_param}")

        audience = normalize_audience(audience_param)

        errors = []
        errors << 'Valor deve ser maior que 0' if amount <= 0
        errors << 'Prazo deve ser maior que 0' if months_param <= 0
        return render json: { errors: errors }, status: :unprocessable_entity if errors.any?

        # Verificar se company existe
        unless @company
          Rails.logger.error("[Financing] Company not found: #{params[:company_id]}")
          return render json: { error: 'Empresa não encontrada' }, status: :not_found
        end

        scope = @company.financing_options
        Rails.logger.info("[Financing] Total financing_options for company: #{scope.count}")

        scope = scope.active_only
        Rails.logger.info("[Financing] Active financing_options: #{scope.count}")

        if audience.present?
          scope = scope.where(target_audience: audience)
          Rails.logger.info("[Financing] After audience filter (#{audience}): #{scope.count}")
        end

        cache_key = [
          'company', @company.id, 'financing_simulation',
          audience.presence || 'all', amount.round(2), months_param
        ].join(':')

        payload = Rails.cache.fetch(cache_key, expires_in: 10.minutes) do
          options = scope.to_a
          Rails.logger.info("[Financing] Options to simulate: #{options.count}")

          if options.empty?
            Rails.logger.warn('[Financing] No financing options available for simulation')
            { best: nil, options: [], ranking: [], message: 'Nenhuma opção de financiamento disponível' }
          else
            results = options.map do |o|
              months = months_param.positive? ? months_param : (o.max_term_months || 12)
              rate_percent = (o.interest_rate_percent || 0).to_f
              i = rate_percent / 100.0
              monthly_payment =
                if i.positive?
                  denom = (1 - ((1 + i)**(-months)))
                  denom.zero? ? 0.0 : (amount * i / denom)
                else
                  months.zero? ? 0.0 : (amount / months.to_f)
                end
              total_cost = monthly_payment * months
              cet_annual_percent = i.positive? ? (((1 + i)**12) - 1) * 100.0 : 0.0

              {
                id: o.id,
                company_id: o.company_id,
                institution_name: o.institution_name,
                credit_line: o.credit_line,
                target_audience: o.target_audience,
                max_term_months: o.max_term_months,
                grace_period_months: o.grace_period_months,
                interest_rate_percent: o.interest_rate_percent,
                interest_rate_details: o.interest_rate_details,
                active: o.active,
                monthly_payment: monthly_payment.round(2),
                total_cost: total_cost.round(2),
                cet_annual_percent: cet_annual_percent.round(2)
              }
            rescue StandardError => e
              Rails.logger.error("[Financing] Error calculating option #{o.id}: #{e.message}")
              nil
            end.compact

            if results.empty?
              Rails.logger.error('[Financing] All calculations failed')
              return { best: nil, options: [], ranking: [], error: 'Erro ao calcular simulações' }
            end

            min_rate = results.map { |x| (x[:interest_rate_percent] || 0).to_f }.min
            min_payment = results.map { |x| x[:monthly_payment] }.min
            max_term = results.map { |x| (x[:max_term_months] || 0).to_i }.max

            ranking = results.map do |r|
              rate = (r[:interest_rate_percent] || 0).to_f
              prazo = (r[:max_term_months] || 0).to_i
              carencia = (r[:grace_period_months] || 0).to_i
              score = (0.7 * rate) - (0.2 * prazo) - (0.1 * carencia)
              reason = []
              reason << 'Taxa baixa' if min_rate && rate <= min_rate
              reason << 'Parcela menor' if min_payment && r[:monthly_payment] <= min_payment
              reason << 'Prazo longo' if max_term && prazo >= max_term
              { id: r[:id], score: score.round(3), reason: reason.join(', ') }
            end.sort_by { |x| x[:score] }

            best_result = results.find { |r| r[:id] == (ranking.first && ranking.first[:id]) }

            {
              best: best_result,
              options: results,
              ranking: ranking
            }
          end
        end

        Rails.logger.info(
          "[Financing] simulate SUCCESS company=#{@company.id} audience=#{audience} amount=#{amount} months=#{months_param} results=#{payload[:options]&.count || 0}"
        )

        render json: payload
      rescue ActiveRecord::RecordNotFound => e
        Rails.logger.error("[Financing] Record not found: #{e.message}")
        render json: { error: 'Recurso não encontrado' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error(
          "[Financing] simulate ERROR company=#{params[:company_id]} error=#{e.class}: #{e.message}\nBacktrace: #{e.backtrace.first(5).join("\n")}"
        )
        render json: { error: 'Erro interno na simulação', details: e.message }, status: :internal_server_error
      end

      private

      def set_company
        @company = ::Company.find(params[:company_id])
      end

      def set_financing_option
        @financing_option = @company.financing_options.find(params[:id])
      end

      def financing_option_params
        params.require(:financing_option).permit(
          :institution_name, :credit_line, :target_audience,
          :max_term_months, :grace_period_months,
          :interest_rate_percent, :interest_rate_details,
          :active, :service_filters, :project_filters, :category_filters
        )
      end

      def normalize_audience(value)
        v = value.to_s.strip.downcase
        return 'PF' if %w[pf pessoa_fisica fisica].include?(v)
        return 'PJ' if %w[pj pessoa_juridica juridica].include?(v)
        return 'Rural' if %w[rural campo agro].include?(v)

        value
      end
    end
  end
end
