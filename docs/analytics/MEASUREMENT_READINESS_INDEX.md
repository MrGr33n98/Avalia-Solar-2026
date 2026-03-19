# Measurement Readiness & Signal Quality Index

Gerado em: 2026-03-19  
Fonte base: `ANALYTICS_DOSSIER.md`

## Score Total: 73 / 100

**Veredito:** Usable with Gaps

## Breakdown

- Decision Alignment (0-25): 18  
  Eventos mapeiam funil e conversoes, mas faltam objetivos por brand/produto.
- Event Model Clarity (0-20): 15  
  Taxonomia razoavel, com eventos em Title Case e naming misto.
- Data Accuracy & Integrity (0-20): 15  
  Deduplicacao e LGPD existem, mas faltam validacoes por contexto de brand.
- Conversion Definition Quality (0-15): 10  
  Conversoes principais definidas, ainda sem regras por brand.
- Attribution & Context (0-10): 8  
  UTMs e attribution existem, sem dimensionamento por app/brand.
- Governance & Maintenance (0-10): 7  
  Dossie completo, mas sem registry parametrizado por brand.

## Gaps Criticos

1. Contexto de brand ausente na maioria dos eventos de produto.
2. Eventos sem padrao consistente de naming.
3. Contratos de evento nao exigem brand_id/brand_slug para eventos de produto.

## Ordem de Remediacao

1. Introduzir brand_id/brand_slug/app_key no tracking de produtos.
2. Persistir brand_id em analytics_events para consultas dimensionais.
3. Padronizar required_keys no event_definitions para eventos brand-aware.
