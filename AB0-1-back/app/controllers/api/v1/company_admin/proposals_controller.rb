# frozen_string_literal: true

require 'securerandom'

module Api
  module V1
    module CompanyAdmin
      class ProposalsController < BaseController # rubocop:disable Metrics/ClassLength
        before_action :authenticate_api_user
        before_action :authenticate_company_user_or_admin!
        before_action :set_company
        before_action :authorize_dashboard_access!
        before_action :set_proposal,
                      only: %i[show update send_proposal new_version withdraw meetings update_meeting project
                               update_project update_milestone]
        before_action :ensure_company_access!,
                      only: %i[show update send_proposal new_version withdraw meetings update_meeting project
                               update_project update_milestone]

        def index
          authorize @company, :view_leads?
          proposals = @company.marketplace_proposals.includes(:lead, :company, :versions).order(created_at: :desc)
          render json: { proposals: proposals.map { |proposal| serialize(proposal) } }
        end

        def lead_distributions
          authorize @company, :view_leads?
          distributions = @company.lead_distributions.includes(:lead).where(
            status: %w[sent viewed accepted]
          ).order(assigned_at: :desc)
          render json: {
            distributions: distributions.map do |distribution|
              {
                id: distribution.id,
                status: distribution.status,
                assigned_at: distribution.assigned_at,
                lead: distribution.lead.as_json(only: %i[id name email phone product_vertical project_profile city
                                                         state address_full monthly_kwh bill_value])
              }
            end
          }
        end

        def show
          render json: { proposal: serialize(@proposal) }
        end

        def create
          authorize @company, :view_leads?
          distribution = @company.lead_distributions.includes(:lead).find(params[:lead_distribution_id])
          return unavailable_distribution unless distribution_available?(distribution)

          proposal = @company.marketplace_proposals.find_or_initialize_by(lead_id: distribution.lead_id)
          create_draft_proposal(proposal, distribution) if proposal.new_record?
          render json: { proposal: serialize(proposal.reload) }, status: :created
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Distribuição não encontrada' }, status: :not_found
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def unavailable_distribution
          render json: { error: 'Distribuição não está disponível para proposta' }, status: :unprocessable_entity
        end

        def distribution_available?(distribution)
          %w[sent viewed accepted].include?(distribution.status)
        end

        def create_draft_proposal(proposal, distribution)
          proposal.assign_attributes(
            lead_distribution: distribution,
            buyer_user: User.find_by(email: distribution.lead.email),
            created_by: current_user,
            reference: "AS-#{Time.current.year}-#{SecureRandom.hex(4).upcase}",
            status: 'draft'
          )
          proposal.save!
          distribution.accept! if distribution.sent_status? || distribution.viewed_status?
          proposal.versions.create!(
            number: 1,
            title: 'Proposta para seu projeto',
            summary: 'Descreva aqui a solução proposta.'
          )
          proposal.update!(current_version_number: 1)
        end

        def update
          authorize @proposal, :update?
          unless @proposal.status == 'draft'
            return render json: { error: 'A proposta publicada deve receber uma nova versão' },
                          status: :unprocessable_entity
          end

          version = @proposal.current_version || @proposal.versions.create!(number: 1,
                                                                            title: 'Proposta para seu projeto')
          payload = proposal_params
          @proposal.with_lock do
            version.update!(payload.slice(:title, :summary, :valid_until))
            replace_items(version, payload[:items]) if payload.key?(:items)
            replace_terms(version, payload[:terms]) if payload.key?(:terms)
          end
          render json: { proposal: serialize(@proposal.reload) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def send_proposal
          authorize @proposal, :send?
          @proposal.publish!
          @proposal.lead.update!(wizard_status: 'proposal_sent') if @proposal.lead.respond_to?(:wizard_status=)
          render json: { proposal: serialize(@proposal.reload) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def new_version
          authorize @proposal, :new_version?
          if %w[accepted declined withdrawn not_selected closed_after_selection].include?(@proposal.status)
            return render json: { error: 'Esta proposta já foi encerrada para negociação' },
                          status: :unprocessable_entity
          end

          current = @proposal.current_version
          number = @proposal.versions.maximum(:number).to_i + 1
          version = @proposal.versions.create!(
            number: number,
            title: current&.title || 'Nova versão da proposta',
            summary: current&.summary,
            valid_until: current&.valid_until
          )
          current&.items&.find_each do |item|
            version.items.create!(item.attributes.slice('kind', 'name', 'description', 'quantity', 'unit',
                                                        'unit_price_cents', 'position'))
          end
          current&.terms&.find_each do |term|
            version.terms.create!(term.attributes.slice('key', 'label', 'value', 'position'))
          end
          @proposal.update!(status: 'draft', current_version_number: number)
          render json: { proposal: serialize(@proposal.reload) }, status: :created
        end

        def withdraw
          authorize @proposal, :withdraw?
          @proposal.update!(status: 'withdrawn', withdrawn_at: Time.current)
          @proposal.record_event('proposal.withdrawn', actor: current_user)
          render json: { proposal: serialize(@proposal.reload) }
        end

        def meetings
          authorize @proposal, :show?
          render json: { meetings: @proposal.meetings.order(created_at: :desc).map { |meeting| meeting_json(meeting) } }
        end

        def update_meeting
          authorize @proposal, :update?
          meeting = @proposal.meetings.find(params[:meeting_id])
          meeting.update!(meeting_update_params)
          @proposal.record_event('meeting.updated', actor: current_user,
                                                    metadata: { meeting_id: meeting.id, status: meeting.status })
          render json: { proposal: serialize(@proposal.reload) }
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Reunião não encontrada' }, status: :not_found
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def project
          authorize @proposal, :show?
          render json: { proposal: serialize(@proposal.reload) }
        end

        def update_project
          authorize @proposal, :update?
          project = @proposal.project || @proposal.create_project!(lead: @proposal.lead, company: @proposal.company,
                                                                   status: 'in_progress')
          project.update!(project_update_params)
          @proposal.record_event('project.updated', actor: current_user, metadata: { status: project.status })
          render json: { proposal: serialize(@proposal.reload) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def update_milestone
          authorize @proposal, :update?
          project = @proposal.project
          return render json: { error: 'Projeto ainda não iniciado' }, status: :unprocessable_entity unless project

          milestone = project.milestones.find(params[:milestone_id])
          milestone.update!(milestone_update_params)
          sync_project_status!(project)
          @proposal.record_event(
            'project.milestone_updated',
            actor: current_user,
            metadata: { milestone_id: milestone.id, status: milestone.status }
          )
          render json: { proposal: serialize(@proposal.reload) }
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Etapa não encontrada' }, status: :not_found
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        private

        def set_proposal
          @proposal = @company.marketplace_proposals.includes(:lead, :versions, :meetings,
                                                              project: :milestones).find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Proposta não encontrada' }, status: :not_found
        end

        def set_company
          @company = current_user.admin? ? admin_company : member_company
          return if performed?

          render json: { error: 'Company not found' }, status: :not_found unless @company
        end

        def admin_company
          proposal_company_id = MarketplaceProposal.where(id: params[:id]).pick(:company_id) if params[:id].present?
          ::Company.find_by(id: params[:company_id] || proposal_company_id)
        end

        def member_company
          requested_id = params[:company_id].presence
          return company_for_requested_id(requested_id) if requested_id.present?

          fallback_id = cookies.signed[:active_company_id] || current_user.company_id
          company = if fallback_id.present? && current_user.active_membership_for?(fallback_id)
                      ::Company.find_by(id: fallback_id)
                    end
          company || current_user.active_member_companies.first
        end

        def company_for_requested_id(company_id)
          unless current_user.active_membership_for?(company_id)
            render json: { error: 'Company access required' }, status: :forbidden
            return
          end

          ::Company.find_by(id: company_id)
        end

        def authenticate_company_user_or_admin!
          return if current_user&.admin?

          return render(json: { error: 'Unauthorized' }, status: :unauthorized) unless current_user
          return render(json: { error: 'Access pending approval' }, status: :forbidden) unless current_user.active?
          return if current_user.active_member_companies.exists? || current_user.company.present?

          render json: { error: 'Company access required' }, status: :forbidden
        end

        def authorize_dashboard_access!
          authorize @company, :view_dashboard? if @company
        end

        def ensure_company_access!
          return if admin_or_company_owner?
          return if active_member_has_proposal_access?

          render json: { error: 'Você não tem acesso a esta proposta' }, status: :forbidden
        end

        def admin_or_company_owner?
          current_user&.admin? || current_user&.company_id.to_i == @proposal.company_id
        end

        def active_member_has_proposal_access?
          current_user&.company_user? && current_user.active_membership_for?(@proposal.company_id)
        end

        def proposal_params
          params.require(:proposal).permit(
            :title, :summary, :valid_until,
            items: %i[kind name description quantity unit unit_price_cents position],
            terms: %i[key label value position]
          )
        end

        def replace_items(version, items)
          version.items.delete_all
          Array(items).each_with_index do |item, index|
            version.items.create!(item.merge(position: item[:position] || index))
          end
        end

        def replace_terms(version, terms)
          version.terms.delete_all
          Array(terms).each_with_index do |term, index|
            version.terms.create!(term.merge(position: term[:position] || index))
          end
        end

        def serialize(proposal)
          version = proposal.current_version
          {
            id: proposal.id,
            reference: proposal.reference,
            status: proposal.status,
            total_cents: proposal.total_cents,
            currency: proposal.currency,
            expires_at: proposal.expires_at,
            published_at: proposal.published_at,
            created_at: proposal.created_at,
            lead_distribution_id: proposal.lead_distribution_id,
            company: { id: proposal.company_id, name: proposal.company.name },
            lead: proposal.lead.as_json(only: %i[id name email phone product_vertical project_profile city state
                                                 address_full monthly_kwh bill_value]),
            version: version_json(version),
            versions: proposal.versions.order(number: :desc).map { |item| version_json(item) },
            project: project_json(proposal.project),
            meetings: proposal.meetings.order(created_at: :desc).map { |meeting| meeting_json(meeting) }
          }
        end

        def meeting_json(meeting)
          meeting.as_json(only: %i[id meeting_type status scheduled_at notes created_at])
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

        def meeting_update_params
          params.permit(:status, :scheduled_at, :notes)
        end

        def project_update_params
          params.permit(:status, :started_at, :completed_at)
        end

        def milestone_update_params
          params.permit(:status, :scheduled_at, :completed_at, :notes)
        end

        def sync_project_status!(project)
          statuses = project.milestones.pluck(:status)
          status = if statuses.present? && statuses.all? { |value| value == 'completed' }
                     'completed'
                   elsif statuses.any? { |value| value.in?(%w[current completed]) }
                     'in_progress'
                   else
                     project.status
                   end
          project.update!(status: status, completed_at: status == 'completed' ? Time.current : nil)
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
            items: version.items.order(:position, :id).map do |item|
              item.as_json(only: %i[id kind name description quantity unit unit_price_cents total_cents position])
            end,
            terms: version.terms.order(:position, :id).map do |term|
              term.as_json(only: %i[id key label value position])
            end
          }
        end
      end
    end
  end
end
