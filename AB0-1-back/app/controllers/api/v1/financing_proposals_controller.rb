module Api
  module V1
    class FinancingProposalsController < BaseController
      before_action :set_company

      def create
        Rails.logger.info("[Financing] Proposal create START company_id=#{params[:company_id]} params=#{proposal_params.inspect}")

        attrs = proposal_params
        option_id = attrs[:option_id].presence&.to_i
        amount = attrs[:amount].to_f
        months = attrs[:months].to_i
        audience = attrs[:audience].to_s.presence
        entry = attrs[:entry].to_f
        name = attrs[:name].to_s.strip
        email = attrs[:email].to_s.strip
        phone = attrs[:phone].to_s.strip
        use_type = attrs[:use_type].to_s.presence
        project_amount = attrs[:project_amount].presence&.to_f
        phone_digits = phone.gsub(/\D/, '')

        errors = []
        errors << 'Nome obrigatorio' if name.length < 2
        errors << 'Email invalido' if email.blank? || email !~ ::Lead::SIMPLE_EMAIL_REGEX
        errors << 'Telefone invalido' if phone_digits.length < 10
        errors << 'Valor do financiamento invalido' if amount <= 0
        errors << 'Prazo invalido' if months < 6 || months > 120
        errors << 'Entrada invalida' if entry.negative?
        errors << 'Valor do projeto invalido' if project_amount && project_amount <= 0
        errors << 'Entrada invalida' if project_amount && entry > project_amount
        errors << 'Valor do financiamento invalido' if project_amount && amount > project_amount

        if errors.any?
          Rails.logger.warn("[Financing] Proposal validation errors: #{errors.join(', ')}")
          return render json: { errors: errors }, status: :unprocessable_entity
        end

        project_amount ||= amount + entry

        payload = {
          type: 'financing_proposal',
          option_id: option_id,
          financed_amount: amount,
          months: months,
          audience: audience,
          entry: entry,
          project_amount: project_amount,
          use_type: use_type
        }.compact

        lead = ::Lead.create!(
          name: name.presence || 'Solicitante',
          email: email,
          phone: phone_digits,
          company_id: @company.id,
          message: payload.to_json,
          wizard_status: 'proposal_submitted'
        )

        # Tentar enfileirar job, mas não falhar se Sidekiq não estiver disponível
        begin
          SubmitFinancingProposalJob.perform_later(lead.id, option_id)
        rescue StandardError => e
          Rails.logger.warn("[Financing] Could not enqueue job: #{e.message}")
        end

        Rails.logger.info("[Financing] Proposal SUCCESS company=#{@company.id} lead=#{lead.id} option=#{option_id}")
        render json: { proposal_id: lead.id, status: lead.wizard_status }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        Rails.logger.error("[Financing] Proposal validation failed: #{e.message}")
        render json: { error: 'Erro ao salvar proposta', details: e.message }, status: :unprocessable_entity
      rescue StandardError => e
        Rails.logger.error("[Financing] Proposal ERROR: #{e.class} - #{e.message}\n#{e.backtrace.first(5).join("\n")}")
        render json: { error: 'Erro ao criar proposta', details: e.message }, status: :internal_server_error
      end

      def status
        lead = ::Lead.find(params[:id])
        render json: { proposal_id: lead.id, status: lead.wizard_status }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Proposta não encontrada' }, status: :not_found
      end

      private

      def set_company
        @company = ::Company.find(params[:company_id])
      end

      def proposal_params
        params.permit(
          :option_id,
          :amount,
          :months,
          :audience,
          :entry,
          :name,
          :email,
          :phone,
          :use_type,
          :project_amount
        )
      end
    end
  end
end
