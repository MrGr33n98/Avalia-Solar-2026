module Api
  module V1
    module Sales
      class TagsController < BaseController
        before_action :require_tag_scope
        def index
          requested_type = params[:entity_type].presence || 'Opportunity'
          matching_types = requested_type.in?(%w[Lead Opportunity]) ? %w[Lead Opportunity] : [requested_type]
          render json: { tags: scoped_tags.active.where(entity_type: matching_types).includes(:taggings).order(:name).map { |tag| serialize(tag) } }
        end
        def create
          tag = scoped_tags.create!(tag_params.merge(created_by: current_user, company_id: current_user.company_id))
          render json: { tag: serialize(tag) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.record.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'TAG_INVALID')
        rescue ActiveRecord::RecordNotUnique
          render_error_response(message: 'Já existe uma tag com este nome.', status: :unprocessable_entity, code: 'TAG_DUPLICATE')
        end
        def update
          tag = scoped_tags.active.find(params[:id]); tag.update!(tag_params)
          render json: { tag: serialize(tag) }
        end
        def destroy
          scoped_tags.find(params[:id]).update!(archived_at: Time.current)
          render json: { message: 'Tag arquivada.' }
        end

        def apply
          tag = scoped_tags.active.find(params[:id])
          record = scoped_taggable(tag).find(params[:taggable_id])
          record.taggings.create_or_find_by!(tag: tag, created_by: current_user)
          render json: { tag: serialize(tag), record_id: record.id }
        rescue ActiveRecord::RecordNotFound
          render_error_response(message: 'Tag ou registro não encontrado.', status: :not_found, code: 'TAG_RECORD_NOT_FOUND')
        end

        def remove
          tag = scoped_tags.find(params[:id])
          scoped_taggable(tag).find(params[:taggable_id]).taggings.where(sales_tag_id: tag.id).delete_all
          render json: { message: 'Tag removida.' }
        end

        private
        def require_tag_scope
          return if current_user.admin? || current_user.company_id.present?

          render_error_response(message: 'Usuário sem organização não pode acessar tags.', status: :forbidden, code: 'SALES_SCOPE_REQUIRED')
        end

        def scoped_tags
          return ::Sales::Tag.all if current_user.admin?
          ::Sales::Tag.where(company_id: current_user.company_id)
        end

        def scoped_taggable(_tag)
          tenant = ::Sales::TenantScope.for(current_user)
          case taggable_type
          when 'Opportunity', 'Lead'
            tenant.opportunities
          when 'Account'
            tenant.accounts
          when 'Contact'
            tenant.contacts
          end
        end

        def taggable_type
          type = params[:taggable_type].to_s
          raise ActionController::BadRequest unless ::Sales::Tag::ENTITY_TYPES.include?(type)
          type
        end

        def tag_params
          params.require(:tag).permit(:name, :color, :description, :entity_type)
        end
        def serialize(tag)
          { id: tag.id, name: tag.name, slug: tag.slug, color: tag.color, description: tag.description, entity_type: tag.entity_type, records_count: tag.taggings.size, created_at: tag.created_at }
        end
      end
    end
  end
end
