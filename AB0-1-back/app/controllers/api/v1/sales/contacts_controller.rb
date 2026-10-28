module Api
  module V1
    module Sales
      class ContactsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          if params[:options].present? || params[:sales_account_id].present? || params[:account_id].present?
            acc_id = params[:sales_account_id] || params[:account_id]
            if acc_id.present?
              account = ::Sales::TenantScope.for(current_user).accounts.find_by(id: acc_id)
              return render json: { error: 'Account not found or access denied' }, status: :not_found unless account
            end

            limit = [ (params[:limit] || 20).to_i, 50 ].min
            contacts = ::Sales::ContactOptionsQuery.call(account_id: acc_id, query: params[:q], limit: limit, scope: scoped_contacts)
            render json: {
              contacts: contacts.map do |c|
                {
                  id: c.id,
                  first_name: c.first_name,
                  last_name: c.last_name,
                  name: [c.first_name, c.last_name].compact.join(' '),
                  email: c.email,
                  job_title: c.job_title
                }
              end
            }
            return
          end

          query_scope = ::Sales::ContactsQuery.new(params, scope: scoped_contacts).call
          total_count = query_scope.count
          page = [params[:page].to_i, 1].max
          per_page = params[:per_page].present? ? [params[:per_page].to_i, 100].min : 50

          contacts = query_scope.offset((page - 1) * per_page).limit(per_page)

          render json: {
            contacts: contacts.map { |c| serialize(c) },
            meta: {
              page: page,
              per_page: per_page,
              total: total_count,
              pages: (total_count.to_f / per_page).ceil
            }
          }
        end

        def show
          contact = scoped_contacts.includes(:account, :user, :contact_employments, :opportunity_contacts, :activities, :tasks, :tags, opportunities: :stage).find(params[:id])
          render json: { contact: serialize_detailed(contact) }
        end

        def engagement
          contact = scoped_contacts.find(params[:id])
          emails = current_tenant_scope.email_messages.where(sales_contact_id: contact.id)
          render json: { engagement: { sent: emails.where.not(sent_at: nil).count, delivered: emails.where(status: "delivered").count, opens: emails.sum(:open_count), clicks: emails.sum(:click_count), last_opened_at: emails.maximum(:last_opened_at), last_clicked_at: emails.maximum(:last_clicked_at) } }
        end

        def timeline
          contact = scoped_contacts.find(params[:id])
          timeline = ::Sales::Contacts::TimelineBuilder.build(contact, scope: current_tenant_scope)
          timeline = timeline.select { |event| event[:type].to_s == params[:type].to_s } if params[:type].present?
          page = [params.fetch(:page, 1).to_i, 1].max
          per_page = [[params.fetch(:per_page, 50).to_i, 1].max, 100].min
          total = timeline.length
          render json: { timeline: timeline.slice((page - 1) * per_page, per_page) || [], meta: { page: page, per_page: per_page, total: total } }
        end

        def create
          account_id = params[:account_id] || params[:sales_account_id] || contact_params[:sales_account_id]
          if params[:account_id].present? && contact_params[:sales_account_id].present? &&
             params[:account_id].to_s != contact_params[:sales_account_id].to_s
            return render_relation_conflict(resource: 'Contact')
          end
          company_name = params[:company_name] || params[:account_name] || contact_params[:company_name]

          if account_id.present?
            account = current_tenant_scope.accounts.find_by(id: account_id)
            return render json: { error: 'Account not found or access denied' }, status: :not_found unless account
          elsif company_name.present?
            c_name = company_name.to_s.strip
            if c_name.present?
              account = current_tenant_scope.accounts.find_or_create_by!(name: c_name) do |a|
                a.owner = current_user
                a.company_id = current_user.company_id
              end
              account_id = account.id
            end
          end

          unless account_id.present?
            return render_error_response(message: 'Conta é obrigatória.', status: :unprocessable_entity, code: 'ACCOUNT_REQUIRED')
          end
          account ||= current_tenant_scope.accounts.find_by(id: account_id)
          unless account
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Account')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end

          contact = if contact_params[:email].present? && account_id.present?
                      scoped_contacts.where(sales_account_id: account_id).find_or_initialize_by(email: contact_params[:email].downcase.strip)
                    else
                      ::Sales::Contact.new
                    end
          attrs = contact_params.except(:company_name, :user_id, :owner_id)
          owner_id = params[:owner_id].presence || contact_params[:owner_id].presence || contact_params[:user_id].presence
          if owner_id.present?
            owner_user = User.find_by(id: owner_id)
            unless current_tenant_scope.valid_owner?(owner_user, account: account)
              log_sales_denial(reason: 'owner_out_of_scope', resource: 'Contact')
              return render_error_response(message: 'Responsável inválido.', status: :unprocessable_entity, code: 'INVALID_OWNER')
            end
            attrs[:user_id] = owner_user.id
          else
            attrs[:user_id] = current_user.id
          end

          contact.assign_attributes(attrs)
          contact.sales_account_id = account.id
          contact.save!
          render json: { contact: serialize_detailed(contact) }, status: contact.previously_new_record? ? :created : :ok
        end

        def update
          contact = scoped_contacts.find(params[:id])
          attrs = contact_params.except(:company_name, :user_id, :owner_id).to_h
          target_account = contact.account

          if contact_params[:sales_account_id].present? && contact_params[:sales_account_id].to_i != contact.sales_account_id
            target_account = current_tenant_scope.accounts.find_by(id: contact_params[:sales_account_id])
            unless target_account
              log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Account')
              return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
            end
            attrs[:sales_account_id] = target_account.id
          end

          owner_id = params[:owner_id].presence || contact_params[:owner_id].presence || contact_params[:user_id].presence
          if owner_id.present?
            owner_user = User.find_by(id: owner_id)
            unless current_tenant_scope.valid_owner?(owner_user, account: target_account)
              log_sales_denial(reason: 'owner_out_of_scope', resource: 'Contact')
              return render_error_response(message: 'Responsável inválido.', status: :unprocessable_entity, code: 'INVALID_OWNER')
            end
            attrs[:user_id] = owner_user.id
          end

          if params[:contact] && params[:contact][:metadata].present?
            current_meta = contact.metadata || {}
            new_meta = params[:contact][:metadata].is_a?(ActionController::Parameters) ? params[:contact][:metadata].to_unsafe_h : params[:contact][:metadata]
            attrs[:metadata] = current_meta.deep_merge(new_meta.stringify_keys)
          end

          contact.update!(attrs)

          if params[:tag_names].is_a?(Array)
            tag_ids = params[:tag_names].map do |tname|
              tag = ::Sales::Tag.find_or_create_by!(
                company_id: current_user.company_id,
                entity_type: 'Contact',
                name: tname.to_s.strip
              ) do |t|
                t.color = '#4f46e5'
                t.created_by = current_user
              end
              tag.id
            end
            contact.tag_ids = tag_ids if contact.respond_to?(:tag_ids=)
          end

          render json: { contact: serialize_detailed(contact.reload) }
        end

        private

        def contact_params
          params.require(:contact).permit(
            :first_name, :last_name, :email, :phone, :whatsapp, :job_title, :linkedin_url,
            :decision_role, :is_primary, :sales_account_id, :user_id, :owner_id, :company_name,
            metadata: {}
          )
        end

        def serialize(contact)
          last_contact = ::Sales::Contacts::LastContactResolver.resolve(contact, scope: current_tenant_scope)
          next_action = ::Sales::Contacts::NextActionResolver.resolve(contact, scope: current_tenant_scope)
          owner = contact.user
          owner = nil if owner && !current_user.admin? && !current_tenant_scope.tenant_user_ids.include?(owner.id)

          {
            id: contact.id,
            sales_account_id: contact.sales_account_id,
            owner_id: contact.user_id,
            owner_name: owner&.name || 'Vendedor Responsável',
            first_name: contact.first_name,
            last_name: contact.last_name,
            name: [contact.first_name, contact.last_name].compact.join(' '),
            email: contact.email,
            phone: contact.phone,
            whatsapp: contact.whatsapp,
            job_title: contact.job_title,
            linkedin_url: contact.linkedin_url,
            decision_role: contact.decision_role || 'decision_maker',
            is_primary: contact.is_primary,
            account_name: contact.account&.name,
            account_domain: contact.account&.domain,
            account_website: contact.account&.website,
            account_city: contact.account&.city,
            account_state: contact.account&.state,
            account_segment: contact.account&.segment,
            account_company_size: contact.account&.company_size,
            last_contact_at: last_contact[:last_contact_at],
            last_contact_type: last_contact[:last_contact_type],
            last_contact_title: last_contact[:last_contact_title],
            next_action_at: next_action[:next_action_at],
            next_action_type: next_action[:next_action_type],
            next_action_title: next_action[:next_action_title],
            created_at: contact.created_at,
            metadata: contact.metadata || {}
          }
        end

        def serialize_detailed(contact)
          scope = current_tenant_scope
          safe_employments = contact.contact_employments.select { |employment| scope.accounts.exists?(id: employment.sales_account_id) && scope.valid_employment?(contact: contact, account: employment.account) }
          safe_opportunity_contacts = contact.opportunity_contacts.select do |membership|
            opportunity = membership.opportunity
            opportunity.present? && scope.opportunities.exists?(id: opportunity.id) &&
              scope.valid_relation?(account: opportunity.account, contact: contact, opportunity: opportunity)
          end
          direct_opportunities = contact.opportunities.select { |opp| scope.opportunities.exists?(id: opp.id) }
          safe_activities = scope.activities.where(sales_contact_id: contact.id).order(occurred_at: :desc).limit(25)
          safe_tasks = scope.tasks.where(sales_contact_id: contact.id).order(due_at: :asc)

          all_opps = (safe_opportunity_contacts.map(&:opportunity) + direct_opportunities).compact.uniq(&:id)
          meta = contact.metadata || {}

          serialize(contact).merge(
            account: contact.account ? { id: contact.account.id, name: contact.account.name, city: contact.account.city, state: contact.account.state } : nil,
            bio: meta['bio'] || meta['description'] || '',
            territory: meta['territory'] || [contact.account&.city, contact.account&.state].compact.join(' - '),
            created_via: meta['created_via'] || 'Formulário Solar',
            custom_fields: meta['custom_fields'] || {},
            attachments: meta['attachments'] || [],
            tags: contact.tags.map { |t| { id: t.id, name: t.name, color: t.respond_to?(:color) ? t.color : '#4f46e5' } },
            contact_methods: (contact.contact_methods.active.ordered rescue []).map do |m|
              {
                id: m.id,
                kind: m.kind,
                value: m.value,
                normalized_value: m.normalized_value,
                label: m.label,
                is_primary: m.is_primary,
                position: m.position,
                source: m.source,
                created_at: m.created_at,
                updated_at: m.updated_at
              }
            end,
            employments: safe_employments.map do |e|
              {
                id: e.id,
                sales_account_id: e.sales_account_id,
                account_name: e.account&.name,
                job_title: e.job_title,
                department: e.department,
                seniority: e.seniority,
                relationship_type: e.relationship_type,
                is_current: e.is_current,
                is_primary: e.is_primary
              }
            end,
            buying_opportunities: safe_opportunity_contacts.map do |oc|
              {
                id: oc.id,
                opportunity_id: oc.sales_opportunity_id,
                opportunity_name: oc.opportunity&.name,
                value_cents: oc.opportunity&.value_cents,
                stage_name: oc.opportunity&.stage&.name,
                status: oc.opportunity&.status,
                probability: oc.opportunity&.probability,
                role: oc.role,
                influence: oc.influence,
                support_level: oc.support_level,
                is_primary: oc.is_primary
              }
            end,
            opportunities: all_opps.map do |opp|
              {
                id: opp.id,
                name: opp.name,
                value_cents: opp.value_cents,
                currency: opp.currency || 'BRL',
                stage_name: opp.stage&.name || 'Em Andamento',
                status: opp.status,
                probability: opp.probability,
                expected_close_date: opp.expected_close_date
              }
            end,
            activities: safe_activities.map do |a|
              {
                id: a.id,
                activity_type: a.activity_type,
                subject: a.subject,
                body: a.respond_to?(:body) ? a.body : nil,
                occurred_at: a.occurred_at
              }
            end,
            tasks: safe_tasks.map do |t|
              {
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                task_type: t.task_type,
                due_at: t.due_at,
                completed_at: t.completed_at
              }
            end
          )
        end
        def scoped_contacts
          ::Sales::TenantScope.for(current_user).contacts
        end
      end
    end
  end
end
