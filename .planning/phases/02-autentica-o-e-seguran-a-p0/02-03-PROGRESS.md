- Múltiplos ajustes no ambiente de testes devido a incompatibilidades de bibliotecas (troca de `@testing-library/react-native` por `react-test-renderer` e depois conserto do mock do `ActivityIndicator`). Testes passando com sucesso.
- `useProtectedAction.ts` foi implementado para verificar ações baseadas em sessão e redirecionar para a página de perfil ou mostrar um aviso caso a ação não esteja autorizada.
- `LoginGate.tsx` foi criado com testes extensivos passando (`npm test -- LoginGate`).
- A tela de login (`profile.tsx`) já estava previamente integrada ao Auth Store, apenas criamos `src/app/__tests__/profile.test.tsx` garantindo a cobertura dos fluxos de submit e carregamento e todos os testes passaram com sucesso (`npm test -- profile`).

Resta a **Task 3: End-to-End Auth Validation**, que requer verificação humana no App.
