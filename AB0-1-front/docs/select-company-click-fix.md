# Fix: Seleção de Empresa em `/select-company`

## Resumo
Ao clicar em uma empresa na página `/select-company`, a seleção parecia não surtir efeito em algumas situações. O clique ocorria, mas a empresa ativa não era persistida no backend, causando inconsistência ao navegar para áreas que dependem da empresa ativa.

## Causa raiz
- Parte do fluxo de seleção (ex.: seletor no menu) atualizava apenas o estado local (`localStorage`) e um cookie não-assinado via `document.cookie`.
- O backend usa **cookie assinado (HTTP-only)** e `current_user.company_id` para definir a empresa ativa.
- Na tela `/select-company`, falhas na persistência (401/403 ou erros de rede) eram ignoradas e o usuário era redirecionado mesmo sem confirmação do backend, causando sensação de “clique não seleciona”.

## Correção aplicada
- Foi criado o método `selectCompany` no `CompanyContext` para:
  - Atualizar o estado local de forma otimista.
  - Persistir a empresa ativa no backend via `company_access/select_active_company`.
  - Reverter a seleção local em caso de falha.
- A página `/select-company` e os seletores no menu agora utilizam `selectCompany` e exibem erro caso a persistência falhe.
- Proteção contra múltiplos cliques e feedback visual de carregamento durante a seleção.

## Arquivos alterados
- `AB0-1-front/context/CompanyContext.tsx`
- `AB0-1-front/app/select-company/page.tsx`
- `AB0-1-front/components/company/CompanySwitcher.tsx`
- `AB0-1-front/components/company/CompanySelectorModal.tsx`

## Testes
- Não foi possível executar testes automatizados nem validar em navegadores no ambiente atual.
- Testes manuais recomendados:
  1. Logar com usuário `company`.
  2. Acessar `/select-company`.
  3. Selecionar empresas diferentes e confirmar redirecionamento.
  4. Verificar que o dashboard carrega os dados da empresa selecionada.
  5. Repetir em Chrome, Firefox e Safari (desktop e mobile).
