# frozen_string_literal: true

module Api
  module V1
    module Sales
      class ContactListsController < BaseController
        before_action :authenticate_api_user
        before_action :set_contact_list, only: %i[show update destroy add_contacts remove_contacts]

        def index
          scope = policy_scope(::Sales::ContactList).order(created_at: :desc)
          scope = scope.where(active: params[:active]) if params[:active].present?

          page = [params.fetch(:page, 1).to_i, 1].max
          per_page = [[params.fetch(:per_page, 50).to_i, 1].max, 100].min
          total_count = scope.count
          lists = scope.offset((page - 1) * per_page).limit(per_page)

          render json: {
            contact_lists: lists.map { |l| serialize_list(l) },
            meta: {
              page: page,
              per_page: per_page,
              total_count: total_count,
              total_pages: (total_count.to_f / per_page).ceil
            }
          }
        end

        def show
          authorize @contact_list
          page = [params.fetch(:page, 1).to_i, 1].max
          per_page = [[params.fetch(:per_page, 50).to_i, 1].max, 100].min
          contacts_scope = @contact_list.contacts.order(created_at: :desc)
          total_contacts = contacts_scope.count
          contacts = contacts_scope.offset((page - 1) * per_page).limit(per_page)

          render json: {
            contact_list: serialize_list(@contact_list),
            contacts: contacts.map { |c| serialize_contact(c) },
            meta: {
              page: page,
              per_page: per_page,
              total_count: total_contacts,
              total_pages: (total_contacts.to_f / per_page).ceil
            }
          }
        end

        def create
          company = current_company
          unless company
            render json: {
              error: 'UNAUTHORIZED_COMPANY',
              message: 'Empresa não autorizada.',
              details: { blockers: [{ code: 'UNAUTHORIZED_COMPANY', message: 'Empresa não autorizada.' }] }
            }, status: :forbidden
            return
          end

          list = ::Sales::ContactList.new(list_params.merge(
            company_id: company.id,
            created_by_id: current_user.id
          ))
          authorize list

          if list.save
            render json: { contact_list: serialize_list(list) }, status: :created
          else
            render json: {
              error: 'VALIDATION_FAILED',
              message: list.errors.full_messages.join(', '),
              details: { blockers: list.errors.full_messages.map { |m| { code: 'VALIDATION_ERROR', message: m } } }
            }, status: :unprocessable_entity
          end
        end

        def update
          authorize @contact_list
          if @contact_list.update(list_params)
            render json: { contact_list: serialize_list(@contact_list) }
          else
            render json: {
              error: 'VALIDATION_FAILED',
              message: @contact_list.errors.full_messages.join(', '),
              details: { blockers: @contact_list.errors.full_messages.map { |m| { code: 'VALIDATION_ERROR', message: m } } }
            }, status: :unprocessable_entity
          end
        end

        def destroy
          authorize @contact_list
          @contact_list.destroy!
          render json: { message: 'Lista de contatos excluída com sucesso.' }
        end

        def add_contacts
          authorize @contact_list
          contact_ids = Array(params[:contact_ids]).map(&:to_i).reject(&:zero?)
          if contact_ids.empty?
            render json: { contact_list: serialize_list(@contact_list), added_count: 0 }
            return
          end

          # Tenant integrity check (P0-5)
          valid_contact_ids = ::Sales::Contact.where(company_id: @contact_list.company_id, id: contact_ids).pluck(:id)

          if valid_contact_ids.any?
            memberships_data = valid_contact_ids.map do |cid|
              {
                company_id: @contact_list.company_id,
                sales_contact_list_id: @contact_list.id,
                sales_contact_id: cid,
                source: params[:source] || 'manual',
                created_at: Time.current
              }
            end

            # Batch insert with uniqueness constraint (P0-8)
            ::Sales::ContactListMembership.insert_all(memberships_data, unique_by: :idx_sales_contact_list_memberships_unique)
            @contact_list.reload.update_column(:contacts_count, @contact_list.memberships.count)
          end

          render json: { contact_list: serialize_list(@contact_list), added_count: valid_contact_ids.size }
        end

        def remove_contacts
          authorize @contact_list
          contact_ids = Array(params[:contact_ids]).map(&:to_i).reject(&:zero?)
          removed = @contact_list.memberships.where(sales_contact_id: contact_ids).delete_all
          @contact_list.reload.update_column(:contacts_count, @contact_list.memberships.count)

          render json: { contact_list: serialize_list(@contact_list), removed_count: removed }
        end

        private

        def set_contact_list
          @contact_list = policy_scope(::Sales::ContactList).find(params[:id])
        end

        def current_company
          return current_user.company if current_user.respond_to?(:company) && current_user.company
          return ::Company.find_by(id: current_user.company_id) if current_user.respond_to?(:company_id) && current_user.company_id.present?

          nil
        end

        def list_params
          params.require(:contact_list).permit(:name, :description, :kind, :active)
        end

        def serialize_list(l)
          {
            id: l.id,
            name: l.name,
            description: l.description,
            kind: l.kind,
            active: l.active,
            contacts_count: l.contacts_count,
            created_at: l.created_at,
            updated_at: l.updated_at
          }
        end

        def serialize_contact(c)
          {
            id: c.id,
            first_name: c.first_name,
            last_name: c.last_name,
            email: c.email,
            phone: c.phone,
            job_title: c.job_title,
            account_name: c.account&.name
          }
        end
      end
    end
  end
end
