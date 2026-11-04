# Avalia Curation MCP Server (Padrão A+++)

Servidor MCP nativo em Node.js (JSON-RPC 2.0 via `stdio`) desenvolvido especificamente para curadoria, deduplicação, geração de SEO/AEO e enquadramento de instaladores solares no **Plano Free** do Avalia Solar.

---

## 🌟 O que é o Padrão de Curadoria A+++?

O motor avalia cada empresa em **7 dimensões de qualidade** com pontuação de 0 a 100 pontos:

| Dimensão de Qualidade | Pontuação | Critério |
| :--- | :---: | :--- |
| 📞 **Telefone Comercial / WhatsApp** | **+20 pts** | Formatação canônica E.164 nacional: `+55 (XX) XXXXX-XXXX` |
| 📍 **Localização Completa** | **+20 pts** | Município, UF e Logradouro completos e normalizados |
| 🌐 **Website Oficial Ativo** | **+15 pts** | URL limpa com domínio próprio (excluindo redirecionamentos quebrados) |
| 🖼️ **Logotipo Verificado** | **+15 pts** | Imagem em CDN de alta resolução para avatar e catálogo |
| ⚡ **Inversores Homologados** | **+15 pts** | Até 15 pts por marcas parceiras (Fronius, Growatt, Deye, Huawei, Sungrow, etc.) |
| ☀️ **Painéis Solares Homologados** | **+10 pts** | Até 10 pts por fabricantes de módulos (Canadian, Jinko, LONGi, Trina, etc.) |
| 🔋 **Sistemas com Bateria (BESS)** | **+5 pts** | Capacidade técnica em sistemas híbridos e armazenamento |

### Classificação em Tiers:
* 🏆 **Tier A+++ (Score ≥ 80 pts):** *Curadoria Ouro* — Perfil completo de excelência máxima.
* 🥈 **Tier A (Score ≥ 65 pts):** *Curadoria Prata* — Perfil com alta densidade de dados e marcas.
* 🥉 **Tier B (Score ≥ 45 pts):** *Curadoria Bronze* — Perfil apto e validado para o Plano Free.
* 🚫 **Tier C (Score < 45 pts):** *Incompleto* — Descartado automaticamente para proteger a reputação do diretório.

---

## 🚀 Motor de SEO & AEO (Local Search & AI Discovery)

Para cada empresa aprovada, o MCP gera:
1. **`seo_title`:** Título otimizado de 30 a 60 caracteres (ex: `Nome da Empresa - Energia Solar em Cidade, UF | Avalia Solar`).
2. **`seo_description`:** Meta description magnética de 70 a 160 caracteres com chamadas para orçamento e avaliações.
3. **`seo_keywords`:** Palavras-chave long-tail segmentadas por município e estado.
4. **Rich Snippets JSON-LD:** Schema.org estruturado em `LocalBusiness` e `SolarEnergySystem`.
5. **GEO Meta Tags:** Metadados regionais (`geo.region`, `geo.placename`).

---

## 💼 Enquadramento Contratual no Plano Free

O MCP formata o registro para publicação no catálogo público do Avalia Solar com as seguintes regras de negócio:
* **Plano:** `plan_tier: "free"`, `plan_id: null` (100% gratuito).
* **Status:** `status: "active"`, `moderation_status: "approved"` (já pré-curado em nível A+++).
* **Limites de Cobertura:** 1 estado e até 3 cidades de atendimento inicial.
* **Categoria Oficial:** ID 70 (`Instalador Solar Fotovoltaico`).
* **Flags Comerciais:** `verified: false`, `featured: false`, `claim_profile_available: true`.

---

## 🛠️ Ferramentas Disponíveis no MCP

* **`curate_company`**: Analisa uma empresa individual e retorna Score, Tier e dados limpos.
* **`generate_seo_package`**: Gera pacote de títulos, descrições, keywords e schema.org.
* **`build_free_tier_payload`**: Gera o payload no contrato oficial de `POST /api/v1/companies`.
* **`run_batch_curation_pipeline`**: Processa a base inteira, filtra duplicatas, higieniza, gera SEO e salva o arquivo `.jsonl` final.
* **`get_curation_metrics`**: Retorna métricas consolidadas de notas e distribuição regional.

---

## 📂 Arquivos de Saída Gerados

* Dataset Final A+++: [`data/enf_solar/enf_companies_a_plus_free_tier.jsonl`](file:///c:/Users/Bobi/Desktop/AB0-1-main/data/enf_solar/enf_companies_a_plus_free_tier.jsonl)
* Servidor MCP: [`scripts/mcp-curation/index.js`](file:///c:/Users/Bobi/Desktop/AB0-1-main/scripts/mcp-curation/index.js)
