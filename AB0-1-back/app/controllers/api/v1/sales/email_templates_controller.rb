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
          template = params[:id].present? ? scoped_templates.find(params[:id]) : nil
          draft = draft_params

          subject = draft[:subject_template].presence || template&.subject_template || 'Sem Assunto'
          preheader = draft[:preheader].presence || template&.preheader
          body_json = draft[:body_json].presence || (draft[:body_html].blank? ? template&.body_json : nil)
          body_html = draft[:body_html].presence || (draft[:body_json].blank? ? template&.body_html : nil)

          resolved_context = ::Sales::Messaging::ContextResolver.resolve(
            company_id: current_user.company_id,
            current_user: current_user,
            context_ids: parse_context_ids,
            raw_context: preview_context
          )

          rendered = ::Sales::Messaging::Renderer.render(
            body_json: body_json,
            raw_html: body_html,
            subject: subject,
            preheader: preheader,
            to_email: params[:to_email].presence || current_user.email,
            context: resolved_context
          )

          context_mode = parse_context_ids.present? ? 'real' : 'sample'

          render json: {
            preview: rendered,
            context_mode: context_mode,
            warnings: []
          }
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
          target_email = params[:to_email].presence || current_user.email

          if defined?(::Sales::EmailSuppression) && ::Sales::EmailSuppression.exists?(email: target_email, company_id: current_user.company_id)
            return render_error_response(
              message: "E-mail '#{target_email}' está na lista de supressão.",
              status: :unprocessable_entity,
              code: 'SUPPRESSED_EMAIL'
            )
          end

          template = params[:id].present? ? scoped_templates.find(params[:id]) : nil
          draft = draft_params

          subject = draft[:subject_template].presence || template&.subject_template || 'Sem Assunto'
          preheader = draft[:preheader].presence || template&.preheader
          body_json = draft[:body_json].presence || (draft[:body_html].blank? ? template&.body_json : nil)
          body_html = draft[:body_html].presence || (draft[:body_json].blank? ? template&.body_html : nil)

          c_ids = parse_context_ids
          resolved_context = ::Sales::Messaging::ContextResolver.resolve(
            company_id: current_user.company_id,
            current_user: current_user,
            context_ids: c_ids,
            raw_context: preview_context
          )

          rendered = ::Sales::Messaging::Renderer.render(
            body_json: body_json,
            raw_html: body_html,
            subject: subject,
            preheader: preheader,
            to_email: target_email,
            context: resolved_context
          )

          email_message = ::Sales::EmailMessage.create!(
            company_id: current_user.company_id,
            sender_user_id: current_user.id,
            from_email: current_user.email,
            to_email: target_email,
            subject: rendered[:subject] || subject,
            body_html: rendered[:body_html] || body_html,
            body_text: rendered[:body_text],
            body_json: body_json,
            status: 'queued',
            sales_contact_id: c_ids[:contact_id],
            sales_account_id: c_ids[:account_id],
            sales_opportunity_id: c_ids[:opportunity_id]
          )

          ::Sales::SendEmailJob.perform_now(email_message.id)
          email_message.reload

          if (email_message.status == 'sent' || email_message.status == 'delivered') && email_message.provider_message_id.present?
            render json: {
              message: "E-mail de teste enviado com sucesso para #{target_email}.",
              to_email: target_email,
              provider_message_id: email_message.provider_message_id,
              rendered: rendered
            }
          else
            error_msg = email_message.metadata.is_a?(Hash) ? email_message.metadata['error'] : nil
            error_msg = error_msg.presence || "Falha no envio do e-mail de teste (status: #{email_message.status})."

            render_error_response(
              message: error_msg,
              status: :unprocessable_entity,
              code: 'TEST_SEND_FAILED'
            )
          end
        rescue ::Sales::Messaging::Renderer::EmailRenderError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'TEST_SEND_INVALID')
        rescue StandardError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'TEST_SEND_ERROR')
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

        def draft_params
          raw_draft = params[:draft]
          return {} unless raw_draft.respond_to?(:permit)

          raw_draft.permit(
            :subject_template, :preheader, :body_html, :name, :category, :status,
            body_json: {}
          ).to_h.symbolize_keys
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
