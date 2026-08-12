# MobiVolt Lead Qualification Wizard Bug - Walkthrough

## O que foi corrigido?

Corrigimos o problema onde o passo final (8/8) do `ChatLeadQualificationWizard` (o assistente de consultoria solar do chatbot) não avançava após o usuário clicar em "Encontrar empresas e reviews", falhando silenciosamente sem exibir estados de erro, carregamento ou sucesso.

## Qual era a causa raiz?

A falha era composta por três pontos de quebra na cadeia de fluxo:

1. **Falta de Validação e Normalização (Frontend)**: O formulário aceitava telefones muito curtos (ex: `119999`) e não validava apropriadamente o formato do e-mail. Além disso, a API backend espera telefones normalizados com DDI (ex: `+55`), mas o frontend estava enviando a string bruta (`65 9992423309`).
2. **Quebra na Propagação de Erros (`ChatWidget.tsx`)**: O callback `handleQualificationSubmit` chamava `submitLead(data)`, mas não repassava o booleano de sucesso de volta para o componente visual.
3. **Ausência de Estado de Erro (`ChatLeadQualificationWizard.tsx`)**: A função local `submit` realizava um `await onSubmit(...)` mas assumia que a resposta seria sempre um sucesso, e não possuía nenhum mecanismo de `try/catch` ou blocos condicionais para alertar o usuário de que algo falhou. Como a requisição para a API falhava por erro de formato 422, o formulário simplesmente travava.

## Arquivos Modificados

1. **[ChatLeadQualificationWizard.tsx](../../AB0-1-front/components/chat/ChatLeadQualificationWizard.tsx)**
   - Adicionada validação via regex para garantir que o formato do e-mail é válido (`^[^\s@]+@[^\s@]+\.[^\s@]+$`).
   - Adicionada normalização de telefone (remoção de caracteres não-numéricos via `replace(/\D/g, '')`) e verificação de tamanho (mínimo 10, máximo 11 dígitos).
   - Injeção automática do prefixo `+55` antes de chamar o submit.
   - Alterada a assinatura da prop `onSubmit` para retornar `Promise<boolean>`.
   - Adicionado bloco `try/catch` ao redor de `onSubmit`. Caso retorne `false` ou lance exceção, um erro genérico ("Não foi possível concluir agora. Tente novamente.") é exibido na tela.

2. **[ChatWidget.tsx](../../AB0-1-front/components/chat/ChatWidget.tsx)**
   - Modificado o método `handleQualificationSubmit` para retornar a flag `success` retornada pelo hook `useChatSession::submitLead`.

3. **[ChatLeadQualificationWizard.test.tsx](../../AB0-1-front/components/__tests__/ChatLeadQualificationWizard.test.tsx)**
   - Os testes de unidade foram fortalecidos.
   - Atualizamos a estrutura do mock (para resolver erro de escopo de `fetch` da API do ViaCEP global).
   - Ajustamos os cenários de teste para passarem pelos novos passos adicionados recentemente à UI (`Roof Type`, `Review Interest`, e seleção de CEP).
   - Foram implementados dois testes novos vitais:
     - Um teste verificando que ao preencher email/telefone inválido o form exibe o erro e bloqueia o `onSubmit`.
     - Um teste verificando que ao retornar `false` na Promise do `onSubmit`, o usuário visualizará a mensagem de alerta genérica.

## Como verificar a correção

### Via Testes Automatizados

O pipeline de testes para o componente está passando com 100% de sucesso.
Pode ser executado localmente via:

```bash
cd AB0-1-front
npm run test -- ChatLeadQualificationWizard.test.tsx
```

### Validação Manual (PWA/Browser)

1. Inicie a aplicação `npm run dev` na pasta `AB0-1-front` e abra o `ChatWidget` na home page.
2. Inicie o fluxo clicando em **Consultoria Solar**.
3. Preencha todos os passos interativos de quiz.
4. No último passo (8/8) **"Quase pronto. Como podemos falar com você?"**:
   - Tente preencher um e-mail falso como "testando123" e veja se é barrado.
   - Tente preencher um telefone muito curto ("11999"). O form deve ser barrado com um erro descritivo.
   - Forneça dados corretos e clique em **"Encontrar empresas e reviews"**.
   - O formulário fechará imediatamente, gravando as respostas, e a interface principal de chat apresentará a mensagem de sucesso de envio de leads ao fluxo.
