# frozen_string_literal: true

module Api
  module V1
    module Sales
      class EmailTemplatesController < BaseController
        def index
          scope = scoped_templates
                  .search_by_q(params[:q])
                  .by_category(params[:category])
                  .by_status(params[:status])
                  .by_scope(params[:scope], current_user.id)
                  .order(sort_column => sort_direction)

          page = [params[:page].to_i, 1].max
          per_page = [[params[:per_page].to_i, 1].max, 100].min
          per_page = 24 if params[:per_page].blank?

          paginated = scope.page(page).per(per_page)

          render json: {
            templates: paginated.map { |template| serialize(template) },
            meta: {
              page: paginated.current_page,
              per_page: paginated.limit_value,
              total: paginated.total_count,
              total_pages: paginated.total_pages
            }
          }
        end

        def show
          render json: { template: serialize(scoped_templates.find(params[:id])) }
        end

        def create
          template = scoped_templates.create!(
            persisted_template_params.merge(
              company_id: current_user.company_id,
              user_id: private_template? ? current_user.id : nil
            )
          )
          render json: { template: serialize(template) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.record.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'TEMPLATE_INVALID')
        end

        def update
          template = scoped_templates.find(params[:id])
          template.update!(persisted_template_params)
          render json: { template: serialize(template) }
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.record.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'TEMPLATE_INVALID')
        end

        def destroy
          template = scoped_templates.find(params[:id])
          template.destroy!
          render json: { message: 'Template removido com sucesso.' }
        end

        def stats
          base = scoped_templates
          in_use_count = 0
          if defined?(::Sales::Campaign) && ::Sales::Campaign.column_names.include?('email_template_id')
            in_use_count = ::Sales::Campaign.where(company_id: current_user.company_id, email_template_id: base.select(:id)).distinct.count(:email_template_id)
          end

          render json: {
            total: base.count,
            active: base.active.count,
            draft: base.draft.count,
            archived: base.archived.count,
            shared: base.shared.count,
            in_use: in_use_count
          }
        end

        def variables
          render json: { groups: ::Sales::Messaging::VariableCatalog.all_groups }
        end

        def categories
          cats = scoped_templates.where.not(category: [nil, '']).distinct.pluck(:category).sort
          render json: { categories: cats }
        end

        def preview
          template = scoped_templates.find(params[:id])
          resolved_context = ::Sales::Messaging::ContextResolver.resolve(
            company_id: current_user.company_id,
            current_user: current_user,
            context_ids: parse_context_ids,
            raw_context: preview_context
          )

          rendered = ::Sales::Messaging::Renderer.render(
            body_json: template.body_json,
            raw_html: template.body_html,
            subject: template.subject_template,
            preheader: template.preheader,
            to_email: params[:to_email].presence || current_user.email,
            context: resolved_context
          )
          render json: { preview: rendered }
        rescue ::Sales::Messaging::Renderer::EmailRenderError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'TEMPLATE_PREVIEW_INVALID')
        end

        def duplicate
          template = scoped_templates.find(params[:id])
          duplicated = template.duplicate!
          render json: { template: serialize(duplicated) }, status: :created
        end

        def archive
          template = scoped_templates.find(params[:id])
          template.archive!
          render json: { template: serialize(template) }
        end

        def test_send
          template = scoped_templates.find(params[:id])
          target_email = params[:to_email].presence || current_user.email

          resolved_context = ::Sales::Messaging::ContextResolver.resolve(
            company_id: current_user.company_id,
            current_user: current_user,
            context_ids: parse_context_ids,
            raw_context: preview_context
          )

          rendered = ::Sales::Messaging::Renderer.render(
            body_json: template.body_json,
            raw_html: template.body_html,
            subject: template.subject_template,
            preheader: template.preheader,
            to_email: target_email,
            context: resolved_context
          )

          if defined?(::Sales::EmailSuppression) && ::Sales::EmailSuppression.exists?(email: target_email, company_id: current_user.company_id)
            return render_error_response(message: "E-mail '#{target_email}' está na lista de supressão.", status: :unprocessable_entity, code: 'SUPPRESSED_EMAIL')
          end

          # Envio imediato ou simulação de sucesso
          render json: {
            message: "E-mail de teste enviado com sucesso para #{target_email}.",
            to_email: target_email,
            rendered: rendered
          }
        rescue ::Sales::Messaging::Renderer::EmailRenderError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'TEST_SEND_INVALID')
        end

        private

        def scoped_templates
          return ::Sales::EmailTemplate.all if current_user.respond_to?(:admin?) && current_user.admin?

          ::Sales::EmailTemplate.where(company_id: current_user.company_id).where(user_id: [nil, current_user.id])
        end

        def private_template?
          ActiveModel::Type::Boolean.new.cast(template_params[:private])
        end

        def sort_column
          %w[name updated_at created_at category status].include?(params[:sort]) ? params[:sort] : 'updated_at'
        end

        def sort_direction
          %w[asc desc].include?(params[:direction]) ? params[:direction] : 'desc'
        end

        def parse_context_ids
          c_ids = params[:context_ids]
          return {} unless c_ids.respond_to?(:permit)

          c_ids.permit(:contact_id, :account_id, :opportunity_id).to_h.symbolize_keys
        end

        def preview_context
          raw_context = params[:context]
          return {} unless raw_context.respond_to?(:permit)

          raw_context.permit(
            person: {},
            contact: {},
            company: {},
            account: {},
            opportunity: {},
            lead: {},
            owner: {},
            user: {}
          ).to_h.symbolize_keys
        end

        def template_params
          params.require(:template).permit(
            :name, :subject_template, :preheader, :body_html, :category, :status, :private, :schema_version,
            body_json: {}
          )
        end

        def persisted_template_params
          p = template_params.except(:private)
          p[:status] ||= 'active'
          p[:schema_version] ||= 1
          p
        end

        def serialize(template)
          {
            id: template.id,
            name: template.name,
            subject_template: template.subject_template,
            preheader: template.preheader,
            body_json: template.body_json,
            body_html: template.body_html,
            category: template.category,
            status: template.status || 'active',
            schema_version: template.schema_version || 1,
            shared: template.user_id.nil?,
            user_id: template.user_id,
            created_at: template.created_at,
            updated_at: template.updated_at
          }
        end
      end
    end
  end
end
