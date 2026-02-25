module Dashboard
  class CompaniesController < BaseController
    def edit
      @company = current_user.company
    end

    def update
      @company = current_user.company
      if @company.update(company_params)
        Analytics::TrackEventService.call(
          company_id: @company.id,
          event_type: 'company_profile_updated',
          user: current_user,
          metadata: {
            updated_fields: company_params.keys
          }
        )
        redirect_to edit_dashboard_company_path, notice: 'Empresa atualizada com sucesso.'
      else
        render :edit, status: :unprocessable_entity
      end
    end

    private

    def company_params
      attrs = params.require(:company).permit(
        :name, :description, :whatsapp, :social_media,
        :phone, :email, :email_public, :website, :state, :city,
        :logo, :banner
      )
      attrs[:social_media] = parse_social_media(attrs[:social_media])
      attrs
    end

    def parse_social_media(value)
      return value if value.is_a?(Hash)
      return {} if value.blank?

      JSON.parse(value)
    rescue JSON::ParserError
      {}
    end
  end
end
