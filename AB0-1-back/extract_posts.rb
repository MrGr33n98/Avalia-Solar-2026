require 'json'

puts "Iniciando extração e validação de posts..."

base_frontend_url = "http://127.0.0.1:3000/blog"
output_file = "posts_extraction.json"

posts_data = []

# 1. Identificação e Coleta
articles = Article.where(status: 'published').includes(:category)

if articles.empty?
  puts "AVISO: Nenhum artigo publicado encontrado no banco de dados."
else
  puts "Encontrados #{articles.count} artigos publicados."
end

articles.each do |article|
  # 2. Extração de Metadados e Conteúdo
  post_info = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    category: article.category&.name,
    published_at: article.published_at,
    excerpt: article.excerpt,
    # 3. Verificação de Estrutura de URL
    frontend_url: "#{base_frontend_url}/#{article.slug}",
    api_url: "http://127.0.0.1:3001/api/v1/articles/#{article.slug}",
    validation_status: article.slug.present? ? "valid" : "missing_slug"
  }
  
  posts_data << post_info
end

# 4. Organização em JSON
File.open(output_file, 'w') do |f|
  f.write(JSON.pretty_generate(posts_data))
end

puts "\n=== Relatório de Extração ==="
puts "Total de Posts Processados: #{posts_data.count}"
puts "Arquivo gerado: #{output_file}"

posts_data.each do |post|
  puts "- [#{post[:validation_status].upcase}] #{post[:title]}"
  puts "  URL: #{post[:frontend_url]}"
end

puts "\nValidação concluída."
