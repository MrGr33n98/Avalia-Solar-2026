# frozen_string_literal: true

module Sales
  class AccountFilterOptionsQuery
    attr_reader :tenant_scope

    def initialize(tenant_scope = ::Sales::Account.all)
      @tenant_scope = tenant_scope
    end

    def self.call(tenant_scope = ::Sales::Account.all)
      new(tenant_scope).call
    end

    def call
      {
        segments: distinct_segments,
        states: distinct_states,
        statuses: distinct_statuses,
        owners: owner_options
      }
    end

    private

    def distinct_segments
      tenant_scope.where.not(segment: [nil, '']).distinct.pluck(:segment).sort
    end

    def distinct_states
      tenant_scope.where.not(state: [nil, '']).distinct.pluck(:state).compact.sort
    end

    def distinct_statuses
      tenant_scope.where.not(status: [nil, '']).distinct.pluck(:status).compact.sort
    end

    def owner_options
      owner_ids = tenant_scope.where.not(owner_id: nil).distinct.pluck(:owner_id)
      User.where(id: owner_ids).select(:id, :name, :email).map do |user|
        { id: user.id, name: user.name || user.email }
      end.sort_by { |o| o[:name] }
    end
  end
end
