# frozen_string_literal: true

module Api
  module V1
    # Tenant-owned Intent Sync product, NOT the internal Sales CRM.
    #
    # This foundation deliberately cannot transmit data to advertising platforms:
    # credentials, OAuth callback, eligibility approval and provider adapters are
    # not implemented. All synchronization attempts fail closed.
    class DemandActivationController < BaseController
      before_action :authenticate_api_user
      before_action :resolve_company_and_membership!
      before_action :require_rollout_and_entitlement!, except: :status
      before_action :require_manage_role!, only: %i[create_source update_audience archive_audience]

      def status
        rollout = ENV['INTENT_SYNC_ENABLED'] == 'true'
        entitled = EntitlementService.entitled?(company: @company, feature: 'intent_sync')
        permitted = rollout && entitled

        render json: {
          company_id: @company.id,
          available: permitted,
          draft_only: permitted,
          sync_enabled: false,
          reason: if !rollout
                    'rollout_disabled'
                  elsif !entitled
                    'upgrade_required'
                  else
                    'provider_approval_pending'
                  end,
          roles: { membership: @membership&.role || 'owner' },
          capabilities: {
            create_draft: permitted,
            sync: false,
            oauth: false,
            source_import: false
          },
          providers: %w[linkedin meta google].map { |provider| { key: provider, status: 'not_connected', operational: false } }
        }
      end

      def sources
        render json: {
          sources: ::DemandActivation::Source.where(company_id: @company.id)
            .order(created_at: :desc).limit(100)
            .map { |source| source_payload(source) }
        }
      end

      # Metadata only: no uploads or contact identifiers.
      # A pending source is never eligible for outbound activation.
      def create_source
        source = ::DemandActivation::Source.new(
          source_params.merge(
            company: @company,
            created_by: current_user,
            kind: 'company_first_party',
            verification_status: 'pending',
            active: false
          )
        )
        if source.save
          render json: { source: source_payload(source) }, status: :created
        else
          render_error_response(message: source.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'SOURCE_INVALID')
        end
      end

      def audiences
        page = [params.fetch(:page, 1).to_i, 1].max
        page_size = [[params.fetch(:per_page, 20).to_i, 1].max, 50].min
        scope = ::DemandActivation::AudienceSegment.where(company_id: @company.id)
        scope = scope.where(status: 'draft') unless params[:include_archived] == 'true'
        total = scope.count
        segments = scope.order(updated_at: :desc).offset((page - 1) * page_size).limit(page_size)

        render json: {
          audiences: segments.map { |segment| audience_payload(segment) },
          pagination: { page: page, per_page: page_size, total: total, total_pages: (total.to_f / page_size).ceil }
        }
      end

      def create_audience
        return reject_unsafe_filters if unsafe_filters?

        segment = ::DemandActivation::AudienceSegment.new(
          audience_attributes.merge(company: @company, created_by: current_user, status: 'draft')
        )
        if segment.save
          render json: { audience: audience_payload(segment) }, status: :created
        else
          render_error_response(message: segment.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'AUDIENCE_INVALID')
        end
      end

      def update_audience
        return reject_unsafe_filters if unsafe_filters?

        segment = scoped_audiences.find(params[:id])
        return render_error_response(message: 'Audiência arquivada', status: :conflict, code: 'AUDIENCE_ARCHIVED') unless segment.editable?

        segment.assign_attributes(audience_attributes)
        if segment.save
          render json: { audience: audience_payload(segment) }
        else
          render_error_response(message: segment.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'AUDIENCE_INVALID')
        end
      rescue ActiveRecord::StaleObjectError
        render_error_response(message: 'Audiência alterada em outra sessão. Atualize a página.', status: :conflict, code: 'AUDIENCE_STALE')
      end

      def archive_audience
        segment = scoped_audiences.find(params[:id])
        segment.update!(status: 'archived')
        render json: { audience: audience_payload(segment) }
      end

      def connections
        # No live connections should be inferred from existing GA4 or user OAuth.
        render json: {
          connections: %w[linkedin meta google].map do |provider|
            { provider: provider, status: 'not_connected', operational: false, account: nil }
          end
        }
      end

      def sync_history
        jobs = ::DemandActivation::SyncJob.where(company_id: @company.id).order(created_at: :desc).limit(50)
        render json: {
          jobs: jobs.map do |job|
            job.as_json(only: %i[id audience_segment_id status accepted_count rejected_count matched_count error_code created_at updated_at])
          end
        }
      end

      def synchronize
        # Explicitly refuse external activation until provider/legal approval,
        # data source verification, token vault and deletion reconciliation exist.
        render_error_response(
          message: 'Sincronização indisponível: integração e aprovação pendentes.',
          status: :conflict,
          code: 'INTENT_SYNC_NOT_READY'
        )
      end

      private

      def resolve_company_and_membership!
        @company = ::Company.find(params.require(:company_id))
        authorize @company, :view_dashboard?
        @membership = ::CompanyMember.active.find_by(company_id: @company.id, user_id: current_user.id)
        owner = current_user.respond_to?(:owner_of?) && current_user.owner_of?(@company)
        return if @membership || owner

        render_error_response(message: 'Vínculo ativo com a empresa obrigatório', status: :forbidden, code: 'COMPANY_MEMBER_REQUIRED')
      end

      def require_rollout_and_entitlement!
        unless ENV['INTENT_SYNC_ENABLED'] == 'true'
          return render_error_response(message: 'Intent Sync ainda não disponível', status: :forbidden, code: 'INTENT_SYNC_ROLLOUT_DISABLED')
        end
        return if EntitlementService.entitled?(company: @company, feature: 'intent_sync')

        render_error_response(message: 'Recurso indisponível no plano da empresa', status: :forbidden, code: 'INTENT_SYNC_UPGRADE_REQUIRED')
      end

      def require_manage_role!
        return if @membership&.role.in?(%w[owner manager])
        return if current_user.respond_to?(:owner_of?) && current_user.owner_of?(@company)

        render_error_response(message: 'Ação reservada ao responsável da empresa', status: :forbidden, code: 'INTENT_SYNC_ROLE_FORBIDDEN')
      end

      def unsafe_filters?
        raw = params.dig(:audience, :filter_definition)
        raw.respond_to?(:keys) && (raw.keys.map(&:to_s) - %w[region segment customer_type]).any?
      end

      def reject_unsafe_filters
        render_error_response(
          message: 'Filtro não permitido. Identificadores pessoais não são aceitos.',
          status: :unprocessable_entity,
          code: 'INTENT_SYNC_FILTER_BLOCKED'
        )
      end

      def scoped_audiences
        ::DemandActivation::AudienceSegment.where(company_id: @company.id)
      end

      def source_params
        params.require(:source).permit(:name, provenance: %i[purpose legal_basis attestation_version policy_version])
      end

      def audience_attributes
        permitted = params.require(:audience).permit(:name, :source_id, :lock_version, filter_definition: %i[region segment customer_type]).to_h
        if permitted['source_id'].present?
          permitted['source'] = ::DemandActivation::Source.where(company_id: @company.id).find(permitted.delete('source_id'))
        else
          permitted.delete('source_id')
        end
        permitted
      end

      def source_payload(source)
        source.as_json(only: %i[id name kind verification_status active created_at updated_at])
      end

      def audience_payload(segment)
        segment.as_json(only: %i[id name status source_id filter_definition version lock_version created_at updated_at])
      end
    end
  end
end
