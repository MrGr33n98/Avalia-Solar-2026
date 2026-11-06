# frozen_string_literal: true

module CategoryTaxonomy
  # CDSI-045 / CDSI-048: Serviço de domínio para renomeação explícita de slug (seo_url)
  # com gravação atômica de histórico de redirect 308, prevenção de colisão e proteção contra loop.
  class RenameSlug
    Result = Struct.new(:success?, :category, :redirect_record, :errors, keyword_init: true)

    def self.call(category:, new_slug:, reason: nil, actor_id: nil, http_status: 308)
      new(
        category: category,
        new_slug: new_slug,
        reason: reason,
        actor_id: actor_id,
        http_status: http_status
      ).call
    end

    def initialize(category:, new_slug:, reason: nil, actor_id: nil, http_status: 308)
      @category = category
      @new_slug = new_slug.to_s.strip.downcase
      @reason = reason
      @actor_id = actor_id
      @http_status = http_status
    end

    def call
      unless ::CategoryDiscovery::IndexabilityPolicy.valid_slug?(@new_slug)
        return failure(["Novo slug '#{@new_slug}' é inválido"])
      end

      old_slug = @category.seo_url.to_s.strip.downcase
      if old_slug == @new_slug
        return Result.new(success?: true, category: @category, redirect_record: nil, errors: [])
      end

      if ::Category.where.not(id: @category.id).where('LOWER(seo_url) = ?', @new_slug).exists?
        return failure(["Slug '#{@new_slug}' já está em uso por outra categoria"])
      end

      if ::CategorySlugRedirect.table_exists? &&
         ::CategorySlugRedirect.where.not(category_id: @category.id).where(source_slug: @new_slug).exists?
        return failure(["Slug '#{@new_slug}' já está reservado no histórico de redirecionamento de outra categoria"])
      end

      redirect_record = nil

      ActiveRecord::Base.transaction do
        # Se a categoria está voltando para um slug que ela mesma já usou no passado,
        # removemos o redirect antigo daquele slug para evitar loop circular (R15).
        if ::CategorySlugRedirect.table_exists?
          ::CategorySlugRedirect.where(category_id: @category.id, source_slug: @new_slug).delete_all
        end

        @category.allow_explicit_slug_change!
        @category.update!(seo_url: @new_slug)

        if old_slug.present? && ::CategorySlugRedirect.table_exists?
          redirect_record = ::CategorySlugRedirect.find_or_initialize_by(source_slug: old_slug)
          redirect_record.assign_attributes(
            category: @category,
            http_status: @http_status,
            reason: @reason,
            created_by_id: @actor_id
          )
          redirect_record.save!
        end
      end

      Result.new(success?: true, category: @category, redirect_record: redirect_record, errors: [])
    rescue ActiveRecord::RecordInvalid => e
      failure(e.record.errors.full_messages.presence || [e.message])
    end

    private

    def failure(errors)
      Result.new(success?: false, category: @category, redirect_record: nil, errors: Array(errors))
    end
  end
end

