# Inventário e Guia de Importação de Empresas via CSV (Plano Free)

> **Projeto:** Avalia Solar 2026  
> **Ambiente:** ActiveAdmin (`/admin/companies`) — API Backend Rails  
> **Data:** 20/10/2026  

---

## 1. Diagnóstico do Erro Ocorrido no Upload

Na tentativa de importação que resultou em:
```text
linha 2: nome ausente | linha 3: nome ausente | ... | linha 11: nome ausente
Importação concluída: 0 criadas, 0 atualizadas, 39 inválidas
```

Identificamos com precisão a causa raiz através do código em `app/admin/companies.rb` e do modelo `Company`:

1. **Estrutura Vertical vs Horizontal (Causa Primária):**
   - O arquivo submetido continha 2 colunas: `Coluna` e `Valor Extraído / Sugerido`, espalhadas em 39 linhas (uma para cada atributo).
   - O interpretador CSV do Rails lê a **Linha 1 como Cabeçalho de Colunas** e cada **linha subsequente como uma empresa diferente**.
   - O parser interpretou que o arquivo possuía 39 empresas, todas sem o cabeçalho `name` ou `nome` (pois as colunas se chamavam `Coluna` e `Valor Extraído / Sugerido`), gerando 39 erros de `"nome ausente"`.

2. **Formatação de Telefones e CNPJ:**
   - O modelo `Company` valida estritamente telefones com regex `/\A\d{10,15}\z/` (apenas dígitos, com DDD). Textos como `(11) 3141-3669` e `+55 51 99800-8500` violavam essa regra.
   - O CNPJ continha o texto da razão social: `50.982.813/0001-00 (AISWEI BRASIL LTDA)`. O validador oficial `CNPJ.valid?` exige apenas os dígitos numéricos ou pontuação padrão.

3. **Requisito de Categorias para Ativação:**
   - O método `company.ready_for_activation?` exige que a empresa possua pelo menos uma categoria associada (`return false unless categories.any?`). Sem o campo `categories`, a empresa é rebaixada para `status = 'pending'`.

4. **Tags e Segmentos Fora dos Padrões do Rails:**
   - O campo `Segment` continha texto explicativo (`supplier (ou installer...)`) em vez do valor do enum (`supplier`).
   - `Niche tags` continha termos não cadastrados no enum `Company::NICHE_TAGS`.

---

## 2. Inventário Completo de Campos para o Plano Free

Abaixo está o mapeamento exato de todos os 40 atributos suportados no cabeçalho CSV:

| # | Coluna CSV | Tipo | Obrigatório (Free) | Regra / Validação no Rails | Exemplo Válido (Solplanet) |
|---|---|---|---|---|---|
| 1 | `name` | String | **Sim** | Mínimo 2 caracteres | `Solplanet Brasil` |
| 2 | `slug` | String | **Sim** | Único, em minúsculas com hífens | `solplanet-brasil` |
| 3 | `plan` | String | Recomendado | `planfree`, `free` ou nome do plano | `planfree` |
| 4 | `description` | Text | **Sim** | Descrição comercial da empresa | `A Solplanet é um fornecedor global...` |
| 4 | `website` | URL | Não | URL válida (`http://` ou `https://`) | `https://solplanet.net/pt-br` |
| 5 | `phone` | String | Recomendado | Apenas dígitos (DDD + número: 10 a 11 dígitos) | `1131413669` |
| 6 | `phone_alt` | String | Não | Apenas dígitos (DDD + número) | `51998008500` |
| 7 | `whatsapp` | String | Recomendado | Apenas dígitos (DDI + DDD + número ou DDD + número) | `5551998008500` |
| 8 | `whatsapp_enabled` | Boolean | Não | `true`, `false`, `1` ou `0` | `true` |
| 9 | `whatsapp_url` | URL | Não | URL `https://wa.me/{numero}` | `https://wa.me/5551998008500` |
| 10 | `email` | Email | **Sim** | Email corporativo válido | `service.br@solplanet.net` |
| 11 | `email_public` | Email | Não | Email visível no perfil público | `abel.cj@solplanet.net` |
| 12 | `address` | Text | Não | Endereço físico completo | `SC 281, 3050, Sertão do Maruim, São José - SC` |
| 13 | `state` | String (UF) | **Sim** | Sigla de estado brasileiro válida (`BrLocations`) | `SC` |
| 14 | `city` | String | **Sim** | Cidade válida para o estado (`BrLocations`) | `São José` |
| 15 | `cnpj` | String | Recomendado | 14 dígitos numéricos válidos perante a Receita | `50982813000100` |
| 16 | `instagram` | URL | Não | URL do perfil | `https://www.instagram.com/solplanetbrasil/` |
| 17 | `facebook` | URL | Não | URL da página | `https://www.facebook.com/solplanetbrasil` |
| 18 | `linkedin` | URL | Não | URL da página | `https://www.linkedin.com/company/solplanet/` |
| 19 | `working_hours` | String | Não | Horário de atendimento | `Segunda a sexta: das 9h às 19h` |
| 20 | `founded_year` | Inteiro | Não | Ano numérico de fundação | `2009` |
| 21 | `coverage_states` | String | Não | UFs atendidas separadas por vírgula | `AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO` |
| 22 | `latitude` | Decimal | Não | Coordenada GPS (-90 a 90) | `-27.5954` |
| 23 | `longitude` | Decimal | Não | Coordenada GPS (-180 a 180) | `-48.6344` |
| 24 | `languages` | String | Não | Idiomas de suporte | `Português, Inglês, Chinês` |
| 25 | `segment` | String | **Sim** | `installer`, `supplier`, `integrator`, `distributor`, `finance`, `mobility` | `supplier` |
| 26 | `categories` | Lista/String | **Sim** | Categorias existentes (ex: `Inversores`, `Energia Solar`) | `Inversores, Energia Solar` |
| 27 | `project_types` | JSON Array | Não | Valores válidos de `Company::PROJECT_TYPES` | `["Residenciais", "Comerciais", "Rurais", "Industriais", "Condomínios", "Usinas de Solo", "Sistemas Off-grid", "Carregadores para Veículos Elétricos"]` |
| 28 | `services_offered` | JSON Array | Não | Valores válidos de `Company::SERVICES_OFFERED` | `["Projeto", "Instalação", "Monitoramento", "Manutenção e Assistência Técnica", "Consultoria", "Pós-venda"]` |
| 29 | `equipment_brands` | JSON Array | Não | Marcas representadas/fabricadas | `["Solplanet", "AISWEI"]` |
| 30 | `niche_tags` | JSON Array | Não | Tags válidas de `Company::NICHE_TAGS` | `["Mobilidade Elétrica"]` |
| 31 | `seo_title` | String | Não | Título SEO da página (até 70 chars) | `Solplanet Brasil` |
| 32 | `meta_description` | Text | Não | Meta descrição para buscadores | `Soluções energéticas inteligentes da Solplanet...` |
| 33 | `seo_description` | Text | Não | Descrição expandida para indexação | `A Solplanet oferece tecnologias conectadas...` |
| 34 | `seo_keywords` | String | Não | Palavras-chave separadas por vírgula | `solplanet, aiswei, inversor solar, energia solar` |
| 35 | `cta_primary_label` | String | Não | Texto do botão de ação | `Falar com um especialista` |
| 36 | `cta_primary_type` | String | Não | Tipo de ação (`whatsapp`, `link`, `phone`) | `whatsapp` |
| 37 | `cta_primary_url` | URL | Não | Destino do botão | `https://wa.me/5551998008500` |
| 38 | `moderation_status` | String | Não | `approved`, `pending_review`, `draft` | `approved` |
| 39 | `business_verification_status` | String | Não | `verified` ou `unverified` | `verified` |
| 40 | `status` | String | **Sim** | `active` (requer dados mínimos de ativação) ou `pending` | `active` |

---

## 3. Constantes Oficiais Permitidas pelo Backend

Para garantir compatibilidade total sem avisos de erro, utilize apenas os valores das constantes abaixo:

### Segmentos (`segment`):
- `installer` (Instaladores / Integradores B2C no marketplace)
- `supplier` (Fabricantes e fornecedores de equipamentos B2B)
- `integrator` (Empresas EPC / Grandes integradores)
- `distributor` (Distribuidores de equipamentos fotovoltaicos)
- `finance` (Bancos e instituições financeiras de crédito solar)
- `mobility` (Infraestrutura de recarga veicular)

### Tipos de Projetos (`project_types`):
- `Residenciais`
- `Comerciais`
- `Rurais`
- `Industriais`
- `Condomínios`
- `Usinas de Solo`
- `Sistemas Off-grid`
- `Carregadores para Veículos Elétricos`

### Serviços Oferecidos (`services_offered`):
- `Estudo Econômico`
- `Projeto`
- `Instalação`
- `Homologação`
- `Monitoramento`
- `Manutenção e Assistência Técnica`
- `Limpeza de Módulos`
- `O&M`
- `Consultoria`
- `Laudo Técnico`
- `Financiamento`
- `Pós-venda`

### Tags de Nicho (`niche_tags`):
- `Especialista em Condomínios`
- `Projetos Rurais`
- `Industrial e Usinas`
- `Mobilidade Elétrica`
- `Baterias e Off-Grid`

---

## 4. Arquivos Gerados no Repositório

1. **Template Geral em Branco (com linha de exemplo):**
   - [docs/templates/template_importacao_empresas_free.csv](file:///c:/Users/Bobi/Desktop/AB0-1-main/docs/templates/template_importacao_empresas_free.csv)
2. **Arquivo Pronto da Solplanet Brasil (com vírgula):**
   - [docs/templates/solplanet_brasil_import.csv](file:///c:/Users/Bobi/Desktop/AB0-1-main/docs/templates/solplanet_brasil_import.csv)
3. **Arquivo Pronto da Solplanet Brasil (com ponto-e-vírgula para Excel Brasil):**
   - [docs/templates/solplanet_brasil_import_semicolon.csv](file:///c:/Users/Bobi/Desktop/AB0-1-main/docs/templates/solplanet_brasil_import_semicolon.csv)
