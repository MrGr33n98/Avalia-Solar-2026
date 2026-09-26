# Integração com Ranking & Algoritmos — Spec 005

## 1. Desacoplamento entre `priority_score` e Selo de Vencedor
- `companies.priority_score` é uma pontuação interna de balanceamento de catálogo e relevância editorial.
- É estritamente proibido inferir vitória em ranking na interface com base em `priority_score >= 100`.
- A concessão do status de vencedor decorre exclusivamente do ciclo de premiação:
  1. Fechamento de Snapshot Oficial de Ranking.
  2. Homologação dos resultados pela equipe técnica.
  3. Emissão do `Badge` oficial correspondente (ex: "1º Lugar Energia Solar - Curitiba 2026").
  4. Vínculo via `CompanyBadge`.
  5. Apresentação do `WinnerBadge` orientada ao selo conquistado.

---

## 2. Preservação dos Algoritmos Centrais
1. **TrustScore v2 (`TrustScore::Definition`):**
   - Peso de `verification` mantido estritamente em **25.0 pontos**.
   - Nenhuma alteração matemática nas fórmulas ou pesos nesta especificação.
2. **Posicionamento & Magic Quadrant (`CompanyDashboard::Positioning::Calculator`):**
   - Peso de `verification` mantido em **20%** no Eixo X.
   - Peso de `badge_depth` mantido em **10%** no Eixo X.
   - Preservados os critérios de elegibilidade e maturidade operacional.
