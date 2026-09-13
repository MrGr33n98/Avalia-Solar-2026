# Avalia Solar CRM — Reports Icon Assets

Pacote extraído da folha visual aprovada para a aba **Analytics & Performance Comercial**.

## Formato
- PNG individual
- 128 × 128 px
- RGBA com fundo transparente
- Arquivos separados por categoria

## Estrutura
- 01_kpi_metricas
- 02_tipos_graficos
- 03_acoes_controles
- 04_entidades_segmentos
- 05_status_indicadores
- 06_rankings_conquistas
- 07_tempo_calendario
- 08_resultados_campanha_email
- 09_financeiro
- 10_interface_navegacao

## Uso recomendado no dashboard
Para a aplicação Next.js, copie a pasta desejada para `public/assets/crm/reports/icons/`.

Exemplo:
`public/assets/crm/reports/icons/01_kpi_metricas/pipeline_total.png`

Uso:
`<Image src="/assets/crm/reports/icons/01_kpi_metricas/pipeline_total.png" width={20} height={20} alt="" />`

Para ícones pequenos de UI (16–24 px), prefira SVG/Lucide quando possível. Estes PNGs são melhores para KPI cards,
insights, empty states, ilustrações e elementos de destaque.
