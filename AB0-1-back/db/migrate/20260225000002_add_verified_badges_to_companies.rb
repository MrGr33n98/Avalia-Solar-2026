class AddVerifiedBadgesToCompanies < ActiveRecord::Migration[7.0]
  def up
    # SVG de um selo simples
    badge_svg = <<~SVG
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
        <path d="M 40 55 L 50 65 L 65 40" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    SVG

    # Pegar todas as empresas verificadas
    Company.where(verified: true).find_each do |company|
      unless company.verified_badge.attached?
        # Criar um blob e attach à empresa
        blob = ActiveStorage::Blob.create_and_upload!(
          io: StringIO.new(badge_svg),
          filename: 'verified_badge.svg',
          content_type: 'image/svg+xml'
        )
        
        company.verified_badge.attach(blob)
        puts "✓ Badge adicionado: #{company.name}"
      end
    end
  end

  def down
    # Remove all verified_badge attachments
    ActiveStorage::Attachment.where(record_type: 'Company', name: 'verified_badge').destroy_all
  end
end
