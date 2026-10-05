# frozen_string_literal: true

module Api
  module V1
    class MarketplaceProposalsController < BaseController
      before_action :authenticate_api_user
      before_action :set_proposal, only: %i[show view accept decline request_change meetings create_meeting]
      before_action :ensure_buyer_access!, only: %i[show view accept decline request_change meetings create_meeting]

      def index
        proposals = visible_buyer_scope.order(created_at: :desc).includes(:company, :lead, :versions, :project)
        render json: { proposals: proposals.map { |proposal| serialize(proposal) } }
      end

      def show
        render json: { proposal: serialize(@proposal, detailed: true) }
      end

      def compare
        raw_ids = params[:ids] || params[:proposal_ids]
        ids = (raw_ids.is_a?(String) ? raw_ids.split(',') : Array(raw_ids)).map(&:to_i).uniq.first(5)
        proposals = visible_buyer_scope.where(id: ids).includes(:company, :lead, :versions)
        render json: { proposals: proposals.map { |proposal| serialize(proposal, detailed: true) } }
      end

      def view
        @proposal.mark_viewed!(actor: current_user)
        render json: { proposal: serialize(@proposal.reload, detailed: true) }
      end

      def accept
        perform_decision('accepted')
      end

      def decline
        perform_decision('declined', params[:reason])
      end

      def request_change
        perform_decision('request_change', params[:reason])
      end

      def meetings
        render json: { meetings: @proposal.meetings.order(created_at: :desc).map { |meeting| meeting_json(meeting) } }
      end

      def create_meeting
        meeting = @proposal.meetings.create!(
          buyer_user: current_user,
          company: @proposal.company,
          meeting_type: params[:meeting_type].presence || 'video',
          scheduled_at: parse_time(params[:scheduled_at]),
          notes: params[:notes].to_s.truncate(1000)
        )
        @proposal.update!(status: 'meeting_scheduled') unless @proposal.status == 'accepted'
        @proposal.record_event('meeting.requested', actor: current_user, metadata: { meeting_id: meeting.id })
        render json: { meeting: meeting_json(meeting) }, status: :created
      rescue ArgumentError
        render json: { error: 'Horário inválido' }, status: :unprocessable_entity
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      private

      def set_proposal
        @proposal = MarketplaceProposal.includes(:lead, :company, :versions, :project, :meetings).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Proposta não encontrada' }, status: :not_found
      end

      def visible_buyer_scope
        buyer_scope.where.not(status: 'draft')
      end

      def buyer_scope
        MarketplaceProposal.joins(:lead).where(
          'marketplace_proposals.buyer_user_id = :id OR LOWER(leads.email) = LOWER(:email)',
          id: current_user.id,
          email: current_user.email.to_s
        )
      end

      def ensure_buyer_access!
        action = %w[create_meeting meetings].include?(action_name) ? :meeting? : :show?
        authorize @proposal, action
        return if @proposal.status != 'draft' && (current_user&.admin? || buyer_scope.where(id: @proposal.id).exists?)

        render json: { error: 'Você não tem acesso a esta proposta' }, status: :forbidden
      end

      def perform_decision(kind, reason = nil)
        proposal = Marketplace::ProposalDecisionService.new(
          proposal: @proposal, buyer: current_user, kind: kind, reason: reason
        ).call
        render json: { proposal: serialize(proposal, detailed: true) }
      rescue ArgumentError => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      def serialize(proposal, detailed: false)
        payload = base_payload(proposal)
        return payload unless detailed

        payload.merge(
          project: project_json(proposal.project),
          meetings: proposal.meetings.order(created_at: :desc).map { |meeting| meeting_json(meeting) }
        )
      end

      def base_payload(proposal)
        {
          id: proposal.id,
          reference: proposal.reference,
          status: proposal.status,
          total_cents: proposal.total_cents,
          currency: proposal.currency,
          expires_at: proposal.expires_at,
          published_at: proposal.published_at,
          created_at: proposal.created_at,
          company: company_payload(proposal),
          request: request_payload(proposal),
          version: version_json(proposal.current_version),
          versions: versions_json(proposal)
        }
      end

      def company_payload(proposal)
        {
          id: proposal.company_id,
          name: proposal.company.name,
          logo_url: proposal.company.try(:logo_url)
        }
      end

      def request_payload(proposal)
        {
          id: proposal.lead_id,
          vertical: proposal.lead.product_vertical,
          project_profile: proposal.lead.project_profile,
          city: proposal.lead.city,
          state: proposal.lead.state,
          created_at: proposal.lead.created_at
        }
      end

      def versions_json(proposal)
        proposal.versions.where(status: 'published').order(number: :desc).map do |version|
          version_json(version)
        end
      end

      def version_json(version)
        return nil unless version

        {
          id: version.id,
          number: version.number,
          status: version.status,
          title: version.title,
          summary: version.summary,
          total_cents: version.total_cents,
          currency: version.currency,
          valid_until: version.valid_until,
          published_at: version.published_at,
          items: version.items.order(:position, :id).map do |item|
            item.as_json(only: %i[id kind name description quantity unit unit_price_cents total_cents position])
          end,
          terms: version.terms.order(:position, :id).map do |term|
            term.as_json(only: %i[id key label value position])
          end
        }
      end

      def project_json(project)
        return nil unless project

        {
          id: project.id,
          status: project.status,
          started_at: project.started_at,
          completed_at: project.completed_at,
          milestones: project.milestones.order(:position, :id).map do |milestone|
            milestone.as_json(only: %i[id key title status position scheduled_at completed_at notes])
          end
        }
      end

      def meeting_json(meeting)
        meeting.as_json(only: %i[id meeting_type status scheduled_at notes created_at])
      end

      def parse_time(value)
        return nil if value.blank?

        Time.zone.parse(value.to_s)
      end
    end
  end
end
