namespace :badges do
  desc 'Add verified badge to verified companies'
  task add_to_verified_companies: :environment do
    # SVG de um selo simples
    BADGE_SVG = <<~SVG
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
        <path d="M 40 55 L 50 65 L 65 40" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    SVG

    # Criar arquivo temporário
    temp_file = Rails.root.join('tmp', 'verified_badge.svg')
    Dir.mkdir(Rails.root.join('tmp')) unless Dir.exist?(Rails.root.join('tmp'))
    File.write(temp_file, BADGE_SVG)

    puts "Adicionando verified_badge a empresas verificadas..."
    count = 0

    Company.where(verified: true).find_each do |company|
      unless company.verified_badge.attached?
        File.open(temp_file) do |file|
          company.verified_badge.attach(
            io: file,
            filename: 'verified_badge.svg',
            content_type: 'image/svg+xml'
          )
        end
        count += 1
        puts "✓ Badge adicionado: #{company.name} (ID: #{company.id})"
      else
        puts "- Badge já existe: #{company.name} (ID: #{company.id})"
      end
    end

    File.delete(temp_file) if File.exist?(temp_file)
    puts "Concluído! #{count} badges adicionados."
  end
end
