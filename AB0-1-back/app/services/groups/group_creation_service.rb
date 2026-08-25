# frozen_string_literal: true

module Groups
  class GroupCreationService
    def self.call(attributes:, owner:)
      new(attributes: attributes, owner: owner).call
    end

    def initialize(attributes:, owner:)
      @attributes = attributes
      @owner = owner
    end

    def call
      raise ArgumentError, 'Comunidades indisponíveis' unless Groups::Feature.enabled?

      Group.transaction do
        attributes = @attributes.merge(owner: @owner, status: 'draft')
        attributes[:slug] = attributes[:slug].presence || attributes[:name].to_s.parameterize
        group = Group.create!(attributes)
        GroupMembership.create!(
          group: group,
          user: @owner,
          role: 'owner',
          status: 'active',
          joined_at: Time.current,
          approved_at: Time.current
        )
        group.update_columns(members_count: 1, updated_at: Time.current)
        DomainEvent.create!(
          event_type: 'group.created',
          aggregate_type: 'Group',
          aggregate_id: group.id,
          payload: { owner_id: @owner.id },
          occurred_at: Time.current
        )
        group
      end
    end
  end
end