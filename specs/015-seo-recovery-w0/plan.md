# Plano técnico — SEO Recovery W0

## Sequência

1. Preservar o estado da branch e confirmar contratos reais.
2. Corrigir builders e tratamento de falhas no frontend.
3. Corrigir semântica 503 nos endpoints Rails.
4. Unificar decisão de páginas locais sem relaxar a política Rails.
5. Sanitizar a origem de `project_types` sem alterar dados históricos.
6. Adicionar testes de paginação, erro, robots, paridade e modelo.
7. Rodar Prettier, typecheck, lint, Jest focado e RSpec focado.
8. Registrar limitações de ambiente e preparar PR para revisão humana.

## Riscos e rollback

- Risco: API antiga sem `meta.pagination`; mitigação: fallback por tamanho do lote e limite de 500 páginas.
- Risco: mais de 50.000 empresas; mitigação atual: falha explícita 503, sem truncamento silencioso; fragmentação é W1.
- Rollback: reverter somente os arquivos da branch; nenhuma migration ou mutação de produção foi executada.

## Validação

Os testes devem demonstrar 101 empresas em duas páginas, HTTP 503 em feed indisponível, ausência de sitemap legado no robots e normalização de `project_types`. GSC e valores de produção ficam para pós-deploy.
