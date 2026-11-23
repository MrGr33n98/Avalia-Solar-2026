# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Secrets and credentials hygiene' do
  let(:root_path) do
    candidates = [
      Rails.root.join('..'),
      Pathname.new('/repo'),
      Rails.root
    ]
    candidates.find { |p| File.exist?(p.join('scripts/crawler/run_crawler.js')) } || Rails.root.join('..')
  end

  it 'ensures run_crawler.js does not contain hardcoded Firecrawl API keys' do
    crawler_script = root_path.join('scripts/crawler/run_crawler.js')
    expect(File.exist?(crawler_script)).to be(true), "Expected #{crawler_script} to exist"

    content = File.read(crawler_script)
    expect(content).not_to match(/fc-[a-f0-9]{32}/i)
    expect(content).to include('process.env.FIRECRAWL_API_KEY')
    expect(content).to include('[ERRO FATAL]')
  end

  it 'ensures no hardcoded Firecrawl API keys exist in codebase' do
    target_dirs = %w[scripts infra AB0-1-back/app AB0-1-back/config].map { |d| root_path.join(d) }
    pattern = /fc-[a-f0-9]{32}/i

    target_dirs.each do |dir|
      next unless Dir.exist?(dir)

      Dir.glob("#{dir}/**/*").each do |file_path|
        next unless File.file?(file_path)
        next if file_path.include?('/node_modules/') || file_path.include?('/vendor/') || file_path.include?('/tmp/')

        raw = File.binread(file_path) rescue nil
        next unless raw

        content = raw.encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
        expect(content).not_to match(pattern), "Hardcoded Firecrawl key found in #{file_path}"
      end
    end
  end
end
