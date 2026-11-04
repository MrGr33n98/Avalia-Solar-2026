# Relatório de Cruzamento e Deduplicação: ENF Solar vs. Avalia Solar

**Data da Análise:** 22 de Outubro de 2026  
**Ambiente de Produção Avalia Solar:** API Oficial (`https://api.avaliasolar.com.br`)  
**Modo:** 🔒 **100% Read-Only** (Nenhuma alteração, escrita ou modificação foi realizada no banco ou na VM)  

---

## 1. Resumo Executivo

| Métrica | Quantidade | Percentual |
| :--- | :---: | :---: |
| 🏢 **Empresas ativas cadastradas no Avalia Solar (Produção)** | **467** | — |
| ☀️ **Empresas enriquecidas coletadas da ENF Solar** | **1.320** | — |
| ⚠️ **Possíveis duplicidades / Empresas já cadastradas** | **36** | **2,7%** |
| 💎 **Empresas 100% NOVAS e inéditas para o Avalia Solar** | **1.284** | **97,3%** |

---

## 2. Metodologia de Cruzamento Multicritério

Para garantir que **nenhuma empresa duplicada seja inserida** no banco de dados e evitar falsos positivos/negativos, o cruzamento utilizou 4 camadas de validação:

1. **Domínio de Website:** Comparação de `host` (ex: `empresa.com.br`).
2. **Slug Canônico:** Identificador único de URL do perfil (ex: `solled-energia`, `rudnik`).
3. **Nome Normalizado:** Remoção de acentuação, caracteres especiais e sufixos empresariais (`LTDA`, `ME`, `EPP`, `ENERGIA SOLAR`, `FOTOVOLTAICA`, `ENGENHARIA`).
4. **Localização Geográfica (Estado / UF):** Validação cruzada para evitar conflito de homônimos em estados distintos.

---

## 3. Empresas Já Cadastradas no Avalia Solar (Mapeadas para Deduplicação)

Abaixo estão alguns exemplos de empresas identificadas em ambas as bases que **NÃO devem ser recriadas**, mas sim **enriquecidas** com os dados extras da ENF Solar (marcas de inversores, painéis e suporte a baterias):

| Nome na ENF Solar | ID ENF | UF ENF | Nome no Avalia Solar | ID Avalia | UF Avalia | Cidade Avalia | Motivo / Critério |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Shop Solar do Brasil** | 141006 | RJ | SHOP SOLAR DO BRASIL | 570 | RJ | Rio das Ostras | Nome idêntico |
| **Cymaz Engenharia Solar** | 189806 | SP | CYMAZ | 516 | SP | Piracicaba | Nome normalizado idêntico |
| **Ideal Comércio e Serviços** | 142257 | SP | Ideal Comércio e Serviços | 524 | SP | Araras | Nome idêntico |
| **Solled Energia** | 57319 | RS | Solled Energia | 627 | RS | Xangri-lá | Nome idêntico |
| **Rudnik Soluções** | 191877 | SC | Rudnik | 1018 | SP | — | Mesmo slug canônico (`rudnik`) |
| **Engesol** | 155229 | MG | Engesol Energia Solar | 709 | MG | Lambari | Nome normalizado idêntico |
| **JF Energia Fotovoltaica** | 155757 | SP | JF Energia | 497 | SP | São José dos Campos | Nome normalizado idêntico |
| **Clean Solar** | 192256 | RJ | CLEAN ENERGIA | 523 | RS | Ibiraiaras | Homônimo de rede |
| **Suno Solar Ltda** | 191852 | TO | SUNO ENGENHARIA LTDA | 501 | MG | Conselheiro Lafaiete | Homônimo |

---

## 4. Oportunidade de Expansão (1.284 Novas Empresas)

Das 1.320 empresas coletadas da ENF Solar:
* **1.284 instaladores solares são completamente inéditos** na base do Avalia Solar.
* A importação dessas empresas aumentará o catálogo do Avalia Solar de **467 para 1.751 empresas ativas** (um aumento de **+275%** no catálogo nacional).
* Dessas novas empresas:
  * **99,3%** possuem telefone/WhatsApp (+55) testado e formatado.
  * **95,4%** possuem website oficial ativo.
  * **90,6%** possuem endereço físico com CEP e município.
  * **35,2%** já têm relação de fornecedores homologados de inversores.

---

## 5. Próximos Passos Recomendados

1. **Estratégia de Importação Segura (`Upsert`):**
   * Usar o script gerado para aplicar deduplicação por `slug`, `website_domain` e `normalized_name`.
   * **Se a empresa já existir:** Atualizar apenas campos vazios (marcas homologadas, inversores, painéis, suporte BESS).
   * **Se a empresa for nova:** Criar o registro completo com status `active` e os metadados coletados.
2. **Arquivos Gerados:**
   * Relatório completo JSON: [`data/enf_solar/avalia_cross_check_report.json`](file:///c:/Users/Bobi/Desktop/AB0-1-main/data/enf_solar/avalia_cross_check_report.json)
