# frozen_string_literal: true

module Types
  class FinancingOptionType < Types::BaseObject
    description 'Opção de financiamento oferecida por parceiros ou empresas'

    field :id, ID, null: false
    field :company_id, ID, null: false
    field :company, Types::CompanyType, null: true
    field :institution_name, String, null: false
    field :credit_line, String, null: true
    field :target_audience, String, null: true
    field :max_term_months, Integer, null: true
    field :grace_period_months, Integer, null: true
    field :interest_rate_percent, Float, null: true
    field :interest_rate_details, String, null: true
    field :active, Boolean, null: true
    field :monthly_payment, Float, null: true
    field :total_cost, Float, null: true
    field :cet_annual_percent, Float, null: true

    def id
      object.is_a?(Hash) ? object[:id] : object.id
    end

    def company_id
      object.is_a?(Hash) ? object[:company_id] : object.company_id
    end

    def company
      id_val = object.is_a?(Hash) ? object[:company_id] : object.company_id
      Company.find_by(id: id_val)
    end

    def institution_name
      object.is_a?(Hash) ? object[:institution_name] : object.institution_name
    end

    def credit_line
      object.is_a?(Hash) ? object[:credit_line] : object.credit_line
    end

    def target_audience
      object.is_a?(Hash) ? object[:target_audience] : object.target_audience
    end

    def max_term_months
      object.is_a?(Hash) ? object[:max_term_months] : object.max_term_months
    end

    def grace_period_months
      object.is_a?(Hash) ? object[:grace_period_months] : object.grace_period_months
    end

    def interest_rate_percent
      object.is_a?(Hash) ? object[:interest_rate_percent] : object.interest_rate_percent
    end

    def interest_rate_details
      object.is_a?(Hash) ? object[:interest_rate_details] : object.interest_rate_details
    end

    def active
      object.is_a?(Hash) ? object[:active] : object.active
    end

    def monthly_payment
      object.is_a?(Hash) ? object[:monthly_payment] : nil
    end

    def total_cost
      object.is_a?(Hash) ? object[:total_cost] : nil
    end

    def cet_annual_percent
      object.is_a?(Hash) ? object[:cet_annual_percent] : nil
    end
  end
end
