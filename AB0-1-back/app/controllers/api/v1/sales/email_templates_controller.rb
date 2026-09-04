# frozen_string_literal: true

module Api
  module V1
    module Sales
      class EmailTemplatesController < BaseController
        def index
          templates = scoped_templates.order(updated_at: :desc)
          templates = templates.where(category: params[:category]) if params[:category].present?
          templates = templates.where("name ILIKE ? OR subject_template ILIKE ?", "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?
          render json: { templates: templates.limit(100).map { |template| serialize(template) } }
        end

        def show
          render json: { template: serialize(scoped_templates.find(params[:id])) }
        end

        def create
          template = scoped_templates.create!(persisted_template_params.merge(company_id: current_user.company_id, user_id: private_template? ? current_user.id : nil))
          render json: { template: serialize(template) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.record.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'TEMPLATE_INVALID')
        end

        def update
          template = scoped_templates.find(params[:id])
          template.update!(persisted_template_params)
          render json: { template: serialize(template) }
        end

        def destroy
          scoped_templates.find(params[:id]).destroy!
          render json: { message: 'Template removido.' }
        end

        def preview
          template = scoped_templates.find(params[:id])
          rendered = ::Sales::Messaging::Renderer.render(
            body_json: template.body_json, raw_html: template.body_html,
            subject: template.subject_template, to_email: params[:to_email].presence || current_user.email,
            context: params[:context].respond_to?(:to_h) ? params[:context].to_h : {}
          )
          render json: { preview: rendered }
        rescue Sales::Messaging::Renderer::EmailRenderError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'TEMPLATE_PREVIEW_INVALID')
        end

        private

        def scoped_templates
          return ::Sales::EmailTemplate.all if current_user.admin?

          ::Sales::EmailTemplate.where(company_id: current_user.company_id).where(user_id: [nil, current_user.id])
        end

        def private_template?
          ActiveModel::Type::Boolean.new.cast(template_params[:private])
        end

        def template_params
          params.require(:template).permit(:name, :subject_template, :body_html, :category, :private, body_json: {})
        end

        def persisted_template_params
          template_params.except(:private)
        end

        def serialize(template)
          { id: template.id, name: template.name, subject_template: template.subject_template,
            body_json: template.body_json, body_html: template.body_html, category: template.category,
            shared: template.user_id.nil?, user_id: template.user_id, updated_at: template.updated_at }
        end
      end
    end
  end
end
