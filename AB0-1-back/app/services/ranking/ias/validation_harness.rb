# frozen_string_literal: true

module Ranking
  module Ias
    # ValidationHarness formaliza as invariantes de defensabilidade comercial
    # para qualquer proposta futura de metodologia ou pesos no IAS (Índice de Avaliação Solar).
    # NENHUM SCORE OU PESO É COMPUTADO AQUI.
    class ValidationHarness
      ValidationResult = Struct.new(
        :approved,
        :double_counting_violations,
        :bias_violations,
        :stability_issues,
        :reasons,
        keyword_init: true
      )

      def self.validate_schema(schema_definition)
        new(schema_definition).validate
      end

      def initialize(schema_definition)
        @schema = schema_definition || {}
      end

      def validate
        double_counting = check_double_counting
        bias = check_organic_bias
        stability = check_stability_bounds

        violations = double_counting + bias + stability
        approved = violations.empty? && @schema[:formula_approved] == true

        reasons = []
        reasons << 'Metodologia não possui aprovação formal do comitê de produto' unless @schema[:formula_approved]
        reasons += violations

        ValidationResult.new(
          approved: approved,
          double_counting_violations: double_counting,
          bias_violations: bias,
          stability_issues: stability,
          reasons: reasons
        )
      end

      private

      def check_double_counting
        violations = []
        signals = @schema[:input_signals] || []
        seen_underlying_fields = Hash.new(0)

        signals.each do |sig|
          source_field = sig[:underlying_field]
          seen_underlying_fields[source_field] += 1 if source_field.present?
        end

        seen_underlying_fields.each do |field, count|
          if count > 1
            violations << "Double-counting detectado: campo '#{field}' utilizado em múltiplos sinais sem isolamento ortogonal."
          end
        end

        violations
      end

      def check_organic_bias
        violations = []
        # Invariante comercial: o ranking orgânico não pode exigir plano pago ou impulsionamento financeiro
        if @schema[:requires_paid_plan] == true
          violations << 'Viés comercial inaceitável: ranking orgânico requer contratação de plano pago.'
        end
        if @schema.dig(:weights, :sponsorship_boost).to_f.positive?
          violations << 'Viés comercial inaceitável: peso financeiro/patrocínio presente no score orgânico.'
        end
        violations
      end

      def check_stability_bounds
        violations = []
        # Garante que a sensibilidade máxima de um único evento seja limitada
        max_daily_churn = @schema.dig(:stability_constraints, :max_single_event_shift_pct).to_f
        if max_daily_churn > 25.0
          violations << "Instabilidade excessiva: impacto de evento único excede 25% (#{max_daily_churn}%)."
        end
        violations
      end
    end
  end
end
