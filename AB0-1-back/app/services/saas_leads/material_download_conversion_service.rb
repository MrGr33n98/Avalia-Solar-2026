# frozen_string_literal: true

module SaasLeads
  class MaterialDownloadConversionService
    SOURCE = "material_download"
    ACTION = "downloaded_material"

    def self.call(content_lead:, material_download:, material:)
      new(content_lead, material_download, material).call
    end

    def initialize(content_lead, material_download, material)
      @content_lead, @material_download, @material = content_lead, material_download, material
    end

    def call
      email = @content_lead.email.to_s.strip.downcase
      return nil if email.blank?
      lead = Lead.find_or_initialize_by(email: email)
      created = lead.new_record?
      lead.name ||= @content_lead.name
      lead.phone ||= @content_lead.phone
      lead.company ||= @content_lead.company_name
      lead.company_id ||= @material.company_id
      lead.source = SOURCE if lead.source.blank? || lead.source == "portal"
      lead.utm_source ||= @material_download.utm_source if @material_download.respond_to?(:utm_source)
      lead.utm_medium ||= @material_download.utm_medium if @material_download.respond_to?(:utm_medium)
      lead.utm_campaign ||= @material_download.utm_campaign if @material_download.respond_to?(:utm_campaign)
      lead.attribution_json = (lead.attribution_json || {}).deep_merge("material_download" => context) if lead.respond_to?(:attribution_json=)
      lead.save!
      Analytics::TrackEventService.call(company_id: @material.company_id, event_type: "material_download_authorized", metadata: context.merge("lead_id" => lead.id, "source" => SOURCE, "action" => ACTION, "signal_category" => "buyer_intent"), tracked_at: @material_download.authorized_at, event_id: "material-download:#{@material_download.id}:material_download_authorized")
      Rails.logger.info("[SaasLeads::MaterialDownloadConversion] lead_id=#{lead.id} content_lead_id=#{@content_lead.id} material_download_id=#{@material_download.id} material_id=#{@material.id} company_id=#{@material.company_id} created=#{created} source=#{SOURCE}")
      lead
    end

    private

    def context
      { "company_id" => @material.company_id, "company_name" => @material.company.name, "material_id" => @material.id, "material_slug" => @material.slug, "material_title" => @material.title, "material_download_id" => @material_download.id, "gate_mode" => @material.gate_mode, "occurred_at" => Time.current.iso8601 }
    end
  end
end
