<!-- Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V3 -->

# PRD de Auditoria UI/UX — Aba Informações Gerais

**Versão:** 1.0  
**Data:** 16/08/2026  
**Status:** Proposta para implementação  
**Escopo:** frontend web, aba `Perfil da Empresa > Informações Gerais`  
**Artefatos analisados:** implementação atual em `CompanyInfo.tsx`, contêiner em `EnterpriseDashboard.tsx` e HTML de referência fornecido pelo usuário.

## 1. Resumo executivo

A implementação atual e a referência têm praticamente a mesma arquitetura de conteúdo: cabeçalho, status, CTA de edição, linha de ativos de marca, pares de cards informativos e seções operacionais. A principal diferença não é funcional; é a linguagem de superfície.

A referência comunica um painel SaaS leve e agrupado por meio de:

- cards externos com raio de 12 px, borda de 1 px e sombra discreta;
- campos internos com raios entre 4 e 8 px;
- botões com raios entre 6 e 8 px;
- espaçamento vertical e entre cards de 24 px;
- distinção de profundidade entre página, seção, campo e ação.

A tela atual remove intencionalmente quase todos esses raios dentro de `SectionCard`, inclusive nos componentes descendentes. O resultado é mais rígido, tabular e denso. A ausência simultânea de raio e sombra faz com que bordas de mesma cor tenham de cumprir sozinhas toda a separação visual.

**Recomendação:** adotar a geometria da referência sem copiar seu HTML: raio moderado e hierárquico, borda neutra de 1 px, sombra mínima apenas nos cards de seção e manutenção dos tokens/marca existentes.

## 2. Objetivo do produto

Melhorar a legibilidade, a percepção de agrupamento e a segurança de interação da aba sem alterar regras de negócio, contratos de API ou arquitetura de dados.

### Resultado esperado

O usuário deve identificar em poucos segundos:

1. o estado de publicação da empresa;
2. a ação principal de editar;
3. os grandes grupos de informação;
4. quais elementos são apenas leitura e quais são acionáveis;
5. onde salvar ou cancelar quando estiver editando.

## 3. Fora de escopo

- Mudanças no backend, payloads, aprovação no Active Admin ou uploads.
- Reescrita do conteúdo das seções.
- Troca da paleta de marca ou da família tipográfica global.
- Cópia literal do HTML de referência.
- Redesenho das demais abas do dashboard nesta primeira entrega.

## 4. Comparativo atual × referência

| Dimensão | Implementação atual | Referência | Impacto percebido |
| --- | --- | --- | --- |
| Card de seção | `rounded-none`, borda `slate-200`, sem sombra | `rounded-xl` (12 px), borda `slate-200`, `shadow-sm` | Atual parece rígida; referência separa melhor os blocos do fundo |
| Elementos internos | Raios declarados são anulados pelo seletor do card | Raios de 4–8 px conforme o nível | Atual perde hierarquia entre contêiner, campo e ação |
| Botão de recolher | Retangular, caixa alta, raio zero | `rounded-md` (6 px), caixa alta | Referência preserva caráter utilitário sem parecer uma célula de tabela |
| Ícone do cabeçalho | Caixa 36 px, raio zero | Caixa 32 px, raio 4 px | Referência integra o ícone sem criar um bloco duro |
| Campos de informação | Fundo `slate-50/70`, raio originalmente 12 px, anulado no card | Fundo branco ou `slate-50`, raio 4–8 px | Referência diferencia campo auxiliar de card principal |
| Espaço entre seções | 16–20 px | 24 px | Atual é mais compacta e visualmente contínua |
| Largura do conteúdo | máximo de 1200 px | `max-w-7xl` (1280 px) | Referência respira mais em telas largas |
| Grid principal | assimetria só em `xl`, 1.35/0.65 | assimetria em `lg`, 2/3 + 1/3 | Referência usa melhor notebooks; atual empilha por mais tempo |
| Título da página | Renderizado no contêiner e novamente no componente | Um único cabeçalho | Atual cria redundância de título e descrição |
| Banner | altura mínima fixa e imagem com fundo desfocado | proporção aproximada de 16:5 | Atual protege imagens diversas; referência mantém proporção previsível |
| Estados | loading, erro, vazio, edição e aprovação implementados | referência majoritariamente estática | Atual é funcionalmente superior e deve ser preservada |

## 5. Auditoria Hallmark — achados priorizados

### Críticos

#### [critical] Anulação global da hierarquia de raios — `CompanyInfo.tsx:270–300`

O `SectionCard` força `rounded-none` no card e também em descendentes com `rounded-2xl`, `rounded-full`, `rounded-lg` e `rounded-xl`. Isso transforma badges, botões, avatares, estados vazios e campos internos em retângulos, mesmo quando cada componente declara outra semântica visual.

**Correção:** remover os seletores descendentes e aplicar o raio apenas no contêiner do card. Cada componente filho deve manter seu próprio token de raio.

#### [critical] Cabeçalho duplicado — `EnterpriseDashboard.tsx:520–530` e `CompanyInfo.tsx:757–794`

O título “Informações gerais” e sua descrição aparecem no contêiner da aba e novamente dentro de `CompanyInfo`. A duplicação enfraquece a hierarquia e aumenta o deslocamento até a primeira ação útil.

**Correção:** eleger `CompanyInfo` como proprietário único do cabeçalho completo e remover o cabeçalho redundante do `TabsContent`, ou parametrizar o componente para uma única renderização.

### Maiores

#### [major] Contorno sem elevação — `CompanyInfo.tsx:270–276`

Card branco, fundo claro, borda clara e `shadow-none` produzem pouca separação em monitores de baixo contraste. A referência usa borda mais sombra mínima, não uma sombra decorativa pesada.

**Correção:** usar `border-slate-200 shadow-sm` nos cards de seção; manter itens internos sem sombra.

#### [major] Densidade vertical excessiva — `CompanyInfo.tsx:735–740`, `796` e `879`

O contêiner usa `space-y-5` e grids usam `gap-4`; a referência usa 24 px (`space-y-6`, `gap-6`). Em uma página longa com muitos contornos, 16 px faz as bordas competirem entre si.

**Correção:** padronizar 24 px entre seções principais e manter 12–16 px apenas dentro das seções.

#### [major] Breakpoint tardio para o layout assimétrico — `CompanyInfo.tsx:796`

A composição banner + identidade só ganha colunas em `xl`. A referência entra em colunas em `lg`, aproveitando melhor notebooks e reduzindo a altura total.

**Correção:** validar `lg:grid-cols-3`, banner com `lg:col-span-2`, identidade com uma coluna; retornar a uma coluna quando a largura útil do dashboard não comportar ao menos 280 px no card lateral.

#### [major] Semântica visual de “Fechar” pouco natural

“Fechar” normalmente encerra modal ou página; aqui o controle apenas recolhe uma seção. A referência mantém o texto, mas o PRD não precisa importar essa ambiguidade.

**Correção:** usar “Recolher”/“Expandir”, manter `aria-expanded` e adicionar `aria-controls` apontando para uma região identificada.

### Menores

#### [minor] Capitalização inconsistente dos títulos de seção

Exemplos como “Ativo Corporativo da Marca”, “Conectividade Global” e “Área de abrangência” misturam title case e sentence case.

**Correção:** adotar sentence case em português: “Ativo corporativo da marca”, “Conectividade global”, “Informações técnicas essenciais”.

#### [minor] A referência usa mais raios do que o necessário em elementos informativos

O HTML de referência contém alta repetição de `rounded-lg` e `rounded-md`. Copiar tudo literalmente criaria excesso de caixas suaves.

**Correção:** limitar a escala a quatro papéis claros: card 12 px; campo/estado 8 px; botão 8 px; ícone auxiliar 6 px; badge de status em formato pill.

#### [minor] Link visual do banner não tem função explícita — `CompanyInfo.tsx:833–836`

“Banner da Empresa” usa cor de link, mas é um `span`, não uma ação.

**Correção:** tornar texto neutro se for legenda ou convertê-lo em link/botão real se houver destino.

**Resumo Hallmark:** 2 críticos · 4 maiores · 3 menores.  
**Veredito:** funcionalmente sólida, mas a geometria atual lê como painel rígido e a duplicação de cabeçalho compromete a hierarquia.

## 6. Direção de bordas e geometria

### 6.1 Escala recomendada

| Papel | Borda | Raio | Sombra | Fundo |
| --- | --- | --- | --- | --- |
| Card de seção | 1 px `slate-200` | 12 px | `shadow-sm` | branco |
| Header do card | divisor inferior 1 px `slate-100` | herda cantos superiores | nenhuma | branco |
| Campo informativo | 1 px `slate-200` | 8 px | nenhuma | branco ou `slate-50/70` |
| Estado vazio/alerta | 1 px na cor semântica suave | 8 px | nenhuma | tom semântico claro |
| Botão primário | sem borda adicional | 8 px | nenhuma | azul da marca |
| Botão secundário | 1 px `slate-200` | 8 px | nenhuma | branco |
| Botão destrutivo secundário | 1 px `red-100` | 8 px | nenhuma | branco |
| Ícone de seção | sem borda | 6 px | nenhuma | azul claro |
| Badge de status | 1 px semântica | pill | nenhuma | tom semântico claro |

### 6.2 Regras

- Não usar raio zero como regra global de descendentes.
- Não acumular sombra em card interno, botão e card externo ao mesmo tempo.
- A borda deve expressar agrupamento; cor e preenchimento devem expressar estado.
- Estados de foco não podem depender apenas da borda neutra: usar `focus-visible` com anel de 2 px e contraste AA.
- Campos desabilitados, loading, erro e sucesso devem ter tratamento distinto e não apenas mudança de opacidade.

## 7. Requisitos funcionais e de interação

### RF-01 — Cabeçalho único

A aba deve exibir um único título, uma única descrição, os badges de contexto/status e o CTA principal.

### RF-02 — Edição global compreensível

Ao acionar “Editar informações”, os botões “Cancelar” e “Salvar alterações” devem permanecer fáceis de encontrar. Em páginas longas, avaliar barra de ações sticky dentro da área de conteúdo, respeitando safe-area e sem cobrir campos.

### RF-03 — Recolhimento acessível

Cada seção recolhível deve:

- expor `aria-expanded`;
- referenciar o conteúdo por `aria-controls`;
- manter foco visível;
- preservar o estado durante a sessão da aba;
- usar rótulos “Recolher” e “Expandir”.

### RF-04 — Estados existentes preservados

Manter loading, erro de carregamento, empresa ausente, upload, remoção indisponível, aprovação pendente, edição, salvamento e estados vazios.

### RF-05 — Upload com affordance correta

O controle deve continuar acionável por teclado e leitor de tela. A área clicável deve ter no mínimo 44 × 44 px em mobile.

## 8. Responsividade

- Validar larguras de 320, 375, 414 e 768 px, além de desktop.
- Não permitir rolagem horizontal.
- Em mobile, ações do cabeçalho devem ocupar a largura disponível sem cortar texto.
- Nenhum botão deve quebrar o rótulo em duas linhas.
- Cards com mídia devem usar `minmax(0, 1fr)` e conteúdo com `min-w-0`.
- O banner deve preservar proporção estável; recomendar `aspect-[16/5]` com altura mínima apenas para o estado vazio.
- Grids de três colunas devem cair para uma coluna em mobile e somente subir quando os rótulos couberem sem truncamento indevido.

## 9. Acessibilidade

- Contraste mínimo WCAG AA para texto, ícones e foco.
- `focus-visible` em botão, upload, link e controle de recolhimento.
- Não remover `outline` sem substituição equivalente.
- Ícones decorativos com `aria-hidden`; imagens informativas com `alt` contextual.
- Mensagens de salvamento/erro anunciadas com região viva apropriada.
- Movimento de aprovação deve respeitar `prefers-reduced-motion`.

## 10. Critérios de aceite

- [ ] Existe apenas um cabeçalho “Informações gerais”.
- [ ] Cards principais usam raio de 12 px, borda de 1 px e sombra discreta.
- [ ] Componentes filhos não têm seus raios anulados pelo card pai.
- [ ] A escala de raios está limitada aos papéis definidos neste PRD.
- [ ] A separação entre seções principais é de 24 px.
- [ ] Itens internos não recebem sombra.
- [ ] “Recolher/Expandir” funciona com mouse, teclado e leitor de tela.
- [ ] Loading, erro, vazio, edição e aprovação continuam funcionando.
- [ ] Não há overflow horizontal em 320, 375, 414 e 768 px.
- [ ] Todos os alvos interativos principais medem ao menos 44 px em mobile.
- [ ] `npm run lint`, `npm run typecheck` e os testes relevantes passam.
- [ ] Teste visual cobre modo leitura, modo edição, estado vazio e aprovação pendente.

## 11. Plano de entrega

### Fase 1 — Correção estrutural (P0)

1. Remover o cabeçalho duplicado.
2. Eliminar os seletores que forçam `rounded-none` nos descendentes.
3. Aplicar escala de bordas, raios e sombra apenas no `SectionCard` e componentes semânticos.

### Fase 2 — UX e acessibilidade (P1)

1. Trocar “Fechar/Abrir” por “Recolher/Expandir”.
2. Completar `aria-controls`, ids de região e foco visível.
3. Revisar sticky actions durante edição, caso testes indiquem perda frequente do CTA de salvar.

### Fase 3 — Validação responsiva (P1)

1. Ajustar breakpoint do grid de ativos de marca.
2. Validar banner e targets de 44 px.
3. Criar snapshots/testes visuais nos estados principais.

## 12. Métricas de sucesso

Como não há baseline fornecida, as metas numéricas devem ser definidas após instrumentação. Medir:

- taxa de início e conclusão de edição;
- abandono após iniciar edição;
- erros de validação por tentativa de salvamento;
- tempo mediano entre abrir a aba e salvar;
- uso de recolher/expandir por seção;
- ocorrências de overflow e erros visuais nos testes automatizados.

## 13. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Reintroduzir aparência excessivamente “fofa” | Usar raio moderado, sem gradientes e sem sombras em elementos internos |
| Alterar todas as abas sem validação | Escopar tokens inicialmente ao `CompanyInfo` |
| Quebrar grids dentro do dashboard lateral | Testar largura útil do conteúdo, não apenas viewport |
| Perder estados funcionais durante o ajuste visual | Não reescrever handlers; mudar apenas camada visual e semântica |
| Referência estática omitir casos reais | Preservar os estados já existentes na implementação atual |

## 14. Decisão recomendada

Adotar a referência como direção de **geometria e ritmo**, não como especificação literal. A implementação atual tem maior maturidade funcional; deve conservar seus estados e comportamento. O melhor resultado combina a robustez atual com a escala visual da referência: card de 12 px, campos e ações de 8 px, borda neutra de 1 px, sombra mínima e espaçamento principal de 24 px.
