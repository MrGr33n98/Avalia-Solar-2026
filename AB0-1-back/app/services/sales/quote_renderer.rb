module Sales
  class QuoteRenderer
    def self.call(quote:)
      items = quote.items.map do |item|
        "<tr><td>#{ERB::Util.html_escape(item.description)}</td><td>#{item.quantity}</td><td>R$ #{format('%.2f', item.total_cents / 100.0)}</td></tr>"
      end.join
      solar_project = quote.try(:solar_project)
      technical_summary = solar_project ? "<p>Projeto solar: #{solar_project.system_kwp} kWp</p>" : ""
      <<~HTML
        <!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta #{ERB::Util.html_escape(quote.number)}</title></head>
        <body><h1>Proposta #{ERB::Util.html_escape(quote.number)}</h1><p>Status: #{quote.status}</p>
        <table><thead><tr><th>Item</th><th>Quantidade</th><th>Total</th></tr></thead><tbody>#{items}</tbody></table>
        #{technical_summary}
        <h2>Total: R$ #{format('%.2f', quote.total_cents / 100.0)}</h2></body></html>
      HTML
    end
  end
end
