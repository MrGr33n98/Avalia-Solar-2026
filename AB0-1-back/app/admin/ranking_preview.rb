ActiveAdmin.register_page 'Ranking Preview' do
  menu parent: 'Empresas', label: '🔍 Preview de Ranking', priority: 2

  content title: 'Simulador de Ranking Meritocrático' do
    # Form de Seleção
    panel 'Filtros de Simulação' do
      form action: admin_ranking_preview_path, method: :get do |_f|
        div style: 'display: flex; gap: 20px; align-items: flex-end; padding: 10px;' do
          div do
            label 'Categoria', style: 'display: block; font-weight: bold; margin-bottom: 5px;'
            select name: 'category_id', style: 'width: 250px; padding: 8px;' do
              option 'Selecione uma Categoria', value: ''
              Category.all.order(:name).each do |cat|
                option cat.name, value: cat.id, selected: params[:category_id].to_s == cat.id.to_s
              end
            end
          end

          div do
            label 'Estado (UF)', style: 'display: block; font-weight: bold; margin-bottom: 5px;'
            select name: 'state', style: 'width: 100px; padding: 8px;' do
              option 'UF', value: ''
              Company.pluck(:state).compact.uniq.sort.each do |st|
                option st, value: st, selected: params[:state] == st
              end
            end
          end

          div do
            label 'Cidade', style: 'display: block; font-weight: bold; margin-bottom: 5px;'
            input name: 'city', value: params[:city], placeholder: 'Ex: Florianópolis',
                  style: 'padding: 8px; border: 1px solid #ccc; border-radius: 4px;'
          end

          div do
            button 'Gerar Preview', type: 'submit', class: 'button'
          end
        end
      end
    end

    # Tabela de Resultados
    if params[:category_id].present?
      category = Category.find(params[:category_id])
      companies = Company.active.joins(:categories).where(categories: { id: category.id })
      companies = companies.where(state: params[:state]) if params[:state].present?
      companies = companies.where('city ILIKE ?', "%#{params[:city]}%") if params[:city].present?

      # Usa a Engine de Ranking que criamos na US01
      ranked_companies = companies.ordered_by_priority.limit(10)

      panel "Ranking Resultante para: #{category.name} em #{params[:city].presence || 'Todas as Cidades'}" do
        if ranked_companies.any?
          table_for ranked_companies do
            column 'Posição' do |c|
              idx = ranked_companies.index(c) + 1
              if idx <= 3
                span "🏆 #{idx}º",
                     style: "font-weight: bold; color: #{if idx == 1
                                                           '#D4AF37'
                                                         else
                                                           (idx == 2 ? '#C0C0C0' : '#CD7F32')
                                                         end};"
              else
                "#{idx}º"
              end
            end
            column 'Empresa' do |c|
              link_to c.name, admin_company_path(c)
            end
            column 'Patrocinada?' do |c|
              status_tag(c.sponsored ? 'Sim' : 'Não', class: c.sponsored ? 'ok' : 'warn')
            end
            column 'Priority Score', :priority_score
            column 'Rating Avg', :rating_avg
            column 'Reviews', :rating_count
            column 'Ranking Score (Ruby)' do |c|
              c.calculate_ranking_score.round(4)
            end
          end
        else
          div 'Nenhuma empresa encontrada com estes filtros.', class: 'blank_slate'
        end
      end
    else
      div 'Selecione uma categoria para simular o ranking.', class: 'blank_slate'
    end
  end
end
