# frozen_string_literal: true

module Api
  module V1
    class MarketplaceProposalsController < BaseController
      include MarketplaceDocumentDownload
      before_action :authenticate_api_user
      before_action :set_proposal, only: %i[show view accept decline request_change meetings create_meeting download_document]
      before_action :ensure_buyer_access!, only: %i[show view accept decline request_change meetings create_meeting download_document]

      def index
        proposals = with_details(visible_buyer_scope.order(created_at: :desc))
        render json: { proposals: proposals.map { |proposal| serialize(proposal, detailed: true) } }
      end

      def show
        render json: { proposal: serialize(@proposal, detailed: true) }
      end

      def compare
        raw_ids = params[:ids] || params[:proposal_ids]
        ids = (raw_ids.is_a?(String) ? raw_ids.split(',') : Array(raw_ids)).map(&:to_i).uniq
        if ids.length > 3
          return render json: { error: 'Compare até 3 propostas por vez' }, status: :unprocessable_entity
        end

        proposals = with_details(visible_buyer_scope.where(id: ids))
        if proposals.map(&:lead_id).uniq.size > 1
          return render json: { error: 'Só é possível comparar propostas da mesma solicitação' }, status: :unprocessable_entity
        end

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
        meeting = Marketplace::ProposalMeetingService.new(
          proposal: @proposal, buyer: current_user, attributes: {
            meeting_type: params[:meeting_type].presence || 'video',
            scheduled_at: parse_time(params[:scheduled_at]), notes: params[:notes].to_s.truncate(1000)
          }
        ).call
        render json: { meeting: meeting_json(meeting) }, status: :created
      rescue ArgumentError => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      private

      def set_proposal
        @proposal = with_details(MarketplaceProposal.all).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Proposta não encontrada' }, status: :not_found
      end

      def visible_buyer_scope
        buyer_scope
      end

      def with_details(scope)
        scope.includes(:company, :lead, :meetings, versions: %i[items terms], project: :milestones)
      end

      def buyer_scope
        return MarketplaceProposal.none unless buyer_identity_valid?

        MarketplaceProposal.left_outer_joins(:lead).where(
          'marketplace_proposals.buyer_user_id = :id OR LOWER(leads.email) = LOWER(:email)',
          id: current_user.id,
          email: current_user.email.to_s
        )
      end

      def buyer_identity_valid?
        current_user.active? && current_user.review_user? && current_user.confirmed?
      end

      def ensure_buyer_access!
        action = %w[create_meeting meetings].include?(action_name) ? :meeting? : :show?
        authorize @proposal, action
        return if visible_buyer_scope.where(id: @proposal.id).exists?

        render json: { error: 'Você não tem acesso a esta proposta' }, status: :forbidden
      end

      def perform_decision(kind, reason = nil)
        proposal = Marketplace::ProposalDecisionService.new(
          proposal: @proposal, buyer: current_user, kind: kind, reason: reason, version_id: params[:version_id]
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
          meetings: proposal.meetings.sort_by(&:created_at).reverse.map { |meeting| meeting_json(meeting) }
        )
      end

      def base_payload(proposal)
        published = published_versions(proposal)
        revision_pending = proposal.status == 'draft' && published.any?
        {
          id: proposal.id,
          reference: proposal.reference,
          status: revision_pending ? 'negotiating' : proposal.status,
          revision_pending: revision_pending,
          total_cents: proposal.total_cents,
          currency: proposal.currency,
          expires_at: proposal.expires_at,
          published_at: proposal.published_at,
          created_at: proposal.created_at,
          company: company_payload(proposal),
          request: request_payload(proposal),
          version: version_json(published.first),
          versions: published.map { |version| version_json(version) }
        }
      end

      def company_payload(proposal)
        {
          id: proposal.company_id,
          name: proposal.company.name,
          logo_url: proposal.company.try(:logo_url),
          banner_url: proposal.company.try(:banner_url),
          slug: proposal.company.slug,
          verified: proposal.company.verified?,
          rating_avg: proposal.company.rating_avg,
          reviews_count: proposal.company.reviews_count,
          city: proposal.company.city,
          state: proposal.company.state,
          founded_year: proposal.company.founded_year
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
        published_versions(proposal).map { |version| version_json(version) }
      end

      def published_versions(proposal)
        proposal.versions.select { |version| version.status == 'published' }.sort_by(&:number).reverse
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
          documents: Marketplace::ProposalDocumentService.metadata(version),
          items: version.items.sort_by { |item| [item.position, item.id] }.map do |item|
            item.as_json(only: %i[id kind name description quantity unit unit_price_cents total_cents position])
          end,
          terms: version.terms.sort_by { |term| [term.position, term.id] }.map do |term|
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
          milestones: project.milestones.sort_by { |milestone| [milestone.position, milestone.id] }.map do |milestone|
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
