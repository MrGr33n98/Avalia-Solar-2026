module App
  class ExpoController < BaseController
    layout 'expo'

    # Landing pública — não requer autenticação
    skip_before_action :authenticate_user!
    skip_before_action :verify_authenticity_token, only: [:index]

    def index
      @suppliers    = Company.suppliers.active_status.featured.limit(12)
      @integrators  = Company.integrators.active_status.limit(12)
      @distributors = Company.distributors.active_status.limit(8)
      @categories   = Category.all.order(:name)
    end
  end
end
