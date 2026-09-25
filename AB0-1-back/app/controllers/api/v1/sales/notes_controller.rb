module Api
  module V1
    module Sales
      class NotesController < BaseController
        def index
          notes = current_tenant_scope.notes
          notes = notes.where(account_id: params[:account_id]) if params[:account_id].present?
          notes = notes.where(opportunity_id: params[:opportunity_id]) if params[:opportunity_id].present?
          notes = notes.order(created_at: :desc)
          render json: { notes: notes.map { |note| serialize(note) } }
        end

        def create
          attrs = note_params.to_h.symbolize_keys
          account, contact, opportunity = resolve_note_relations!(attrs)
          if account.present? && !current_tenant_scope.valid_relation?(account: account, contact: contact, opportunity: opportunity)
            return render_relation_conflict(resource: 'Note')
          end
          tenant_company_id = account&.company_id || account&.owner&.company_id || contact&.account&.company_id ||
                              opportunity&.account&.company_id || current_user.company_id
          return render_relation_conflict(resource: 'Note') if tenant_company_id.present? && !current_user.admin? && tenant_company_id != current_user.company_id

          note = ::Sales::Note.create!(attrs.merge(
            account: account,
            contact: contact,
            opportunity: opportunity,
            company_id: tenant_company_id,
            author: current_user
          ))
          ::Sales::AuditRecorder.call(record: note, action: 'created', actor: current_user,
                                      request_id: request.request_id, ip: request.remote_ip)
          render json: { note: serialize(note) }, status: :created
        end

        def update
          note = current_tenant_scope.notes.find(params[:id])
          attrs = note_params.to_h.symbolize_keys
          attrs[:account_id] = note.account_id unless attrs.key?(:account_id)
          attrs[:contact_id] = note.contact_id unless attrs.key?(:contact_id)
          attrs[:opportunity_id] = note.opportunity_id unless attrs.key?(:opportunity_id)
          account, contact, opportunity = resolve_note_relations!(attrs)
          return render_relation_conflict(resource: 'Note') if account.present? &&
            !current_tenant_scope.valid_relation?(account: account, contact: contact, opportunity: opportunity)
          tenant_company_id = account&.company_id || account&.owner&.company_id || contact&.account&.company_id ||
                              opportunity&.account&.company_id || note.company_id
          if tenant_company_id.present? && !current_user.admin? && tenant_company_id != current_user.company_id
            return render_relation_conflict(resource: 'Note')
          end

          note.update!(attrs.merge(account: account, contact: contact, opportunity: opportunity, company_id: tenant_company_id))
          render json: { note: serialize(note) }
        end

        private

        def note_params
          params.require(:note).permit(:account_id, :opportunity_id, :contact_id, :title, :body, :pinned)
        end

        def resolve_note_relations!(attrs)
          account = current_tenant_scope.accounts.find_by(id: attrs[:account_id]) if attrs[:account_id].present?
          contact = current_tenant_scope.contacts.find_by(id: attrs[:contact_id]) if attrs[:contact_id].present?
          opportunity = current_tenant_scope.opportunities.find_by(id: attrs[:opportunity_id]) if attrs[:opportunity_id].present?
          { Account: account, Contact: contact, Opportunity: opportunity }.each do |resource, record|
            next if attrs["#{resource.to_s.underscore}_id".to_sym].blank? || record

            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: resource.to_s)
            raise ActiveRecord::RecordNotFound
          end

          account ||= opportunity&.account || contact&.account
          [account, contact, opportunity]
        end

        def serialize(note)
          { id: note.id, account_id: note.account_id, opportunity_id: note.opportunity_id,
            contact_id: note.contact_id, author_id: note.author_id, title: note.title,
            body: note.body, pinned: note.pinned, created_at: note.created_at, updated_at: note.updated_at }
        end
      end
    end
  end
end
