# frozen_string_literal: true

require 'csv'
require 'digest'

module Api
  module V1
    module CompanyAdmin
      class ContentLeadsController < BaseController
        before_action -> { require_company_feature!('content_intent_analytics') }

        def index
          authorize ContentLead.new(company: @company), :index?
          leads = policy_scope(@company.content_leads).order(last_seen_at: :desc, created_at: :desc)
          leads = leads.where('email ILIKE :query OR name ILIKE :query OR company_name ILIKE :query', query: "%#{params[:q].to_s.strip}%") if params[:q].to_s.strip.present?
          page = [params[:page].to_i, 1].max
          per_page = [[params[:per_page].to_i, 25].max, 100].min
          total = leads.count
          records = leads.offset((page - 1) * per_page).limit(per_page).to_a
          download_counts = @company.material_downloads.where(content_lead_id: records.map(&:id)).group(:content_lead_id).count

          render json: {
            leads: records.map { |lead| serialize(lead, download_counts[lead.id] || 0) },
            pagination: { page: page, per_page: per_page, total: total, total_pages: (total.to_f / per_page).ceil }
          }
        end

        def export
          authorize ContentLead.new(company: @company), :export?
          leads = filtered_leads
          download_counts = @company.material_downloads.where(content_lead_id: leads.select(:id)).group(:content_lead_id).count
          csv = CSV.generate(headers: true) do |rows|
            rows << %w[nome email telefone empresa downloads ultimo_interesse]
            leads.find_each do |lead|
              rows << [lead.name, lead.email, lead.phone, lead.company_name, download_counts[lead.id] || 0, lead.last_seen_at&.iso8601].map { |value| csv_value(value) }
            end
          end
          ContentLeadExport.create!(
            company: @company,
            actor: current_user,
            filters: export_filters,
            row_count: leads.count,
            ip_hash: Digest::SHA256.hexdigest(request.remote_ip.to_s),
            user_agent_hash: Digest::SHA256.hexdigest(request.user_agent.to_s)
          )
          send_data csv, filename: "leads_#{@company.id}_#{Time.current.to_date}.csv", type: 'text/csv; charset=utf-8'
        end

        private

        def serialize(lead, download_count)
          lead.as_json(only: %i[id name email phone company_name consents last_seen_at created_at]).merge(download_count: download_count)
        end

        def filtered_leads
          leads = policy_scope(@company.content_leads).order(last_seen_at: :desc, created_at: :desc)
          return leads unless params[:q].to_s.strip.present?

          leads.where('email ILIKE :query OR name ILIKE :query OR company_name ILIKE :query', query: "%#{params[:q].to_s.strip}%")
        end

        def export_filters
          { q: params[:q].to_s.strip.presence }.compact
        end

        def csv_value(value)
          string = value.to_s
          string.match?(/\A[=+\-@]/) ? "'#{string}" : string
        end
      end
    end
  end
end
