# PDR — Bug Fix: Roteamento Numérico e Seleção de Opções no Menu do WhatsApp

**Projeto:** Avalia Solar 2026  
**Módulo:** Backend Rails (`AB0-1-back/app/services/whatsapp/`)  
**Data:** 2026-11-16  
**Prioridade:** P0 (Crítico / Bloqueador de Conversão e Suporte)  
**Status:** Pronto para Implementação  
**Autor:** Engenharia Avalia Solar  

---

## 1. Sumário Executivo & Incidente Observado

### 1.1 Contexto
O canal oficial de WhatsApp do Avalia Solar (integrado via WAHA Webhook) atua como portal conversacional para captação de avaliações, cadastro de integradores, reivindicação de perfis e apresentação de planos comerciais.

Ao enviar uma saudação espontânea ou a palavra-chave `MENU`, o sistema apresenta um menu de boas-vindas estruturado em 5 opções numeradas com emojis e palavras em destaque.

### 1.2 O Incidente (Evidência em Produção)
Conforme registrado nos testes com o bot oficial:

```
[Usuário]: MENU
[Bot]: Olá, Felipe! Sou o assistente oficial do Avalia Solar ☀️
Como posso ajudar você hoje? Responda com o número ou com a palavra em destaque:
1️⃣ AVALIAR uma empresa (por áudio ou texto)
2️⃣ CADASTRAR minha empresa gratuitamente
3️⃣ REIVINDICAR uma empresa já cadastrada
4️⃣ PERFIL — consultar como uma empresa aparece no portal
5️⃣ PLANOS — conhecer destaque e geração de leads
(Para falar com nossa equipe a qualquer momento, envie *AJUDA*)

[Usuário]: 5
[Bot]: 👩‍💻 Atendimento Humano — Avalia Solar
Recebemos sua solicitação de ajuda! Nossa equipe de suporte e consultoria já foi sinalizada.
• Para urgências comerciais ou suporte ao integrador, você também pode escrever para *growth@avaliasolar.com.br*.
• Para voltar ao menu automático a qualquer momento, digite MENU.

[Usuário]: 4
[Usuário]: 4
[Bot]: [Preview de Link com Card] Empresas de Energia Solar no Brasil | Avalia Solar
Encontre empresas de energia solar avaliadas em todo o Brasil. Compare reputacao, servicos e localizacao para contratar com mais seguranca.
www.avaliasolar.com.br
```

### 1.3 Sintomas Críticos
1. **Ao digitar `5` (PLANOS):** O sistema aciona indevidamente a transferência para suporte humano (`human_support`), informando que a equipe foi sinalizada, em vez de apresentar os planos comerciais e links de contratação (`ask_plans_pricing`).
2. **Ao digitar `4` (PERFIL):** O bot envia um link com preview rico sem criar contexto conversacional. O usuário digita `4` novamente e o bot apenas reenvia o mesmo link estático.
3. **Ao digitar variações numéricas comuns no mobile (`1.`, `1️⃣`, `4.`, `opcao 5`):** Os regexes estritos falham e o sistema cai em `unknown`, re-exibindo o menu ou gerando frustração.

---

## 2. Root Cause Analysis (RCA) Comprovado

A inspeção detalhada do código identificou 4 causas raízes encadeadas:

### RCA 1: Inversão no Mapeamento do Número 5 em `HybridIntentClassifier`
No arquivo `AB0-1-back/app/services/whatsapp/hybrid_intent_classifier.rb` (linha 42):
```ruby
# Linha 42
if @normalized.match?(/\A(?:5|ajuda|atendente|humano|suporte)\b/) || @normalized.match?(/(?:falar com (?:uma? )?(?:pessoa|atendente|especialista|humano|equipe)|preciso de ajuda|atendimento humano)/)
  return { intent: 'human_support', confidence: 1.0, slots: {} }
end
```
* **Causa:** O dígito `5` estava associado ao regex da intenção `human_support`. Em versão preliminar do bot, a opção 5 era "Ajuda". Posteriormente, o menu foi reformulado para colocar "5️⃣ PLANOS" e a ajuda passou a ser acionada por `AJUDA`. O classificador, contudo, nunca foi atualizado.

### RCA 2: Omissão do Número 5 no Intent `ask_plans_pricing`
No mesmo arquivo (linha 67):
```ruby
# Linha 67
if @normalized.match?(/(?:plano|planos|preco|precos|mensalidade|destaque|patrocinado|gerar leads|receber leads|receber orcamentos|como funciona o pago)/)
  return { intent: 'ask_plans_pricing', confidence: 0.95, slots: {} }
end
```
* **Causa:** Não havia correspondência para o número `5` ou `5️⃣`. Mesmo que o `5` fosse removido de `human_support`, a resposta cairia em `unknown` por falta da âncora numérica em `ask_plans_pricing`.

### RCA 3: Fragilidade dos Delimitadores de Regex e Falta de Normalização Numérica
No classificador determinístico:
* **Opção 1:** `/\A(?:1)\z/` — Exige apenas o caractere `1` puro. Rejeita `1.`, `1️⃣`, `1 - avaliar`, `opcao 1`.
* **Opção 4:** `/\A(?:4|perfil)\z/` — Exige estritamente `4` ou `perfil`. Rejeita `4.`, `4️⃣`, `opcao 4`.
* Como o teclado do WhatsApp e o corretor ortográfico no Android/iOS frequentemente inserem ponto final após dígito isolado (`"1."`), ou o usuário copia o emoji da mensagem (`1️⃣`), as opções falham silenciosamente.

### RCA 4: Comportamento Passivo/Stateless da Opção 4 (`check_brand_page`)
Em `AB0-1-back/app/services/whatsapp/conversation_router.rb` (linhas 89-111):
Quando o usuário digita apenas `4`, os slots de CNPJ e consulta vêm vazios. O método envia uma resposta com o link `https://www.avaliasolar.com.br/companies`. O WhatsApp gera o preview do link, ofuscando a instrução de texto que solicita o CNPJ. Sem máquina de estado, o usuário repete `4` e recebe a mesma mensagem em loop.

---

## 3. Matriz de Intenções Corrigida

| Número | Opção no Menu | Intenção Esperada | Regex Anterior | Regex Corrigido |
|:---:|---|---|---|---|
| **1** | AVALIAR | `evaluate_company` | `/\A(?:1)\z/` | `/\A(?:1|1️⃣|opcao 1|opção 1)\b/` + palavras-chave |
| **2** | CADASTRAR | `register_company` | `/\A(?:2\|cadastrar)\b/` | `/\A(?:2|2️⃣|opcao 2|opção 2|cadastrar)\b/` + palavras-chave |
| **3** | REIVINDICAR | `claim_company` | `/\A(?:3\|reivindicar)\b/` | `/\A(?:3|3️⃣|opcao 3|opção 3|reivindicar)\b/` + palavras-chave |
| **4** | PERFIL | `check_brand_page` | `/\A(?:4\|perfil)\z/` | `/\A(?:4|4️⃣|opcao 4|opção 4|perfil)\b/` + palavras-chave |
| **5** | PLANOS | `ask_plans_pricing` | *(Estava em `human_support`!)* | `/\A(?:5|5️⃣|opcao 5|opção 5|planos?|precos?)\b/` + palavras-chave |
| — | AJUDA / SUPORTE | `human_support` | `/\A(?:5\|ajuda...)\b/` | `/\A(?:ajuda|atendente|humano|suporte)\b/` *(sem número 5)* |

---

## 4. Especificação Técnica da Solução

### 4.1 Pré-Processamento e Normalização Numérica
Criar um método helper de normalização no classificador que extrai a opção numérica do usuário antes da avaliação de regex:

```ruby
def extract_numeric_option
  # Trata "1", "1.", "1️⃣", "opcao 1", "opção 1", "#1"
  cleaned = @raw_text.gsub(/[️⃣#]/, '').strip
  if (match = cleaned.match(/\A(?:opc(?:ao|ão)\s*)?([1-5])(?:\.|\b|\z)/i))
    match[1].to_i
  end
end
```

### 4.2 Reordenação e Ajuste do `deterministic_match`
1. **Opção Numérica Direta (Prioridade 1):**
   * Se `extract_numeric_option == 5` → Retorna `ask_plans_pricing` (confiança 1.0).
   * Se `extract_numeric_option == 4` → Retorna `check_brand_page` (confiança 1.0).
   * Se `extract_numeric_option == 3` → Retorna `claim_company` (confiança 1.0).
   * Se `extract_numeric_option == 2` → Retorna `register_company` (confiança 1.0).
   * Se `extract_numeric_option == 1` → Retorna `evaluate_company` (confiança 1.0).

2. **Suporte Humano (Sem o número 5):**
   ```ruby
   if @normalized.match?(/\A(?:ajuda|atendente|humano|suporte)\b/) ||
      @normalized.match?(/(?:falar com (?:uma? )?(?:pessoa|atendente|especialista|humano|equipe)|preciso de ajuda|atendimento humano)/)
     return { intent: 'human_support', confidence: 1.0, slots: {} }
   end
   ```

3. **Planos e Preços (`ask_plans_pricing`):**
   ```ruby
   if @normalized.match?(/\A(?:5|planos?|precos?|tabela de precos?)\b/) ||
      @normalized.match?(/(?:plano|planos|preco|precos|mensalidade|destaque|patrocinado|gerar leads|receber leads|receber orcamentos|como funciona o pago)/)
     return { intent: 'ask_plans_pricing', confidence: 1.0, slots: {} }
   end
   ```

### 4.3 Melhoria de UX no `handle_check_brand_page` (Opção 4)
Para evitar o problema do usuário ver apenas o preview do link e não entender o próximo passo:
1. Reformatar o texto para colocar a ação interativa antes do link externo:
   ```ruby
   msg = "🔎 *Consultar Perfil de Empresa — Avalia Solar*\n\n" \
         "👉 *Envie agora o CNPJ* (14 dígitos) ou o *Nome da Empresa* para eu localizar a página aqui no WhatsApp.\n\n" \
         "• Ou explore o diretório completo: https://www.avaliasolar.com.br/companies"
   ```

---

## 5. User Stories & Critérios de Aceite (Gherkin)

### US01: Seleção de Planos com Dígito 5
```gherkin
Cenário: Usuário digita número 5 após ver o menu
  Dado que o usuário recebeu o menu de boas-vindas do Avalia Solar
  Quando o usuário envia "5", "5.", "5️⃣" ou "opcao 5"
  Então o sistema DEVE classificar a intenção como "ask_plans_pricing"
  E o bot DEVE responder com a apresentação dos planos comerciais
  E o bot NÃO DEVE acionar o atendimento humano nem marcar needs_human_review
```

### US02: Seleção de Perfil com Dígito 4
```gherkin
Cenário: Usuário digita número 4 para consultar perfil
  Dado que o usuário recebeu o menu de boas-vindas
  Quando o usuário envia "4", "4.", "4️⃣" ou "opcao 4"
  Então o sistema DEVE classificar a intenção como "check_brand_page"
  E o bot DEVE solicitar claramente o CNPJ ou nome da empresa
```

### US03: Acionamento de Atendimento Humano
```gherkin
Cenário: Usuário solicita ajuda explicitamente
  Quando o usuário envia "AJUDA", "Quero falar com atendente" ou "Suporte humano"
  Então o sistema DEVE classificar como "human_support"
  E enviar a mensagem de suporte com o contato growth@avaliasolar.com.br
```

### US04: Seleção de Avaliação, Cadastro e Reivindicação (Opções 1, 2 e 3)
```gherkin
Cenário: Usuário seleciona opções 1, 2 ou 3 com variações de digitação
  Quando o usuário envia "1.", "1️⃣", "2.", "2️⃣", "3." ou "3️⃣"
  Então as intenções correspondentes ("evaluate_company", "register_company", "claim_company") DEVEM ser identificadas com sucesso
```

---

## 6. Plano de Testes Automatizados (RSpec)

### 6.1 `spec/services/whatsapp/hybrid_intent_classifier_spec.rb` (Novo)
Cobrir matriz de testes determinísticos para todas as opções do menu:
* `expect(described_class.call('5')[:intent]).to eq('ask_plans_pricing')`
* `expect(described_class.call('5.')[:intent]).to eq('ask_plans_pricing')`
* `expect(described_class.call('5️⃣')[:intent]).to eq('ask_plans_pricing')`
* `expect(described_class.call('opcao 5')[:intent]).to eq('ask_plans_pricing')`
* `expect(described_class.call('4')[:intent]).to eq('check_brand_page')`
* `expect(described_class.call('1')[:intent]).to eq('evaluate_company')`
* `expect(described_class.call('ajuda')[:intent]).to eq('human_support')`
* `expect(described_class.call('5')[:intent]).not_to eq('human_support')`

### 6.2 `spec/services/whatsapp/conversation_router_spec.rb` (Ampliação)
* Garantir que `described_class.call(message: { 'text' => '5' })` responde com `/Planos & Destaque para Integradores/`.
* Garantir que `described_class.call(message: { 'text' => 'ajuda' })` responde com `/Atendimento Humano/`.

---

## 7. Checklist de Implementação

- [ ] Criar branch `fix/whatsapp-numeric-menu-routing-bug`.
- [ ] Implementar helper de normalização numérica `extract_numeric_option` em `HybridIntentClassifier`.
- [ ] Remover `5` do regex de `human_support`.
- [ ] Adicionar suporte a `5`, `5.`, `5️⃣` e palavras-chave em `ask_plans_pricing`.
- [ ] Ampliar tolerância a `1.`, `1️⃣`, `4.`, `4️⃣` para as opções 1 e 4.
- [ ] Aprimorar mensagem da opção 4 (`check_brand_page`) com CTA acionável.
- [ ] Criar suite de testes em `spec/services/whatsapp/hybrid_intent_classifier_spec.rb`.
- [ ] Adicionar cenários de dígitos numéricos em `spec/services/whatsapp/conversation_router_spec.rb`.
- [ ] Validar execução de suite completa com Docker (`bundle exec rspec spec/services/whatsapp/`).
- [ ] Deploy e teste E2E no WhatsApp de homologação.

