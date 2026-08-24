module Api
  module V1
    module Reviewer
      class CreatorLeadsController < BaseController
        def index
          leads = CreatorLead.where(creator_user: current_user)
          leads = leads.where(status: params[:status]) if CreatorLead::STATUSES.include?(params[:status].to_s)
          leads = leads.where(source: params[:source]) if params[:source].present?
          leads = leads.where('created_at >= ?', params[:from]) if params[:from].present?
          leads = leads.where('created_at <= ?', params[:to]) if params[:to].present?
          if params[:q].present?
            term = "%#{ActiveRecord::Base.sanitize_sql_like(params[:q].to_s.strip)}%"
            leads = leads.where('name ILIKE :term OR message ILIKE :term', term: term)
          end
          leads = leads.where('id < ?', params[:cursor].to_i) if params[:cursor].present?

          limit = [[params.fetch(:limit, 25).to_i, 1].max, 100].min
          records = leads.recent.limit(limit + 1).to_a
          has_more = records.size > limit
          records = records.first(limit)
          render json: {
            data: records.map { |lead| serialize(lead) },
            meta: { next_cursor: has_more ? records.last&.id&.to_s : nil, has_more: has_more },
            stats: stats
          }
        end

        def update
          lead = CreatorLead.find_by!(id: params[:id], creator_user: current_user)
          status = params.require(:lead).permit(:status)[:status]
          raise ActiveRecord::RecordInvalid, lead unless CreatorLead::STATUSES.include?(status)
          lead.update!(status: status, handled_at: status == 'new' ? nil : (lead.handled_at || Time.current))
          render json: serialize(lead)
        end

        private

        def serialize(lead)
          lead.attributes.except('email', 'phone', 'ip_address', 'user_agent')
        end

        def stats
          scope = CreatorLead.where(creator_user: current_user)
          total = scope.count
          converted = scope.status_converted.count
          { total: total, new: scope.status_new.count, responded: scope.where(status: %w[contacted qualified converted]).count,
            converted: converted, conversion_rate: total.positive? ? ((converted.to_f / total) * 100).round(2) : 0 }
        end
      end
    end
  end
end
