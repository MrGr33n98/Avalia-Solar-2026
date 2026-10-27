# frozen_string_literal: true

module Sales
  class LeadFilterOptionsQuery
    attr_reader :user, :tenant_scope

    def self.call(user)
      new(user).call
    end

    def initialize(user)
      @user = user
      @tenant_scope = ::Sales::TenantScope.for(user)
    end

    def call
      company_id = user.company_id

      {
        assignees: user_options(company_id),
        pipelines: pipeline_options(company_id),
        stages: stage_options(company_id),
        sources: source_options(company_id),
        tags: tag_options(company_id),
        competitors: competitor_options(company_id),
        products: product_options(company_id),
        states: state_options,
        outcomes: [
          { id: 'open', name: 'Aberto (Em andamento)' },
          { id: 'won', name: 'Ganho (Fechado com sucesso)' },
          { id: 'lost', name: 'Perdido (Não fechado)' },
          { id: 'cancelled', name: 'Cancelado' }
        ],
        channels: [
          { id: 'whatsapp', name: 'WhatsApp' },
          { id: 'email', name: 'E-mail Comercial' },
          { id: 'phone', name: 'Ligação Telefônica' },
          { id: 'website', name: 'Formulário Web / Landing Page' }
        ]
      }
    end

    private

    def user_options(company_id)
      users = company_id.present? ? User.where(company_id: company_id) : User.all
      users.select(:id, :name, :email).map do |u|
        { id: u.id, name: u.name.presence || u.email }
      end.sort_by { |o| o[:name] }
    end

    def pipeline_options(company_id)
      scope = if company_id.present? && ::Sales::Pipeline.column_names.include?('company_id')
                ::Sales::Pipeline.where(company_id: company_id, active: true)
              else
                ::Sales::Pipeline.where(active: true)
              end
      scope = ::Sales::Pipeline.all if scope.empty?
      scope.select(:id, :name, :key).map do |p|
        { id: p.id, name: p.name, key: p.key }
      end.sort_by { |p| p[:name] }
    end

    def stage_options(_company_id)
      ::Sales::Stage.where(active: true).select(:id, :name, :key, :position, :sales_pipeline_id).map do |s|
        { id: s.id, name: s.name, key: s.key, position: s.position, pipeline_id: s.sales_pipeline_id }
      end.sort_by { |s| [s[:pipeline_id].to_i, s[:position].to_i] }
    end

    def source_options(company_id)
      scope = if company_id.present? && ::Sales::Source.column_names.include?('company_id')
                ::Sales::Source.where(company_id: company_id)
              else
                ::Sales::Source.where(active: true)
              end
      scope = ::Sales::Source.all if scope.empty?
      scope.select(:id, :name).map do |s|
        { id: s.id, name: s.name }
      end.sort_by { |s| s[:name] }
    end

    def tag_options(company_id)
      scope = if company_id.present? && ::Sales::Tag.column_names.include?('company_id')
                ::Sales::Tag.where(company_id: company_id)
              else
                ::Sales::Tag.all
              end
      scope = ::Sales::Tag.all if scope.empty?
      scope = scope.active if scope.respond_to?(:active)
      scope.select(:id, :name, :color).map do |t|
        { id: t.id, name: t.name, color: t.color }
      end.sort_by { |t| t[:name] }
    end

    def competitor_options(company_id)
      scope = if company_id.present? && ::Sales::Competitor.column_names.include?('company_id')
                ::Sales::Competitor.where(company_id: company_id)
              else
                ::Sales::Competitor.where(active: true)
              end
      scope = ::Sales::Competitor.all if scope.empty?
      scope.select(:id, :name).map do |c|
        { id: c.id, name: c.name }
      end.sort_by { |c| c[:name] }
    end

    def product_options(company_id)
      if defined?(::Sales::Product)
        scope = if company_id.present? && ::Sales::Product.column_names.include?('company_id')
                  ::Sales::Product.where(company_id: company_id)
                else
                  ::Sales::Product.all
                end
        scope = ::Sales::Product.all if scope.empty?
        scope.select(:id, :name).map { |p| { id: p.id, name: p.name } }.sort_by { |p| p[:name] }
      else
        []
      end
    rescue StandardError
      []
    end

    def state_options
      tenant_scope.opportunities.joins(:account)
                  .where.not('sales_accounts.state': [nil, ''])
                  .distinct.pluck('sales_accounts.state').compact.sort
                  .map { |uf| { id: uf, name: uf } }
    rescue StandardError
      []
    end
  end
end
