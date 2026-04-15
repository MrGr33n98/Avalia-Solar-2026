# frozen_string_literal: true

module LeadWizard
  class VersionPublisher
    def self.call(version)
      new(version).call
    end

    def initialize(version)
      @version = version
    end

    def call
      LeadWizardVersion.transaction do
        scope_relation = LeadWizardVersion.where(company_id: @version.company_id, category_id: @version.category_id)
        scope_relation.published.where.not(id: @version.id).update_all(
          status: LeadWizardVersion.statuses.fetch('archived'),
          archived_at: Time.current,
          updated_at: Time.current
        )

        @version.update!(
          status: 'published',
          published_at: Time.current,
          archived_at: nil
        )

        @version
      end
    end
  end
end
