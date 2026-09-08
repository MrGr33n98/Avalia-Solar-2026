# frozen_string_literal: true

module Sales
  module Imports
    class LeadRowDTO
      attr_accessor :company_name, :contact_name, :email, :phone, :whatsapp,
                    :website, :city, :state, :segment, :job_title,
                    :estimated_value, :source, :owner_identifier,
                    :stage_identifier, :tags, :notes, :external_id

      def initialize(attrs = {})
        attrs = attrs.transform_keys(&:to_sym) if attrs.is_a?(Hash)
        @company_name     = attrs[:company_name]
        @contact_name     = attrs[:contact_name]
        @email            = attrs[:email]
        @phone            = attrs[:phone]
        @whatsapp         = attrs[:whatsapp]
        @website          = attrs[:website]
        @city             = attrs[:city]
        @state            = attrs[:state]
        @segment          = attrs[:segment]
        @job_title        = attrs[:job_title]
        @estimated_value  = attrs[:estimated_value]
        @source           = attrs[:source]
        @owner_identifier = attrs[:owner_identifier]
        @stage_identifier = attrs[:stage_identifier]
        @tags             = Array(attrs[:tags])
        @notes            = attrs[:notes]
        @external_id      = attrs[:external_id]
      end

      def to_h
        {
          company_name: @company_name,
          contact_name: @contact_name,
          email: @email,
          phone: @phone,
          whatsapp: @whatsapp,
          website: @website,
          city: @city,
          state: @state,
          segment: @segment,
          job_title: @job_title,
          estimated_value: @estimated_value,
          source: @source,
          owner_identifier: @owner_identifier,
          stage_identifier: @stage_identifier,
          tags: @tags,
          notes: @notes,
          external_id: @external_id
        }
      end
    end
  end
end
