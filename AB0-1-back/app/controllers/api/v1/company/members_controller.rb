module Api
  module V1
    module Company
      class MembersController < Api::V1::BaseController
        before_action :authenticate_api_user
        before_action :require_company_user
        before_action :set_company
        before_action :ensure_owner!, only: %i[create invite update destroy]
        before_action :set_member, only: %i[show update destroy]

        def index
          members = @company.company_members.includes(:user).order(created_at: :desc)

          members = members.where(role: params[:role]) if params[:role].present?

          members = members.page(params[:page]).per(params[:per_page] || 20)

          render json: {
            items: members.map { |m| serialize_member(m) },
            meta: {
              current_page: members.current_page,
              total_pages: members.total_pages,
              total_count: members.total_count,
              per_page: members.limit_value
            }
          }
        end

        def show
          render json: serialize_member(@member, full_details: true)
        end

        def invite
          email = params.require(:email).to_s.downcase
          role = params[:role].presence || 'editor'
          user = User.find_or_initialize_by(email: email)
          if user.new_record?
            user.name = email.split('@').first
            user.password = "Aa1#{SecureRandom.base64(18)}"
            user.role = 'company'
            user.company = @company
            user.terms_accepted = true
            user.save!
          end
          member = @company.company_members.find_or_initialize_by(user_id: user.id)
          member.role = role
          member.save!
          render json: serialize_member(member), status: :created
        end

        def update
          role = params.require(:role)
          @member.update!(role: role)
          render json: serialize_member(@member)
        end

        def destroy
          @member.destroy!
          head :no_content
        end

        private

        def set_company
          @company = current_user.company
          render_error('Company not found', :not_found) unless @company
        end

        def set_member
          @member = @company.company_members.find(params[:id])
        end

        def ensure_owner!
          owner = @company.company_members.find_by(user_id: current_user.id)&.owner?
          render_error('Forbidden', :forbidden) unless owner
        end

        def serialize_member(m, full_details: false)
          data = {
            id: m.id,
            role: m.role,
            created_at: m.created_at,
            user: {
              id: m.user_id,
              name: m.user.name,
              email: m.user.email,
              status: m.user.status
            }
          }

          if full_details
            data[:permissions] = member_permissions(m)
            if defined?(PaperTrail)
              data[:versions] = m.versions.last(5).map do |v|
                { event: v.event, created_at: v.created_at, whodunnit: v.whodunnit }
              end
            end
          end

          data
        end

        def member_permissions(m)
          case m.role
          when 'owner' then %w[manage_company manage_members manage_billing view_dashboard]
          when 'manager' then %w[manage_members view_dashboard]
          else ['view_dashboard']
          end
        end
      end
    end
  end
end
