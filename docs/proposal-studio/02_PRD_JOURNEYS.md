# 02 — PRD & User Journeys (Jornadas do Usuário)

## 1. Visão Geral do Produto
O **Avalia Solar Proposal Studio Enterprise A+++** capacita integradores solares e prestadores de serviços de transição energética a gerenciar oportunidades comerciais, personalizar modelos de proposta (PDF e Digital) e conduzir negociações em tempo real via chat com o comprador, respeitando o isolamento estrito entre empresas (multi-tenancy) e a imutabilidade jurídica de documentos publicados.

## 2. Jornadas de Usuário (User Journeys)

### J1: Configuração do Modelo e Identidade da Empresa
- **Ator:** Administrador ou Consultor Técnico da Empresa.
- **Passos:**
  1. Acessa `/dashboard/proposals` e seleciona uma proposta em rascunho.
  2. Clica na aba `Template PDF (3)`.
  3. Seleciona um dos 5 modelos oficiais: *Moderno Solar*, *Corporativo Clássico*, *Clean Minimalista*, *Executivo Premium* ou *Credenciais & Engenharia*.
  4. Escolhe a cor principal da marca (paleta WCAG segura ou código hex customizado).
  5. Ativa ou desativa seções modulares: *Sobre a Empresa*, *Garantias*, *Cronograma* e *Termos*.
  6. Se ativar uma seção vazia, o editor inline solicita o preenchimento do conteúdo antes de salvar.
  7. Clica em "Salvar Configurações do PDF".
- **Critério de Aceite:** Alterações persistem no backend e são renderizadas fielmente na prévia sem afetar outras empresas.

### J2: Construtor de Campos do Formulário
- **Ator:** Consultor Comercial.
- **Passos:**
  1. Seleciona a aba `Formulário (2)`.
  2. Ajusta a visibilidade dos campos padrão de coleta (Dados do comprador, Endereço, Consumo mensal, Tipo de telhado, Fotos do local, Observações técnicas).
  3. Clica em "Adicionar Campo" para inserir um campo personalizado (ex.: *Padrão de Entrada Trifásico*, booleano).
  4. Clica em "Salvar Formulário".
- **Critério de Aceite:** O schema JSON é validado e versionado, ficando disponível para a equipe.

### J3: Elaboração Comercial e Envio da Proposta
- **Ator:** Vendedor / Integrador.
- **Passos:**
  1. Na aba `Itens & Técnico`, cadastra módulos, inversores e serviços com quantidade e preço unitário em centavos.
  2. Na aba `Condições Comerciais (5)`, define a data limite de validade e o plano de pagamento (ex.: *À vista ou Financiamento em 84x*).
  3. Na aba `Documentos`, opta entre anexar seu próprio PDF ou gerar o PDF a partir do modelo Avalia Solar.
  4. Clica em `[Pré-visualizar]` na barra superior para revisar tanto o layout PDF quanto a Proposta Digital Web.
  5. Clica em `[Enviar proposta]` ou pelo Wizard de 7 etapas.
- **Critério de Aceite:** Proposta passa para status `sent`, ganha timestamp de publicação e se torna imutável.

### J4: Negociação Contínua e Criação de Nova Versão
- **Ator:** Vendedor e Comprador.
- **Passos:**
  1. O comprador visualiza a proposta e envia mensagem no chat solicitando alteração de potência ou desconto.
  2. A integradora recebe a mensagem no painel contextual de conversa à direita sem perder a visão da proposta.
  3. A integradora clica em `[Criar nova versão]`.
  4. O sistema gera a versão `v2` (rascunho), preservando todos os itens, termos e snapshots da `v1`.
  5. A integradora ajusta o desconto na aba `Condições Comerciais` e reenvia a proposta.
- **Critério de Aceite:** A versão `v1` permanece arquivada e inalterada no histórico; a `v2` torna-se a versão ativa.
