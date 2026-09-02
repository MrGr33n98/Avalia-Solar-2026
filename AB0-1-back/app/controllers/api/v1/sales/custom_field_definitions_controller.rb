module Api
  module V1
    module Sales
      class CustomFieldDefinitionsController < BaseController
        def index
          scope = ::Sales::CustomFieldDefinition.order(:entity_type, :position, :label)
          scope = scope.where(entity_type: params[:entity_type]) if params[:entity_type].present?
          render json: { custom_field_definitions: scope.map { |df| serialize(df) } }
        end

        def create
          df = ::Sales::CustomFieldDefinition.create!(definition_params.merge(company: current_user&.company))
          render json: { custom_field_definition: serialize(df) }, status: :created
        end

        def update
          df = ::Sales::CustomFieldDefinition.find(params[:id])
          df.update!(definition_params)
          render json: { custom_field_definition: serialize(df) }
        end

        def destroy
          df = ::Sales::CustomFieldDefinition.find(params[:id])
          df.destroy!
          head :no_content
        end

        private

        def definition_params
          params.require(:custom_field_definition).permit(
            :entity_type, :key, :label, :field_type, :required, :filterable,
            :reportable, :position, :active, validation_rules: {}
          )
        end

        def serialize(df)
          {
            id: df.id,
            entity_type: df.entity_type,
            key: df.key,
            label: df.label,
            field_type: df.field_type,
            required: df.required,
            filterable: df.filterable,
            reportable: df.reportable,
            position: df.position,
            active: df.active,
            validation_rules: df.validation_rules,
            created_at: df.created_at,
            updated_at: df.updated_at
          }
        end
      end
    end
  end
end
