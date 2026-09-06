# frozen_string_literal: true

module Sales
  class CampaignSchedulerJob < ApplicationJob
    queue_as :default

    def perform
      ::Sales::Campaign.due_for_scheduled_dispatch.find_each do |campaign|
        Rails.logger.info("[CampaignSchedulerJob] Triggering due campaign #{campaign.id} (#{campaign.name})")
        ::Sales::Campaigns::Dispatcher.call(campaign: campaign, action: 'dispatch')
      end
    end
  end
end
