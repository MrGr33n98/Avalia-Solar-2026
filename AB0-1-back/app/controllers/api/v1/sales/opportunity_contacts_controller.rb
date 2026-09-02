module Api
  module V1
    module Sales
      class OpportunityContactsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          opportunity = ::Sales::Opportunity.find(params[:opportunity_id])
          contacts = opportunity.opportunity_contacts.includes(:contact)
          render json: {
            contacts: contacts.map { |oc| serialize(oc) },
            coverage_score: opportunity.committee_coverage_score
          }
        end

        def create
          opportunity = ::Sales::Opportunity.find(params[:opportunity_id])
          op_contact = opportunity.opportunity_contacts.new(opportunity_contact_params)
          op_contact.save!
          render json: { contact: serialize(op_contact), coverage_score: opportunity.reload.committee_coverage_score }, status: :created
        end

        def update
          op_contact = ::Sales::OpportunityContact.find(params[:id])
          op_contact.update!(opportunity_contact_params)
          render json: { contact: serialize(op_contact), coverage_score: op_contact.opportunity.committee_coverage_score }
        end

        def destroy
          op_contact = ::Sales::OpportunityContact.find(params[:id])
          opportunity = op_contact.opportunity
          op_contact.destroy!
          render json: { message: 'Contato removido do comitê com sucesso.', coverage_score: opportunity.reload.committee_coverage_score }
        end

        private



        def opportunity_contact_params
          params.require(:opportunity_contact).permit(
            :sales_contact_id, :role, :influence, :support_level, :is_primary, :notes
          )
        end

        def serialize(oc)
          c = oc.contact
          {
            id: oc.id,
            sales_opportunity_id: oc.sales_opportunity_id,
            sales_contact_id: oc.sales_contact_id,
            first_name: c&.first_name,
            last_name: c&.last_name,
            name: [c&.first_name, c&.last_name].compact.join(' '),
            email: c&.email,
            phone: c&.phone,
            whatsapp: c&.whatsapp,
            job_title: c&.job_title,
            role: oc.role,
            influence: oc.influence,
            support_level: oc.support_level,
            is_primary: oc.is_primary,
            notes: oc.notes
          }
        end
      end
    end
  end
end
