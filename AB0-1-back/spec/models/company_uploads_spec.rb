require 'rails_helper'
require 'tempfile'

RSpec.describe Company, type: :model do
  def with_temp_file(content, extension)
    file = Tempfile.new(["upload-test", extension])
    file.binmode
    file.write(content)
    file.rewind
    yield file
  ensure
    file&.close!
  end

  let(:svg_payload) do
    <<~SVG
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400">
        <rect width="1200" height="400" fill="#0ea5e9" />
      </svg>
    SVG
  end

  describe 'validações de upload' do
    it 'aceita SVG para logo e banner' do
      company = build(:company)

      with_temp_file(svg_payload, '.svg') do |file|
        company.logo.attach(io: file, filename: 'logo.svg', content_type: 'image/svg+xml')
      end
      with_temp_file(svg_payload, '.svg') do |file|
        company.banner.attach(io: file, filename: 'banner.svg', content_type: 'image/svg+xml')
      end

      company.validate
      expect(company.errors[:logo]).to be_empty
      expect(company.errors[:banner]).to be_empty
    end

    it 'rejeita tipo inválido para logo com mensagem clara' do
      company = build(:company)

      with_temp_file('%PDF-1.4', '.pdf') do |file|
        company.logo.attach(io: file, filename: 'logo.pdf', content_type: 'application/pdf')
      end

      company.validate
      expect(company.errors[:logo]).to include('deve ser PNG, JPG, SVG ou WEBP')
    end

    it 'rejeita banner maior que 10MB' do
      company = build(:company)
      oversized_content = 'a' * (10.megabytes + 1)

      with_temp_file(oversized_content, '.jpg') do |file|
        company.banner.attach(io: file, filename: 'banner.jpg', content_type: 'image/jpeg')
      end

      company.validate
      expect(company.errors[:banner]).to include('tamanho máximo é 10MB')
    end

    it 'rejeita media asset que não é imagem' do
      company = build(:company)

      with_temp_file('conteudo de texto', '.txt') do |file|
        company.media_assets.attach(io: file, filename: 'arquivo.txt', content_type: 'text/plain')
      end

      company.validate
      expect(company.errors[:media_assets].join(' ')).to include('deve ser JPG, PNG, SVG ou WEBP')
    end
  end
end
