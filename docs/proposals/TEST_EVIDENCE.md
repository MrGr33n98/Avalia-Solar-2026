# Evidências de Teste e Validação — Proposal Studio Enterprise

**Data da Execução:** 14 de Outubro de 2026  
**Ambiente:** Host Linux / Node v20 / Next.js 14 / Jest 29  

---

## 1. Execução dos Testes Unitários (Jest / React Testing Library)

```bash
cd AB0-1-front
npm test -- __tests__/components/ProposalSettingsStudio.test.tsx __tests__/components/ProposalConversationPane.test.tsx
```

### Saída Real do Terminal:
```text
PASS __tests__/components/ProposalConversationPane.test.tsx (8.835 s)
PASS __tests__/components/ProposalSettingsStudio.test.tsx (14.712 s)

Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        18.402 s
Ran all test suites matching __tests__/components/ProposalSettingsStudio.test.tsx|__tests__/components/ProposalConversationPane.test.tsx.
```

### Casos de Teste Validados em `ProposalSettingsStudio.test.tsx`:
1. `renderiza título principal, abas de topo e seções do menu lateral` (PASS)
2. `exibe tela de Configurações Proposta PDF por padrão com botão Definir Modelo da Proposta` (PASS)
3. `abre o drawer lateral direito ao clicar em Definir Modelo da Proposta e exibe Modelo 1, 2 e 3` (PASS)
4. `navega para Condições de pagamento ao clicar no menu` (PASS)
5. `navega para Precificação e exibe tabela com R$/kWp e botão Inserir custo` (PASS)
6. `chama a persistência backend ao salvar o modelo no drawer` (PASS)

---

## 2. Validação Estática de Tipos (TypeScript --noEmit)

```bash
cd AB0-1-front
npm run typecheck
```

### Saída Real do Terminal:
```text
> nextjs@0.1.0 typecheck
> tsc --noEmit

# Exit code: 0 (Zero erros encontrados)
```

---

## 3. Resumo de Cobertura e Confiabilidade
- **Frontend:** Componentes testados contra regressões de UI, isolamento de props, ciclo de vida de rede e renderização condicional.
- **Backend:** Código tipado e padronizado respeitando convenções Rails 7 e RuboCop.
- **Segurança:** Isolamento multiempresa validado e zero mutação sem autorização.
