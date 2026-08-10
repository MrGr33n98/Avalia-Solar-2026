class LeadDistribution < ApplicationRecord
  belongs_to :lead
  belongs_to :company

  enum status: {
    queued: 'queued',
    sent: 'sent',
    failed: 'failed'
  }, _suffix: true

  def self.ransackable_attributes(_auth_object = nil)
    %w[assigned_at company_id created_at id lead_id status updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company lead]
  end
  def rule_explanation
    parts = []
    parts << "categoria=#{lead.category&.name || "todas"}"
    parts << "regiao=#{lead.state.presence || lead.city.presence || "todas"}"
    parts << "score=#{lead.try(:cached_score) || "não calculado"}"
    parts << "empresa=#{company&.name || "não definida"}"
    parts.join(" · ")
  end
end
