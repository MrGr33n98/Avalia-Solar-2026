# frozen_string_literal: true

class MaterialDownloadMailer < ApplicationMailer
  def download_link(download, token)
    @download = download
    @material = download.company_material
    @company = download.company
    @lead = download.content_lead
    @download_url = frontend_url("/api/v1/material_downloads/#{@download.id}/file?token=#{token}")

    mail(
      to: @lead.email,
      subject: "Seu download do material da #{@company.name} está pronto!"
    )
  end
end
