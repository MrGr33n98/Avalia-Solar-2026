module Api
  module V1
    module Sales
      class OpportunityContactsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          opportunity = current_tenant_scope.opportunities.find(params[:opportunity_id])
          contacts = scoped_memberships(opportunity)
          render json: {
            contacts: contacts.map { |oc| serialize(oc) },
            coverage_score: committee_coverage_score(contacts)
          }
        end

        def create
          opportunity = current_tenant_scope.opportunities.find(params[:opportunity_id])
          contact = current_tenant_scope.contacts.find_by(id: opportunity_contact_params[:sales_contact_id])
          unless contact
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Contact')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end
          unless current_tenant_scope.valid_relation?(account: opportunity.account, contact: contact, opportunity: opportunity)
            return render_relation_conflict(resource: 'OpportunityContact')
          end
          op_contact = opportunity.opportunity_contacts.new(opportunity_contact_params.merge(sales_contact_id: contact.id))
          op_contact.save!
          render json: { contact: serialize(op_contact), coverage_score: committee_coverage_score(scoped_memberships(opportunity.reload)) }, status: :created
        end

        def update
          opportunity = current_tenant_scope.opportunities.find(params[:opportunity_id])
          op_contact = opportunity.opportunity_contacts.find(params[:id])
          attrs = opportunity_contact_params
          contact_id = attrs[:sales_contact_id].presence || op_contact.sales_contact_id
          contact = current_tenant_scope.contacts.find_by(id: contact_id)
          unless contact
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Contact')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end
          return render_relation_conflict(resource: 'OpportunityContact') unless current_tenant_scope.valid_relation?(account: opportunity.account, contact: contact, opportunity: opportunity)
          op_contact.update!(attrs)
          render json: { contact: serialize(op_contact), coverage_score: committee_coverage_score(scoped_memberships(opportunity.reload)) }
        end

        def destroy
          opportunity = current_tenant_scope.opportunities.find(params[:opportunity_id])
          op_contact = opportunity.opportunity_contacts.find(params[:id])
          contact = current_tenant_scope.contacts.find_by(id: op_contact.sales_contact_id)
          unless contact && current_tenant_scope.valid_relation?(account: opportunity.account, contact: contact, opportunity: opportunity)
            log_sales_denial(reason: 'child_out_of_scope', resource: 'OpportunityContact')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end
          opportunity = op_contact.opportunity
          op_contact.destroy!
          render json: { message: 'Contato removido do comitê com sucesso.', coverage_score: committee_coverage_score(scoped_memberships(opportunity.reload)) }
        end

        private



        def opportunity_contact_params
          params.require(:opportunity_contact).permit(
            :sales_contact_id, :role, :influence, :support_level, :is_primary, :notes
          )
        end

        def scoped_memberships(opportunity)
          opportunity.opportunity_contacts.includes(:contact).select do |membership|
            membership.contact.present? && current_tenant_scope.valid_relation?(
              account: opportunity.account,
              contact: membership.contact,
              opportunity: opportunity
            )
          end
        end

        def committee_coverage_score(memberships)
          required_roles = %w[decision_maker economic_buyer champion approver]
          matched = (required_roles & memberships.map(&:role)).size
          ((matched.to_f / required_roles.size) * 100).round
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
