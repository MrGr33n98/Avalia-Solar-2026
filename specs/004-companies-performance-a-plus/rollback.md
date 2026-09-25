# Plano de Rollback — /companies Performance A+++

- **Commit Base:** `5d2488afbaf7ab82a072266b2018a73a110e4d3e`
- **Branch:** `feat/companies-performance-a-plus`

## Procedimento de Rollback
1. Se houver qualquer regressão funcional em produção ou CI:
   ```bash
   git checkout main
   git revert --no-edit <release-commit-sha>
   git push origin main
   ```
2. **Impacto em Banco de Dados:**
   - ZERO migrations destrutivas. Nenhuma tabela alterada ou dropada.
3. **Impacto em Cache:**
   - O versionamento de chaves de cache no backend (`companies:index:v6:...` ou `v7`) isola versões antigas de novas, permitindo reversão imediata sem contaminação de Redis.
4. **Verificação de Integridade Pós-Rollback:**
   - Acessar `https://www.avaliasolar.com.br/companies`.
   - Verificar retorno HTTP 200 e integridade dos cards existentes.
