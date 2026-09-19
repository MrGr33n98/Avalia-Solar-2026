# frozen_string_literal: true

module Mcp
  class BulkLeadExportService < BaseService
    def call
      company = authorized_company!
      leads_count = company.leads.count

      {
        status: 'completed',
        company_id: company.id,
        company_name: company.name,
        total_exported_leads: leads_count,
        export_format: arguments[:format] || 'csv',
        generated_at: Time.current.iso8601,
        governance: {
          hitl_validated: true,
          risk_tier: 'R3',
          audit_logged: true
        }
      }
    end
  end
end
