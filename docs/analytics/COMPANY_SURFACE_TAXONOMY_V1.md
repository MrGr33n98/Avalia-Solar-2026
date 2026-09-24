# Taxonomia de superfícies de empresa — v1

Status: contrato inicial do workspace Tracking & Atribuição.

## Superfícies permitidas

| surface | Contexto primário | Exemplo de placement | Mídia de saída |
| --- | --- | --- | --- |
| company_profile | perfil público | hero, cta_primary | company_profile |
| search | busca | result_card, sponsored_result | search |
| category | categoria | result_card, featured_slot | category |
| ranking | ranking | position_card, quadrant | ranking |
| compare | comparação | compare_row | compare |
| related_companies | recomendação | related_card | related |
| product | produto | product_card | product |
| project | projeto | project_card | project |
| homepage | home | hero, featured_company | homepage |
| ads | campanha patrocinada | banner_slot | banner |

Valores fora desta lista são rejeitados pelo OutboundUrlBuilder. Placement e position não devem ser usados para carregar texto livre ou PII.

## Contextos de negócio

O campo context pode carregar o contexto operacional: category, search, ranking, campaign ou delivery. context não substitui surface; surface responde onde a empresa apareceu, context responde por que a exposição existiu.

## Envelope recomendado

~~~json
{
  "company_id": 42,
  "surface": "ranking",
  "placement": "position_card",
  "position": 3,
  "sponsored": false,
  "page_path": "/ranking",
  "session_id": "sess_anonimo",
  "impression_id": "imp_123",
  "click_id": "clk_123"
}
~~~

profile_view, cta_click e lead_created devem preservar company_id e os campos de jornada no mesmo evento ou em eventos correlacionáveis. Eventos patrocinados precisam conservar sponsored=true e não podem ser misturados ao ranking orgânico sem marcação.

## Regras de fonte

Atribuição de entrada aceita UTM editável e referrer classificado. Atribuição de saída da plataforma é controlada pelo backend:

- avaliasolar: inventário orgânico;
- avaliasolar_ads: inventário patrocinado;
- medium: derivado de surface;
- campaign/content: valores de campanha após normalização.

O destination do builder precisa ser URL http(s) com host válido, sem userinfo. O builder não faz request ao destino; apenas acrescenta parâmetros seguros.

## Estado atual dos produtores

O contrato de leitura e o builder estão implementados. A normalização completa de todos os produtores web, mobile e banners é etapa seguinte; produtores legados podem chegar sem surface/placement e aparecem em Diagnóstico como cobertura incompleta. Isso é intencional: o workspace não inventa superfície ausente.

## Evolução

Adicionar nova surface exige atualizar esta tabela, TrackingTaxonomy::SURFACES, o mapa de medium e os testes de contrato. Não criar alias silencioso nem aceitar superfície arbitrária para “não quebrar” campanha.
