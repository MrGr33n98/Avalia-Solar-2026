Entendi. O escopo deve ser **somente ajustar os balões e gatilhos flutuantes existentes**, sem criar novos componentes, sem alterar cards e sem refatorar a arquitetura inteira.

Use este requirements corrigido:

````markdown
# Requirements Document
## Ajuste dos Balões Flutuantes no Mobile

### Introduction

Este documento define os requisitos para corrigir exclusivamente o posicionamento e a aparência dos balões flutuantes já existentes no Avalia Solar.

Os arquivos que devem ser alterados são:

- `ComparisonFloatingBar.tsx`
- `FloatingChatTrigger.tsx`
- `MobiVoltInviteBubble.tsx`

Não criar novos componentes.  
Não alterar cards de empresa.  
Não alterar lógica de comparação.  
Não alterar o fluxo do MobiVolt AI.  
Não alterar a bottom navigation.

O objetivo é apenas organizar corretamente os três elementos flutuantes no mobile:

1. balão de Chat;
2. balão do MobiVolt AI;
3. botão compacto Comparar.

---

## Requirement 1 — Organização vertical

**User Story:** Como usuário mobile, quero que os balões flutuantes apareçam organizados, para que não fiquem sobrepostos.

### Acceptance Criteria

1. WHEN os três elementos estiverem visíveis THEN eles SHALL aparecer em coluna vertical no canto inferior direito.
2. A ordem SHALL ser:
   - Chat;
   - MobiVolt AI;
   - Comparar.
3. SHALL existir no mínimo 12 px de distância entre cada elemento.
4. Nenhum elemento SHALL ficar sobreposto a outro.
5. Todos SHALL permanecer alinhados pela direita.
6. Todos SHALL ficar acima da bottom navigation.
7. Todos SHALL respeitar `env(safe-area-inset-bottom)`.

---

## Requirement 2 — ComparisonFloatingBar

**User Story:** Como usuário mobile, quero que o botão Comparar seja compacto, para que não ocupe espaço excessivo.

### Acceptance Criteria

1. Alterar apenas o estado mobile minimizado do `ComparisonFloatingBar`.
2. O botão SHALL possuir altura entre 44 px e 46 px.
3. A largura SHALL ficar entre 132 px e 156 px.
4. O botão SHALL exibir:
   - ícone;
   - texto `Comparar`;
   - contador, por exemplo `3/4`.
5. O wrapper branco externo SHALL ser removido no mobile.
6. O botão SHALL utilizar fundo azul sólido.
7. O botão SHALL permanecer no canto inferior direito.
8. O estado expandido SHALL continuar funcionando.
9. A lógica `hidden`, `minimized` e `expanded` SHALL ser preservada.
10. O desktop SHALL permanecer inalterado.

---

## Requirement 3 — FloatingChatTrigger

**User Story:** Como usuário mobile, quero que o gatilho de Chat fique acima do MobiVolt AI, para identificar claramente cada ação.

### Acceptance Criteria

1. O gatilho SHALL continuar utilizando o componente atual.
2. Não criar um novo botão de Chat.
3. Ajustar somente:
   - `bottom`;
   - `right`;
   - `z-index`;
   - tamanho visual;
   - sombra;
   - espaçamento.
4. O botão SHALL possuir aproximadamente 44 × 44 px.
5. O botão SHALL ficar acima do MobiVolt AI.
6. O botão SHALL possuir fundo branco sólido.
7. O botão SHALL manter o ícone atual.
8. O botão SHALL NOT possuir anel ou borda externa excessiva.
9. O comportamento atual de abertura SHALL ser preservado.

---

## Requirement 4 — MobiVoltInviteBubble

**User Story:** Como usuário mobile, quero que o balão do MobiVolt fique entre Chat e Comparar, sem cobrir os demais elementos.

### Acceptance Criteria

1. O componente atual SHALL ser reutilizado.
2. Não criar novo componente de IA.
3. Ajustar somente:
   - posição;
   - dimensão;
   - espaçamento;
   - `z-index`;
   - borda;
   - sombra.
4. O balão ou gatilho SHALL ficar abaixo do Chat.
5. O balão ou gatilho SHALL ficar acima do Comparar.
6. SHALL existir pelo menos 12 px entre os três elementos.
7. O balão SHALL NOT cobrir o botão Comparar.
8. O balão SHALL NOT cobrir a bottom navigation.
9. Ao abrir o comparador, o convite SHALL ser fechado ou recolhido.
10. A lógica atual de abertura e fechamento SHALL ser preservada.

---

## Requirement 5 — Posicionamento

Os componentes deverão usar posições coordenadas.

### Comparar

```css
right: 16px;

bottom: calc(
  var(--mobile-nav-height) +
  env(safe-area-inset-bottom) +
  16px
);
````

### MobiVolt AI

```css
right: 16px;

bottom: calc(
  var(--mobile-nav-height) +
  env(safe-area-inset-bottom) +
  72px
);
```

### Chat

```css
right: 16px;

bottom: calc(
  var(--mobile-nav-height) +
  env(safe-area-inset-bottom) +
  128px
);
```

Os valores podem ser ajustados conforme as dimensões reais dos componentes, desde que seja mantido:

```text
Chat
12 px
MobiVolt AI
12 px
Comparar
```

---

## Requirement 6 — Z-index

Utilizar hierarquia simples:

```text
Comparar: 50
MobiVolt AI: 60
Chat: 70
Balão expandido: 80
Modal: 9000+
```

Evitar valores extremamente altos nos gatilhos simples, salvo necessidade comprovada.

---

## Requirement 7 — Investigação obrigatória

Antes de alterar o código:

1. Ler `ComparisonFloatingBar.tsx`, especialmente as linhas mobile entre aproximadamente 220 e 460.
2. Ler `FloatingChatTrigger.tsx` completo.
3. Ler `MobiVoltInviteBubble.tsx` completo.
4. Identificar em cada arquivo:

   * `position: fixed`;
   * `bottom`;
   * `right`;
   * `left`;
   * `z-index`;
   * wrappers brancos;
   * sombras;
   * tamanhos.
5. Informar qual arquivo gera:

   * Chat;
   * MobiVolt AI;
   * Comparar.
6. Identificar a origem exata da sobreposição.
7. Identificar a origem da borda branca excessiva do Comparar.

---

## Requirement 8 — Responsividade

Validar em:

* 320 px;
* 360 px;
* 375 px;
* 390 px;
* 412 px;
* 430 px.

### Acceptance Criteria

1. Nenhum elemento SHALL ficar sobreposto.
2. Nenhum elemento SHALL ultrapassar a viewport.
3. Nenhum elemento SHALL cobrir a bottom navigation.
4. Nenhum scroll horizontal SHALL ser criado.
5. A safe area SHALL ser respeitada.
6. O desktop SHALL permanecer inalterado.

---

# Design Document

## Overview

A implementação deverá modificar apenas os estilos e posicionamentos dos componentes existentes.

Não criar:

* `MobileFloatingActions`;
* novo provider;
* novo gerenciador global;
* novo sistema de portal;
* novos botões duplicados.

---

## Arquivos a alterar

### `ComparisonFloatingBar.tsx`

Alterar exclusivamente:

* estado minimizado mobile;
* wrapper do botão;
* posição;
* tamanho;
* sombra;
* `z-index`.

Preservar:

* estado expandido;
* modal;
* eventos;
* analytics;
* lógica de comparação;
* desktop.

### `FloatingChatTrigger.tsx`

Alterar exclusivamente:

* posição mobile;
* dimensão;
* sombra;
* borda;
* `z-index`.

Preservar:

* callback de abertura;
* acessibilidade;
* analytics;
* comportamento desktop.

### `MobiVoltInviteBubble.tsx`

Alterar exclusivamente:

* posição mobile;
* distância do Chat;
* distância do Comparar;
* largura máxima;
* borda;
* sombra;
* `z-index`.

Preservar:

* conteúdo;
* ações;
* temporização;
* lógica de fechamento;
* analytics.

---

## Resultado visual esperado

```text
             [ Chat ]
                12 px
             [ IA ]
                12 px
       [ ↗ Comparar 3/4 ]

--------------------------------
       Bottom Navigation
```

---

## Critérios de aceite finais

1. Somente os três arquivos indicados foram alterados.
2. Nenhum novo componente flutuante foi criado.
3. Nenhuma lógica comercial foi modificada.
4. Chat fica acima da IA.
5. IA fica acima do Comparar.
6. O Comparar fica compacto.
7. A caixa branca excessiva foi removida.
8. Nenhum elemento fica sobreposto.
9. A bottom navigation permanece acessível.
10. O desktop não apresenta regressão.
11. Screenshots foram gerados em 360 px e 390 px.
12. O diff final foi apresentado por arquivo.

```

[Baixar o requirements corrigido](sandbox:/mnt/data/requirements-floating-widgets-mobile.md)
```
