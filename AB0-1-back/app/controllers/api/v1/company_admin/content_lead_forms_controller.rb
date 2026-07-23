# frozen_string_literal: true

module Api
  module V1
    module CompanyAdmin
      class ContentLeadFormsController < BaseController
        before_action -> { require_company_feature!('downloadable_materials') }
        before_action :set_form, only: %i[show update destroy]

        def index
          authorize ContentLeadForm.new(company: @company), :index?
          render json: { forms: policy_scope(@company.content_lead_forms).order(updated_at: :desc).map { |form| serialize(form) } }
        end

        def show
          authorize @form
          render json: { form: serialize(@form) }
        end

        def create
          form = @company.content_lead_forms.new(form_params)
          authorize form
          return render json: { errors: form.errors.full_messages }, status: :unprocessable_entity unless form.save

          render json: { form: serialize(form) }, status: :created
        end

        def update
          authorize @form
          attributes = form_params.to_h
          attributes[:version] = @form.version + 1 if attributes.key?(:fields) || attributes.key?(:consent_text)
          return render json: { errors: @form.errors.full_messages }, status: :unprocessable_entity unless @form.update(attributes)

          render json: { form: serialize(@form) }
        end

        def destroy
          authorize @form
          @form.update!(status: 'inactive')
          head :no_content
        end

        private

        def set_form
          @form = @company.content_lead_forms.find(params[:id])
        end

        def form_params
          params.require(:content_lead_form).permit(:name, :status, :consent_text, :privacy_url, fields: [:key, :label, :type, :required, { options: [] }])
        end

        def serialize(form)
          form.as_json(only: %i[id name status fields consent_text privacy_url version created_at updated_at])
        end
      end
    end
  end
end
