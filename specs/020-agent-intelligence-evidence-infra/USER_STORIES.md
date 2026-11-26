# Spec 020 — USER STORIES

| ID | Persona | História | Requisitos |
|---|---|---|---|
| US-01 | Agente cliente (Claude, ChatGPT) | Como agente, quero um `evidence_id` em cada resposta para citar a fonte ao usuário e não repetir chamadas idênticas. | RF-01, RF-02 |
| US-02 | Suporte/Founder | Como operador, quero achar nos logs exatamente o que o MCP respondeu quando um cliente contesta uma informação, a partir do `evidence_id` informado. | RF-03 |
| US-03 | Agente cliente | Como agente, quero prompts guiados ("encontrar integrador na minha cidade", "comparar dois integradores") para executar o fluxo certo sem adivinhar a ordem das tools. | RF-04 |
| US-04 | Agente cliente | Como agente, quero autocompletar `category_slug` e `state` para não gerar argumentos inválidos. | RF-05 |
| US-05 | Dev frontend MCP UI | Como dev, quero ver no PR o diff visual e de tamanho de cada widget contra a `main`, para não mandar regressão silenciosa. | RF-06, RF-07, RF-08 |
| US-06 | Dev backend | Como dev, quero que o CI falhe se o contrato OpenAPI estiver inválido, para manter o contrato confiável para máquinas. | RF-09 |
| US-07 | Revisor de segurança | Como revisor, quero ver os endpoints e sinks detectados estaticamente nos widgets, para confirmar que só falam com o host bridge. | RF-07 |
| US-08 | Dono da Spec 019 | Como dono da 019, quero gerar evidência de browser (screenshots, HAR, SW) num ambiente padronizado para desbloquear T007/T042/T043. | lab (UI_SDK_QUALITY_LAB) |
| US-09 | Dev usando agente local | Como dev, quero o REA disponível como MCP no Claude Code para investigar bundles com guided workflows. | T-000 |
