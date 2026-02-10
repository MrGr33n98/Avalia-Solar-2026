# CNPJ opcional no Active Admin (2026-02-10)

## Resumo
- O campo `cnpj` deixou de ser obrigatorio para cadastro e edicao de empresas no Active Admin.
- Empresas agora podem ser criadas e atualizadas com `cnpj` vazio.
- A coluna no banco permanece aceitando `NULL` e foi adicionada migracao defensiva para garantir esse comportamento.

## O que mudou no backend
- Modelo `Company`:
  - Removida a validacao que exigia CNPJ quando `verified = true`.
  - Mantida validacao de formato quando o CNPJ for informado.
- Active Admin (`admin/companies`):
  - Campo `cnpj` marcado explicitamente como opcional no formulario.
- Banco de dados:
  - Nova migracao garante `companies.cnpj` com `NULL` permitido.

## Impacto para suporte
- Nao tratar ausencia de CNPJ como erro de cadastro no painel administrativo.
- Se a empresa informar CNPJ, o formato continua validado.
- Casos antigos com CNPJ vazio passam a ser comportamento esperado.

## Impacto para frontend
- Frontend nao deve assumir que toda empresa possui `cnpj`.
- Exibicao recomendada:
  - Se `cnpj` estiver vazio, mostrar `Nao informado` (ou ocultar o campo).
- Validacoes client-side devem aceitar `cnpj` vazio para fluxos administrativos.

## Testes automatizados adicionados/ajustados
- Criacao via Active Admin sem CNPJ.
- Edicao via Active Admin limpando CNPJ.
- Edicao via Active Admin marcando empresa como `verified` sem CNPJ.
- Verificacao de que o input `cnpj` nao e renderizado como `required` no form.
- Modelo `Company` validando que:
  - sem CNPJ continua valido;
  - com CNPJ informado invalido retorna erro.